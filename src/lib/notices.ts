/**
 * Notice storage and management utilities
 * Handles CRUD operations for notices using Firebase Firestore
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
  points: string[]; // Array of bullet point text
  isActive: boolean;
  sortOrder: number; // Order for display (lower numbers appear first)
  createdAt: number;
  updatedAt: number;
}

const NOTICES_COLLECTION = "notices";

/**
 * Convert Firestore timestamp to number
 */
function timestampToNumber(timestamp: any): number {
  if (timestamp?.toMillis) {
    return timestamp.toMillis();
  }
  if (timestamp?.seconds) {
    return timestamp.seconds * 1000;
  }
  return timestamp || Date.now();
}

/**
 * Convert notice data from Firestore format
 */
function fromFirestore(docData: any, id: string): Notice {
  return {
    id,
    points: docData.points || [],
    isActive: docData.isActive !== undefined ? docData.isActive : true,
    sortOrder: docData.sortOrder !== undefined ? docData.sortOrder : 999999,
    createdAt: timestampToNumber(docData.createdAt),
    updatedAt: timestampToNumber(docData.updatedAt),
  };
}

/**
 * Convert notice data to Firestore format
 */
function toFirestore(notice: Partial<Notice>): any {
  const now = Timestamp.now();
  return {
    points: notice.points || [],
    isActive: notice.isActive !== undefined ? notice.isActive : true,
    sortOrder: notice.sortOrder !== undefined ? notice.sortOrder : 999999,
    createdAt: notice.createdAt ? Timestamp.fromMillis(notice.createdAt) : now,
    updatedAt: now,
  };
}

/**
 * Get active notice from Firestore
 * Returns the first active notice, sorted by sortOrder
 */
export async function getActiveNotice(): Promise<Notice | null> {
  try {
    const noticesRef = collection(db, NOTICES_COLLECTION);
    const querySnapshot = await getDocs(noticesRef);
    
    const notices: Notice[] = [];
    querySnapshot.forEach((doc) => {
      const notice = fromFirestore(doc.data(), doc.id);
      if (notice.isActive) {
        notices.push(notice);
      }
    });
    
    if (notices.length === 0) {
      return null;
    }
    
    // Sort by sortOrder, then by createdAt
    notices.sort((a, b) => {
      const orderDiff = a.sortOrder - b.sortOrder;
      if (orderDiff !== 0) return orderDiff;
      return b.createdAt - a.createdAt;
    });
    
    return notices[0];
  } catch (error) {
    console.error("Error getting notice from Firestore:", error);
    const localNotices = getNoticesFromLocalStorage().filter(n => n.isActive);
    if (localNotices.length === 0) {
      return null;
    }
    localNotices.sort((a, b) => {
      const orderDiff = a.sortOrder - b.sortOrder;
      if (orderDiff !== 0) return orderDiff;
      return b.createdAt - a.createdAt;
    });
    return localNotices[0];
  }
}

/**
 * Get all notices (including inactive) from Firestore
 */
export async function getAllNotices(): Promise<Notice[]> {
  try {
    const noticesRef = collection(db, NOTICES_COLLECTION);
    const querySnapshot = await getDocs(noticesRef);
    
    const notices: Notice[] = [];
    querySnapshot.forEach((doc) => {
      notices.push(fromFirestore(doc.data(), doc.id));
    });
    
    // Sort by sortOrder, then by createdAt
    return notices.sort((a, b) => {
      const orderDiff = a.sortOrder - b.sortOrder;
      if (orderDiff !== 0) return orderDiff;
      return b.createdAt - a.createdAt;
    });
  } catch (error) {
    console.error("Error getting notices from Firestore:", error);
    return getNoticesFromLocalStorage();
  }
}

/**
 * Get a notice by ID from Firestore
 */
export async function getNoticeById(id: string): Promise<Notice | null> {
  try {
    const noticeRef = doc(db, NOTICES_COLLECTION, id);
    const noticeSnap = await getDoc(noticeRef);
    
    if (noticeSnap.exists()) {
      return fromFirestore(noticeSnap.data(), noticeSnap.id);
    }
    
    return null;
  } catch (error) {
    console.error("Error getting notice from Firestore:", error);
    const notices = getNoticesFromLocalStorage();
    return notices.find((n) => n.id === id) || null;
  }
}

/**
 * Save a notice (create or update) to Firestore
 */
export async function saveNotice(
  notice: Omit<Notice, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<Notice> {
  try {
    const now = Date.now();
    const noticeId = notice.id || `notice_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    let existingNotice: Notice | null = null;
    if (notice.id) {
      existingNotice = await getNoticeById(notice.id);
    }
    
    const noticeData = toFirestore({
      ...notice,
      createdAt: existingNotice?.createdAt || now,
    });
    
    const noticeRef = doc(db, NOTICES_COLLECTION, noticeId);
    await setDoc(noticeRef, noticeData);
    
    const savedNotice: Notice = {
      ...notice,
      id: noticeId,
      createdAt: existingNotice?.createdAt || now,
      updatedAt: now,
    } as Notice;
    
    saveNoticeToLocalStorage(savedNotice);
    
    return savedNotice;
  } catch (error) {
    console.error("Error saving notice to Firestore:", error);
    return saveNoticeToLocalStorage(notice);
  }
}

/**
 * Delete a notice by ID from Firestore
 */
export async function deleteNotice(id: string): Promise<boolean> {
  try {
    const noticeRef = doc(db, NOTICES_COLLECTION, id);
    await deleteDoc(noticeRef);
    
    deleteNoticeFromLocalStorage(id);
    
    return true;
  } catch (error) {
    console.error("Error deleting notice from Firestore:", error);
    return deleteNoticeFromLocalStorage(id);
  }
}

// ========== LocalStorage Fallback Functions ==========

const NOTICES_STORAGE_KEY = "alphabag_notices";

function getNoticesFromLocalStorage(): Notice[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = localStorage.getItem(NOTICES_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse notices from localStorage:", e);
    return [];
  }
}

function saveNoticeToLocalStorage(
  notice: Omit<Notice, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Notice {
  if (typeof window === "undefined") {
    throw new Error("Cannot save notice: window is undefined");
  }

  const notices = getNoticesFromLocalStorage();
  const now = Date.now();

  if (notice.id && notices.some((n) => n.id === notice.id)) {
    const updatedNotices = notices.map((n) =>
      n.id === notice.id
        ? {
            ...notice,
            id: notice.id,
            updatedAt: now,
            createdAt: n.createdAt,
          }
        : n
    );
    localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(updatedNotices));
    return updatedNotices.find((n) => n.id === notice.id)!;
  } else {
    const newNotice: Notice = {
      ...notice,
      id: notice.id || `notice_${now}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    notices.push(newNotice);
    localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(notices));
    return newNotice;
  }
}

function deleteNoticeFromLocalStorage(id: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const notices = getNoticesFromLocalStorage();
  const filtered = notices.filter((n) => n.id !== id);
  
  if (filtered.length === notices.length) {
    return false;
  }

  localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

