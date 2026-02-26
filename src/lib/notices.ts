/**
 * Notice storage and management utilities
 * Handles CRUD operations for notices using Firebase Firestore
 *
 * ■ 데이터 구조 변경 (v2)
 *   - points: string[]  →  content: string  (자유 형식 텍스트)
 *   - 하위 호환성: 기존 points 배열 데이터는 content 로 자동 변환
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Notice {
  id: string;
  title?: string;           // 제목 (선택)
  content: string;          // 본문 자유 텍스트 (줄바꿈 지원)
  /** @deprecated 하위 호환용 — 신규 저장 시 사용 안 함 */
  points?: string[];
  type: "popup" | "normal";
  isActive: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

const NOTICES_COLLECTION = "notices";

function timestampToNumber(ts: any): number {
  if (ts?.toMillis) return ts.toMillis();
  if (ts?.seconds) return ts.seconds * 1000;
  return ts || Date.now();
}

/** points[] → content string 하위 호환 변환 */
function pointsToContent(points: string[]): string {
  return points.filter(Boolean).join("\n\n");
}

function fromFirestore(data: any, id: string): Notice {
  // content 없으면 기존 points 배열에서 변환
  const content: string =
    data.content != null
      ? data.content
      : Array.isArray(data.points) && data.points.length > 0
      ? pointsToContent(data.points)
      : "";

  return {
    id,
    title: data.title || "",
    content,
    points: Array.isArray(data.points) ? data.points : [],   // 읽기 전용 하위 호환
    type: data.type || "normal",
    isActive: data.isActive !== undefined ? data.isActive : true,
    sortOrder: data.sortOrder !== undefined ? data.sortOrder : 999999,
    createdAt: timestampToNumber(data.createdAt),
    updatedAt: timestampToNumber(data.updatedAt),
  };
}

function toFirestore(notice: Partial<Notice>): any {
  const now = Timestamp.now();
  // content → points 동기화 저장 (검색/호환용)
  const content = notice.content || "";
  const points = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return {
    title: notice.title || "",
    content,
    points,                 // 호환용 병렬 저장
    type: notice.type || "normal",
    isActive: notice.isActive !== undefined ? notice.isActive : true,
    sortOrder: notice.sortOrder !== undefined ? notice.sortOrder : 999999,
    createdAt: notice.createdAt ? Timestamp.fromMillis(notice.createdAt) : now,
    updatedAt: now,
  };
}

// ── 공개 API ──────────────────────────────────────────────────────────────────

export async function getActiveNotice(): Promise<Notice | null> {
  try {
    const snap = await getDocs(collection(db, NOTICES_COLLECTION));
    const active: Notice[] = [];
    snap.forEach((d) => {
      const n = fromFirestore(d.data(), d.id);
      if (n.isActive) active.push(n);
    });
    if (active.length === 0) return null;
    active.sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt - a.createdAt);
    return active[0];
  } catch (err) {
    console.error("getActiveNotice:", err);
    const local = getNoticesFromLocal().filter((n) => n.isActive);
    if (!local.length) return null;
    local.sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt - a.createdAt);
    return local[0];
  }
}

export async function getActivePopupNotices(): Promise<Notice[]> {
  try {
    const snap = await getDocs(query(collection(db, NOTICES_COLLECTION)));
    const result: Notice[] = [];
    snap.forEach((d) => {
      const n = fromFirestore(d.data(), d.id);
      if (n.isActive && n.type === "popup") result.push(n);
    });
    return result.sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt - a.createdAt);
  } catch (err) {
    console.error("getActivePopupNotices:", err);
    return getNoticesFromLocal().filter((n) => n.isActive && n.type === "popup");
  }
}

export async function getAllNotices(): Promise<Notice[]> {
  try {
    const snap = await getDocs(collection(db, NOTICES_COLLECTION));
    const result: Notice[] = [];
    snap.forEach((d) => result.push(fromFirestore(d.data(), d.id)));
    return result.sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt - a.createdAt);
  } catch (err) {
    console.error("getAllNotices:", err);
    return getNoticesFromLocal();
  }
}

export async function getNoticeById(id: string): Promise<Notice | null> {
  try {
    const snap = await getDoc(doc(db, NOTICES_COLLECTION, id));
    return snap.exists() ? fromFirestore(snap.data(), snap.id) : null;
  } catch (err) {
    console.error("getNoticeById:", err);
    return getNoticesFromLocal().find((n) => n.id === id) || null;
  }
}

export async function saveNotice(
  notice: Omit<Notice, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<Notice> {
  try {
    const now = Date.now();
    const noticeId = notice.id || `notice_${now}_${Math.random().toString(36).slice(2, 11)}`;
    const existing = notice.id ? await getNoticeById(notice.id) : null;

    const data = toFirestore({
      ...notice,
      createdAt: existing?.createdAt || now,
    });

    await setDoc(doc(db, NOTICES_COLLECTION, noticeId), data);

    const saved: Notice = {
      ...notice,
      id: noticeId,
      content: notice.content || "",
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    } as Notice;

    saveNoticeToLocal(saved);
    return saved;
  } catch (err) {
    console.error("saveNotice:", err);
    return saveNoticeToLocal(notice);
  }
}

export async function deleteNotice(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, NOTICES_COLLECTION, id));
    deleteNoticeFromLocal(id);
    return true;
  } catch (err) {
    console.error("deleteNotice:", err);
    return deleteNoticeFromLocal(id);
  }
}

// ── LocalStorage fallback ─────────────────────────────────────────────────────

const LS_KEY = "alphabag_notices";

function getNoticesFromLocal(): Notice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as any[];
    // 기존 points 배열 데이터 자동 마이그레이션
    return arr.map((d) => fromFirestore(d, d.id));
  } catch {
    return [];
  }
}

function saveNoticeToLocal(
  notice: Omit<Notice, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Notice {
  if (typeof window === "undefined") throw new Error("window undefined");
  const list = getNoticesFromLocal();
  const now = Date.now();

  if (notice.id && list.some((n) => n.id === notice.id)) {
    const updated = list.map((n) =>
      n.id === notice.id
        ? { ...n, ...notice, id: notice.id!, updatedAt: now }
        : n
    );
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    return updated.find((n) => n.id === notice.id)!;
  }

  const newNotice: Notice = {
    id: notice.id || `notice_${now}_${Math.random().toString(36).slice(2, 11)}`,
    title: notice.title || "",
    content: notice.content || "",
    points: [],
    type: notice.type || "normal",
    isActive: notice.isActive !== undefined ? notice.isActive : true,
    sortOrder: notice.sortOrder !== undefined ? notice.sortOrder : 999999,
    createdAt: now,
    updatedAt: now,
  };
  list.push(newNotice);
  localStorage.setItem(LS_KEY, JSON.stringify(list));
  return newNotice;
}

function deleteNoticeFromLocal(id: string): boolean {
  if (typeof window === "undefined") return false;
  const list = getNoticesFromLocal();
  const filtered = list.filter((n) => n.id !== id);
  if (filtered.length === list.length) return false;
  localStorage.setItem(LS_KEY, JSON.stringify(filtered));
  return true;
}
