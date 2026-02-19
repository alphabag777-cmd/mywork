/**
 * Scheduled Announcements
 * Admins can create announcements with an optional scheduled send time.
 * The frontend polls/checks on page load and creates a notification for
 * all registered users when the scheduled time arrives.
 */
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { getAllUsers } from "./users";
import { createNotification } from "./notifications";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  link?: string;
  scheduledAt: number; // epoch ms; 0 = send immediately
  sentAt?: number; // set when sent
  isSent: boolean;
  createdAt: number;
  updatedAt: number;
}

const COLLECTION = "announcements";

function fromFirestore(data: any, id: string): Announcement {
  const ts = (t: any) => {
    if (t instanceof Timestamp) return t.toMillis();
    if (typeof t === "number") return t;
    return 0;
  };
  return {
    id,
    title: data.title || "",
    message: data.message || "",
    link: data.link || undefined,
    scheduledAt: ts(data.scheduledAt),
    sentAt: data.sentAt ? ts(data.sentAt) : undefined,
    isSent: data.isSent || false,
    createdAt: ts(data.createdAt),
    updatedAt: ts(data.updatedAt),
  };
}

export async function getAllAnnouncements(): Promise<Announcement[]> {
  try {
    const snap = await getDocs(query(collection(db, COLLECTION), orderBy("scheduledAt", "desc")));
    return snap.docs.map((d) => fromFirestore(d.data(), d.id));
  } catch {
    return [];
  }
}

export async function saveAnnouncement(
  ann: Omit<Announcement, "id" | "createdAt" | "updatedAt" | "isSent" | "sentAt"> & { id?: string }
): Promise<Announcement> {
  const now = Date.now();
  const id = ann.id || `ann_${now}_${Math.random().toString(36).slice(2, 8)}`;
  const data: Announcement = {
    ...ann,
    id,
    isSent: false,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, COLLECTION, id), {
    ...data,
    scheduledAt: Timestamp.fromMillis(data.scheduledAt || now),
    createdAt: Timestamp.fromMillis(now),
    updatedAt: Timestamp.fromMillis(now),
  });
  return data;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/**
 * Check for due announcements and send notifications.
 * Call this once on admin dashboard mount or via a background check.
 */
export async function dispatchDueAnnouncements(): Promise<number> {
  const now = Date.now();
  let dispatched = 0;
  try {
    const pending = await getDocs(
      query(collection(db, COLLECTION), where("isSent", "==", false))
    );
    const due = pending.docs
      .map((d) => fromFirestore(d.data(), d.id))
      .filter((a) => a.scheduledAt <= now || a.scheduledAt === 0);

    if (due.length === 0) return 0;

    const users = await getAllUsers();

    for (const ann of due) {
      // Send a notification to every user
      await Promise.allSettled(
        users.map((u) =>
          createNotification(u.walletAddress, "system_notice", ann.title, ann.message, ann.link)
        )
      );
      // Mark as sent
      await updateDoc(doc(db, COLLECTION, ann.id), {
        isSent: true,
        sentAt: Timestamp.fromMillis(now),
        updatedAt: Timestamp.fromMillis(now),
      });
      dispatched++;
    }
  } catch (err) {
    console.error("dispatchDueAnnouncements error:", err);
  }
  return dispatched;
}
