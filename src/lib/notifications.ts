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
  onSnapshot
} from "firebase/firestore";
import { db } from "./firebase";

export interface Notification {
  id: string;
  userId: string;
  type: "staking_reward" | "ticket_reply" | "referral_joined" | "system_notice";
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
