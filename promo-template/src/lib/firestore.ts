/**
 * firestore.ts — Firestore CRUD helpers
 * 문의 접수, 공지사항 조회 등 공통 기능
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { siteConfig } from "../site.config";

// ─── Types ────────────────────────────────────────────────────

export interface Inquiry {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt?: number;
}

export interface Notice {
  id?: string;
  title: string;
  content: string;
  important: boolean;
  createdAt?: number;
}

// ─── Mappers ──────────────────────────────────────────────────

function toNumber(ts: unknown): number {
  if (ts instanceof Timestamp) return ts.toMillis();
  if (typeof ts === "number") return ts;
  return Date.now();
}

function docToInquiry(id: string, data: DocumentData): Inquiry {
  return {
    id,
    name: data.name ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    message: data.message ?? "",
    createdAt: toNumber(data.createdAt),
  };
}

function docToNotice(id: string, data: DocumentData): Notice {
  return {
    id,
    title: data.title ?? "",
    content: data.content ?? "",
    important: data.important ?? false,
    createdAt: toNumber(data.createdAt),
  };
}

// ─── Inquiries ────────────────────────────────────────────────

export async function submitInquiry(
  inquiry: Omit<Inquiry, "id" | "createdAt">
): Promise<void> {
  await addDoc(collection(db, siteConfig.inquiryCollection), {
    ...inquiry,
    createdAt: serverTimestamp(),
  });
}

// ─── Notices ─────────────────────────────────────────────────

export async function fetchNotices(count = 10): Promise<Notice[]> {
  const q = query(
    collection(db, siteConfig.noticeCollection),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToNotice(d.id, d.data()));
}
