/**
 * Event Banners - Firebase-backed event banners with countdown support
 */
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  where,
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
    const snap = await getDocs(
      query(
        collection(db, COLLECTION),
        where("isActive", "==", true),
        orderBy("order", "asc")
      )
    );
    const now = Date.now();
    return snap.docs
      .map((d) => fromFirestore(d.data(), d.id))
      .filter((b) => b.endsAt === 0 || b.endsAt > now);
  } catch {
    return [];
  }
}

export async function getAllEventBanners(): Promise<EventBanner[]> {
  try {
    const snap = await getDocs(
      query(collection(db, COLLECTION), orderBy("order", "asc"))
    );
    return snap.docs.map((d) => fromFirestore(d.data(), d.id));
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
  await setDoc(doc(db, COLLECTION, id), {
    ...data,
    endsAt: data.endsAt ? Timestamp.fromMillis(data.endsAt) : 0,
    createdAt: Timestamp.fromMillis(now),
    updatedAt: Timestamp.fromMillis(now),
  });
  return data;
}

export async function deleteEventBanner(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
