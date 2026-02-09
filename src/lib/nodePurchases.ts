/**
 * Node purchase storage and management utilities
 * Handles CRUD operations for node purchases using Firebase Firestore
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { getOrCreateNodeReferralCode } from "./userReferralCodes";

export interface NodePurchase {
  id: string;
  userId: string; // Wallet address
  nodeId: number; // NodeId enum value
  nodeName: string;
  nodePrice: number;
  nodeColor: string;
  transactionHash: string;
  purchaseDate: number;
  status: "completed" | "pending" | "failed";
  createdAt: number;
  updatedAt: number;
}

const NODE_PURCHASES_COLLECTION = "nodePurchases";

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
 * Convert purchase data from Firestore format
 */
function fromFirestore(docData: any, id: string): NodePurchase {
  return {
    id,
    userId: docData.userId || "",
    nodeId: docData.nodeId || 0,
    nodeName: docData.nodeName || "",
    nodePrice: docData.nodePrice || 0,
    nodeColor: docData.nodeColor || "gold",
    transactionHash: docData.transactionHash || "",
    purchaseDate: timestampToNumber(docData.purchaseDate),
    status: docData.status || "completed",
    createdAt: timestampToNumber(docData.createdAt),
    updatedAt: timestampToNumber(docData.updatedAt),
  };
}

/**
 * Convert purchase data to Firestore format
 */
function toFirestore(purchase: Partial<NodePurchase>): any {
  const now = Timestamp.now();
  return {
    userId: purchase.userId || "",
    nodeId: purchase.nodeId || 0,
    nodeName: purchase.nodeName || "",
    nodePrice: purchase.nodePrice || 0,
    nodeColor: purchase.nodeColor || "gold",
    transactionHash: purchase.transactionHash || "",
    purchaseDate: purchase.purchaseDate ? Timestamp.fromMillis(purchase.purchaseDate) : now,
    status: purchase.status || "completed",
    createdAt: purchase.createdAt ? Timestamp.fromMillis(purchase.createdAt) : now,
    updatedAt: now,
  };
}

/**
 * Save a node purchase to Firestore
 */
export async function saveNodePurchase(
  purchase: Omit<NodePurchase, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<NodePurchase> {
  try {
    const now = Date.now();
    const purchaseId = purchase.id || `purchase_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    const purchaseData = toFirestore({
      ...purchase,
      createdAt: now,
    });
    
    const purchaseRef = doc(db, NODE_PURCHASES_COLLECTION, purchaseId);
    await setDoc(purchaseRef, purchaseData);
    
    return {
      ...purchase,
      id: purchaseId,
      createdAt: now,
      updatedAt: now,
    } as NodePurchase;
  } catch (error) {
    console.error("Error saving node purchase to Firestore:", error);
    throw error;
  }
}

/**
 * Get all node purchases for a specific user
 */
export async function getUserNodePurchases(userId: string): Promise<NodePurchase[]> {
  try {
    const purchasesRef = collection(db, NODE_PURCHASES_COLLECTION);
    // Normalize userId to lowercase
    const normalizedUserId = userId.toLowerCase();
    
    // Try with orderBy first (requires composite index)
    try {
      const q = query(
        purchasesRef,
        where("userId", "==", normalizedUserId),
        orderBy("purchaseDate", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      const purchases: NodePurchase[] = [];
      querySnapshot.forEach((doc) => {
        purchases.push(fromFirestore(doc.data(), doc.id));
      });
      
      // Sort by purchaseDate descending (in case orderBy fails)
      purchases.sort((a, b) => b.purchaseDate - a.purchaseDate);
      
      return purchases;
    } catch (orderByError: any) {
      // If orderBy fails (missing index), try without it
      if (orderByError.code === "failed-precondition") {
        console.warn("Composite index missing, fetching without orderBy:", orderByError);
        const q = query(
          purchasesRef,
          where("userId", "==", normalizedUserId)
        );
        const querySnapshot = await getDocs(q);
        
        const purchases: NodePurchase[] = [];
        querySnapshot.forEach((doc) => {
          purchases.push(fromFirestore(doc.data(), doc.id));
        });
        
        // Sort by purchaseDate descending manually
        purchases.sort((a, b) => b.purchaseDate - a.purchaseDate);
        
        return purchases;
      }
      throw orderByError;
    }
  } catch (error) {
    console.error("Error getting user node purchases from Firestore:", error);
    return [];
  }
}

/**
 * Get a node purchase by transaction hash
 */
export async function getNodePurchaseByTxHash(transactionHash: string): Promise<NodePurchase | null> {
  try {
    const purchasesRef = collection(db, NODE_PURCHASES_COLLECTION);
    const q = query(purchasesRef, where("transactionHash", "==", transactionHash));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return fromFirestore(doc.data(), doc.id);
    }
    
    return null;
  } catch (error) {
    console.error("Error getting node purchase by tx hash from Firestore:", error);
    return null;
  }
}

/**
 * Get all node purchases (admin function)
 */
export async function getAllNodePurchases(): Promise<NodePurchase[]> {
  try {
    const purchasesRef = collection(db, NODE_PURCHASES_COLLECTION);
    const q = query(purchasesRef, orderBy("purchaseDate", "desc"));
    const querySnapshot = await getDocs(q);
    
    const purchases: NodePurchase[] = [];
    querySnapshot.forEach((doc) => {
      purchases.push(fromFirestore(doc.data(), doc.id));
    });
    
    return purchases;
  } catch (error) {
    console.error("Error getting all node purchases from Firestore:", error);
    return [];
  }
}

/**
 * Delete a node purchase by ID (admin function)
 */
export async function deleteNodePurchase(purchaseId: string): Promise<boolean> {
  try {
    const purchaseRef = doc(db, NODE_PURCHASES_COLLECTION, purchaseId);
    await deleteDoc(purchaseRef);
    return true;
  } catch (error) {
    console.error("Error deleting node purchase from Firestore:", error);
    throw error;
  }
}

/**
 * Update a node purchase (admin function)
 */
export async function updateNodePurchase(
  purchaseId: string,
  updates: Partial<NodePurchase>
): Promise<NodePurchase> {
  try {
    const purchaseRef = doc(db, NODE_PURCHASES_COLLECTION, purchaseId);
    const existingDoc = await getDoc(purchaseRef);
    
    if (!existingDoc.exists()) {
      throw new Error("Node purchase not found");
    }
    
    const existingData = fromFirestore(existingDoc.data(), purchaseId);
    const updatedData = {
      ...existingData,
      ...updates,
      updatedAt: Date.now(),
    };
    
    await setDoc(purchaseRef, toFirestore(updatedData));
    return updatedData;
  } catch (error) {
    console.error("Error updating node purchase from Firestore:", error);
    throw error;
  }
}

