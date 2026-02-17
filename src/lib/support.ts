import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface TicketReply {
  sender: "user" | "admin";
  message: string;
  timestamp: number;
}

export interface Ticket {
  id: string;
  userId: string; // Wallet address
  subject: string;
  message: string; // Initial message
  status: "open" | "answered" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: number;
  updatedAt: number;
  replies: TicketReply[];
}

const TICKETS_COLLECTION = "support_tickets";

// Helper to convert Firestore timestamp to number
function timestampToNumber(timestamp: any): number {
  if (timestamp?.toMillis) return timestamp.toMillis();
  if (timestamp?.seconds) return timestamp.seconds * 1000;
  return timestamp || Date.now();
}

function fromFirestore(docData: any, id: string): Ticket {
  return {
    id,
    userId: docData.userId || "",
    subject: docData.subject || "",
    message: docData.message || "",
    status: docData.status || "open",
    priority: docData.priority || "medium",
    createdAt: timestampToNumber(docData.createdAt),
    updatedAt: timestampToNumber(docData.updatedAt),
    replies: (docData.replies || []).map((r: any) => ({
      ...r,
      timestamp: timestampToNumber(r.timestamp),
    })),
  };
}

function toFirestore(ticket: Partial<Ticket>): any {
  const now = Timestamp.now();
  return {
    userId: ticket.userId || "",
    subject: ticket.subject || "",
    message: ticket.message || "",
    status: ticket.status || "open",
    priority: ticket.priority || "medium",
    createdAt: ticket.createdAt ? Timestamp.fromMillis(ticket.createdAt) : now,
    updatedAt: now,
    replies: (ticket.replies || []).map((r) => ({
      ...r,
      timestamp: Timestamp.fromMillis(r.timestamp),
    })),
  };
}

/**
 * Create a new support ticket
 */
export async function createTicket(
  ticket: Omit<Ticket, "id" | "createdAt" | "updatedAt" | "replies" | "status">
): Promise<string> {
  try {
    const now = Date.now();
    const ticketId = `ticket_${now}_${Math.random().toString(36).substr(2, 9)}`;
    const ticketData: Ticket = {
      ...ticket,
      id: ticketId,
      status: "open",
      replies: [],
      createdAt: now,
      updatedAt: now,
    };

    const ticketRef = doc(db, TICKETS_COLLECTION, ticketId);
    await setDoc(ticketRef, toFirestore(ticketData));
    return ticketId;
  } catch (error) {
    console.error("Error creating ticket:", error);
    throw error;
  }
}

/**
 * Get tickets for a specific user
 */
export async function getUserTickets(userId: string): Promise<Ticket[]> {
  try {
    const q = query(
      collection(db, TICKETS_COLLECTION),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => fromFirestore(doc.data(), doc.id));
  } catch (error) {
    console.error("Error getting user tickets:", error);
    return [];
  }
}

/**
 * Get all tickets (for admin)
 */
export async function getAllTickets(status?: string): Promise<Ticket[]> {
  try {
    let q = query(collection(db, TICKETS_COLLECTION), orderBy("updatedAt", "desc"));
    
    if (status) {
      q = query(
        collection(db, TICKETS_COLLECTION),
        where("status", "==", status),
        orderBy("updatedAt", "desc")
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => fromFirestore(doc.data(), doc.id));
  } catch (error) {
    console.error("Error getting all tickets:", error);
    return [];
  }
}

/**
 * Add a reply to a ticket
 */
export async function addReply(
  ticketId: string,
  reply: Omit<TicketReply, "timestamp">
): Promise<void> {
  try {
    const ticketRef = doc(db, TICKETS_COLLECTION, ticketId);
    const ticketSnap = await getDoc(ticketRef);
    
    if (!ticketSnap.exists()) throw new Error("Ticket not found");
    
    const currentData = ticketSnap.data();
    const newReply = {
      ...reply,
      timestamp: Timestamp.now(),
    };
    
    const newStatus = reply.sender === "admin" ? "answered" : "open";
    
    await updateDoc(ticketRef, {
      replies: [...(currentData.replies || []), newReply],
      status: newStatus,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error adding reply:", error);
    throw error;
  }
}

/**
 * Close a ticket
 */
export async function closeTicket(ticketId: string): Promise<void> {
  try {
    const ticketRef = doc(db, TICKETS_COLLECTION, ticketId);
    await updateDoc(ticketRef, {
      status: "closed",
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error closing ticket:", error);
    throw error;
  }
}
