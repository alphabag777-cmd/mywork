/**
 * Event Banners - Firebase-backed event banners with countdown support
 */
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface EventBanner {
  id: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  bgColor?: string; // tailwind gradient or hex
  textColor?: string;
  endsAt: number; // epoch ms – 0 means no countdown
  isActive: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

const COLLECTION = "event_banners";

function fromFirestore(data: any, id: string): EventBanner {
  const ts = (t: any): number => {
    if (t instanceof Timestamp) return t.toMillis();
    if (typeof t === "number") return t;
    return 0;
  };
  return {
    id,
    title: data.title || "",
    subtitle: data.subtitle || "",
    ctaText: data.ctaText || "",
    ctaUrl: data.ctaUrl || "",
    bgColor: data.bgColor || "from-primary/20 to-primary/5",
    textColor: data.textColor || "",
    endsAt: ts(data.endsAt),
    isActive: data.isActive !== false,
    order: typeof data.order === "number" ? data.order : 0,
    createdAt: ts(data.createdAt),
    updatedAt: ts(data.updatedAt),
  };
}

export async function getActiveEventBanners(): Promise<EventBanner[]> {
  try {
    // orderBy 없이 전체 조회 후 클라이언트 필터링 (인덱스 불필요)
    const snap = await getDocs(collection(db, COLLECTION));
    const now = Date.now();
    return snap.docs
      .map((d) => fromFirestore(d.data(), d.id))
      .filter((b) => b.isActive && (b.endsAt === 0 || b.endsAt > now))
      .sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

export async function getAllEventBanners(): Promise<EventBanner[]> {
  try {
    // orderBy 없이 전체 조회 후 클라이언트 정렬 (인덱스 불필요)
    const snap = await getDocs(collection(db, COLLECTION));
    return snap.docs
      .map((d) => fromFirestore(d.data(), d.id))
      .sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

export async function saveEventBanner(
  banner: Omit<EventBanner, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<EventBanner> {
  const now = Date.now();
  const id = banner.id || `banner_${now}_${Math.random().toString(36).slice(2, 8)}`;
  const data: EventBanner = {
    ...banner,
    id,
    createdAt: now,
    updatedAt: now,
  };
  // undefined 필드 제거 후 Firestore 저장 (undefined는 Firestore 에러 원인)
  const firestoreData: Record<string, any> = {
    id: data.id,
    title: data.title || "",
    subtitle: data.subtitle || "",
    ctaText: data.ctaText || "",
    ctaUrl: data.ctaUrl || "",
    bgColor: data.bgColor || "from-primary/20 to-primary/5",
    textColor: data.textColor || "",
    endsAt: data.endsAt > 0 ? Timestamp.fromMillis(data.endsAt) : 0,
    isActive: data.isActive !== false,
    order: typeof data.order === "number" ? data.order : 0,
    createdAt: Timestamp.fromMillis(now),
    updatedAt: Timestamp.fromMillis(now),
  };
  await setDoc(doc(db, COLLECTION, id), firestoreData);
  return data;
}

export async function deleteEventBanner(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
