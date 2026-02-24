/**
 * adminAuth.ts
 * 관리자 권한 체계
 * - admin: 전체 권한 (기존 관리자)
 * - sub: 부운영자 — users-org, airdrop 제외한 권한
 *
 * Firestore 컬렉션: sub_admins
 * 문서 구조: { username, passwordHash, permissions, note, createdAt, updatedAt }
 *
 * localStorage:
 *   alphabag_admin_authenticated = "true"
 *   alphabag_admin_role          = "admin" | "sub"
 *   alphabag_admin_subid         = <sub_admin doc id>  (sub 전용)
 */

import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

// ── 권한 키 목록 ─────────────────────────────────────────────────────────────
export type AdminPermission =
  | "dashboard"
  | "plans"
  | "content"
  | "assets"
  | "support"
  | "notifications";

/** 부운영자에게 허용 가능한 권한 목록 (users-org, airdrop 제외) */
export const SUB_ADMIN_PERMISSIONS: { key: AdminPermission; label: string }[] = [
  { key: "dashboard",     label: "Dashboard (대시보드)" },
  { key: "plans",         label: "Plans (상품 관리)" },
  { key: "content",       label: "Content (콘텐츠 관리)" },
  { key: "assets",        label: "Assets (자산 관리)" },
  { key: "support",       label: "Support Tickets (지원 티켓)" },
  { key: "notifications", label: "Notifications (알림 관리)" },
];

/** 모든 허용 권한 (기본값) */
export const ALL_SUB_PERMISSIONS: AdminPermission[] = SUB_ADMIN_PERMISSIONS.map(p => p.key);

// ── 부운영자 인터페이스 ───────────────────────────────────────────────────────
export interface SubAdmin {
  id: string;
  username: string;
  passwordHash: string;
  permissions: AdminPermission[];
  note?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

const COLLECTION = "sub_admins";
const CACHE_TTL  = 5 * 60 * 1000; // 5분

// ── SHA-256 ──────────────────────────────────────────────────────────────────
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── 현재 로그인 정보 ─────────────────────────────────────────────────────────
export function getAdminRole(): "admin" | "sub" | null {
  if (!localStorage.getItem("alphabag_admin_authenticated")) return null;
  return (localStorage.getItem("alphabag_admin_role") as "admin" | "sub") ?? "admin";
}

export function getSubAdminId(): string | null {
  return localStorage.getItem("alphabag_admin_subid");
}

export function isAdmin(): boolean {
  return getAdminRole() === "admin";
}

export function isSub(): boolean {
  return getAdminRole() === "sub";
}

/** 현재 로그인 세션의 권한 목록 반환 (admin이면 모든 권한 포함) */
export function getSessionPermissions(): AdminPermission[] | "all" {
  const role = getAdminRole();
  if (role === "admin") return "all";
  const raw = localStorage.getItem("alphabag_admin_permissions");
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AdminPermission[];
  } catch {
    return [];
  }
}

/** 특정 권한 보유 여부 확인 */
export function hasPermission(perm: AdminPermission): boolean {
  const perms = getSessionPermissions();
  if (perms === "all") return true;
  return perms.includes(perm);
}

/** 로그아웃 */
export function clearAdminSession(): void {
  localStorage.removeItem("alphabag_admin_authenticated");
  localStorage.removeItem("alphabag_admin_role");
  localStorage.removeItem("alphabag_admin_subid");
  localStorage.removeItem("alphabag_admin_permissions");
}

// ── 부운영자 로그인 검증 ─────────────────────────────────────────────────────
export async function verifySubAdminCredentials(
  username: string,
  password: string
): Promise<SubAdmin | null> {
  try {
    const inputHash = await sha256(password);
    const colRef = collection(db, COLLECTION);
    const snap = await getDocs(colRef);

    for (const d of snap.docs) {
      const data = d.data() as Omit<SubAdmin, "id">;
      if (data.username === username && data.passwordHash === inputHash) {
        return { id: d.id, ...data };
      }
    }
    return null;
  } catch (e) {
    console.error("verifySubAdminCredentials error:", e);
    return null;
  }
}

// ── 부운영자 CRUD ────────────────────────────────────────────────────────────

/** 전체 부운영자 목록 */
export async function getAllSubAdmins(): Promise<SubAdmin[]> {
  try {
    const colRef = collection(db, COLLECTION);
    const q = query(colRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SubAdmin));
  } catch (e) {
    // orderBy가 실패하면 정렬 없이 조회
    const snap = await getDocs(collection(db, COLLECTION));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SubAdmin));
  }
}

/** 부운영자 생성 */
export async function createSubAdmin(params: {
  username: string;
  password: string;
  permissions: AdminPermission[];
  note?: string;
}): Promise<{ ok: boolean; message: string; id?: string }> {
  if (!params.username.trim() || params.username.length < 3) {
    return { ok: false, message: "아이디는 3자 이상이어야 합니다." };
  }
  if (!params.password || params.password.length < 6) {
    return { ok: false, message: "비밀번호는 6자 이상이어야 합니다." };
  }

  // 중복 확인
  const existing = await getAllSubAdmins();
  if (existing.some(a => a.username === params.username.trim())) {
    return { ok: false, message: "이미 사용 중인 아이디입니다." };
  }

  const passwordHash = await sha256(params.password);
  const newRef = doc(collection(db, COLLECTION));
  await setDoc(newRef, {
    username: params.username.trim(),
    passwordHash,
    permissions: params.permissions,
    note: params.note ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { ok: true, message: "부운영자가 생성되었습니다.", id: newRef.id };
}

/** 부운영자 정보 수정 */
export async function updateSubAdmin(
  id: string,
  params: {
    username?: string;
    password?: string;
    permissions?: AdminPermission[];
    note?: string;
  }
): Promise<{ ok: boolean; message: string }> {
  if (!id) return { ok: false, message: "유효하지 않은 ID입니다." };

  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };

  if (params.username !== undefined) {
    if (params.username.trim().length < 3) {
      return { ok: false, message: "아이디는 3자 이상이어야 합니다." };
    }
    // 다른 부운영자와 중복 확인
    const existing = await getAllSubAdmins();
    if (existing.some(a => a.username === params.username!.trim() && a.id !== id)) {
      return { ok: false, message: "이미 사용 중인 아이디입니다." };
    }
    updates.username = params.username.trim();
  }

  if (params.password !== undefined && params.password !== "") {
    if (params.password.length < 6) {
      return { ok: false, message: "비밀번호는 6자 이상이어야 합니다." };
    }
    updates.passwordHash = await sha256(params.password);
  }

  if (params.permissions !== undefined) {
    updates.permissions = params.permissions;
  }

  if (params.note !== undefined) {
    updates.note = params.note;
  }

  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, updates);

  // 현재 로그인한 부운영자가 자신의 정보를 수정한 경우 권한 캐시 갱신
  if (params.permissions && getSubAdminId() === id) {
    localStorage.setItem("alphabag_admin_permissions", JSON.stringify(params.permissions));
  }

  return { ok: true, message: "부운영자 정보가 수정되었습니다." };
}

/** 부운영자 삭제 */
export async function deleteSubAdmin(id: string): Promise<{ ok: boolean; message: string }> {
  if (!id) return { ok: false, message: "유효하지 않은 ID입니다." };
  await deleteDoc(doc(db, COLLECTION, id));
  return { ok: true, message: "부운영자가 삭제되었습니다." };
}

/** 부운영자 단일 조회 */
export async function getSubAdmin(id: string): Promise<SubAdmin | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as SubAdmin;
}
