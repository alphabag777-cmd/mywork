import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Notification {
  id: string;
  userId: string;
  type: "staking_reward" | "ticket_reply" | "referral_joined" | "system_notice" | "staking_maturity";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: number;
  link?: string;
}

const COLLECTION_NAME = "notifications";

/**
 * Subscribe to user notifications (Real-time)
 */
export function subscribeNotifications(userId: string, callback: (notifications: Notification[]) => void) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId.toLowerCase()),
    orderBy("createdAt", "desc"),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis?.() || Date.now(),
    })) as Notification[];
    callback(notifications);
  });
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string) {
  try {
    const docRef = doc(db, COLLECTION_NAME, notificationId);
    await updateDoc(docRef, {
      isRead: true,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

/**
 * Create a notification (Internal use)
 */
/**
 * Check maturing stakes and fire notifications if not already sent.
 * Call this once on app load when the user's wallet address is known.
 * Uses localStorage to de-duplicate (one notification per stake).
 */
export async function checkStakingMaturityNotifications(
  userId: string,
  stakes: Array<{ id: string; planId: string; unlockTime: number; token: string; principal: string }>
): Promise<void> {
  if (!userId || !stakes.length) return;
  const STORAGE_KEY = `notified_stakes_${userId.toLowerCase()}`;
  let notified: string[] = [];
  try { notified = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { notified = []; }

  const now = Date.now();
  const DAY = 86_400_000;
  const newNotified = [...notified];

  for (const stake of stakes) {
    const unlockMs = stake.unlockTime * 1000;
    const daysLeft = Math.ceil((unlockMs - now) / DAY);
    // Notify when 1 or 3 days left, or already matured (daysLeft <= 0)
    const shouldNotify = (daysLeft === 1 || daysLeft === 3 || daysLeft <= 0);
    const key = `${stake.id}_${daysLeft <= 0 ? "matured" : `${daysLeft}d`}`;
    if (!shouldNotify || notified.includes(key)) continue;

    const title = daysLeft <= 0
      ? "스테이킹 만기 도래"
      : `스테이킹 만기 ${daysLeft}일 전`;
    const message = daysLeft <= 0
      ? `${stake.token} 스테이킹이 만기되었습니다. 지금 인출할 수 있습니다.`
      : `${stake.token} 스테이킹이 ${daysLeft}일 후 만기됩니다.`;

    await createNotification(userId, "staking_maturity", title, message, "/staking");
    newNotified.push(key);
  }

  if (newNotified.length !== notified.length) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotified)); } catch { /* ignore */ }
  }
}

/**
 * Create a notification (Internal use)
 */
export async function createNotification(
  userId: string,
  type: Notification["type"],
  title: string,
  message: string,
  link?: string
) {
  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      userId: userId.toLowerCase(),
      type,
      title,
      message,
      isRead: false,
      createdAt: serverTimestamp(),
      link,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

/**
 * Send a broadcast notification to ALL users
 * (Admin use only — writes one doc per user)
 */
export async function sendBroadcastNotification(
  userIds: string[],
  type: Notification["type"],
  title: string,
  message: string,
  link?: string
) {
  const BATCH_LIMIT = 500; // Firestore batch write limit
  for (let i = 0; i < userIds.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const chunk = userIds.slice(i, i + BATCH_LIMIT);
    for (const userId of chunk) {
      const ref = doc(collection(db, COLLECTION_NAME));
      batch.set(ref, {
        userId: userId.toLowerCase(),
        type,
        title,
        message,
        isRead: false,
        createdAt: serverTimestamp(),
        link: link ?? null,
      });
    }
    await batch.commit();
  }
}

/**
 * Get recent notifications sent by admin (for history display)
 */
export async function getAdminSentNotifications(limitCount = 20) {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("type", "==", "system_notice"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toMillis?.() || Date.now(),
    })) as Notification[];
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    return [];
  }
}
