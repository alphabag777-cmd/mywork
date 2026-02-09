/**
 * User Stakes management for Firebase Firestore
 * Manages /user_stakes collection
 */

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

export interface UserStake {
  id: string;
  wallet: string;
  stakeId: number;
  planId: string;
  token: string;
  principal: string; // Store as string to preserve precision
  lockDays: number;
  dailyRateBps: number;
  startTime: number; // Unix timestamp in seconds
  unlockTime: number; // Unix timestamp in seconds
  txHash: string;
  status: "active" | "withdrawn";
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

const COLLECTION_NAME = "user_stakes";

/**
 * Get all stakes for a user
 */
export async function getUserStakes(wallet: string): Promise<UserStake[]> {
  try {
    // Query without orderBy to avoid composite index requirement
    // We'll sort client-side instead
    const q = query(
      collection(db, COLLECTION_NAME),
      where("wallet", "==", wallet.toLowerCase())
    );
    const querySnapshot = await getDocs(q);
    
    const stakes = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as UserStake[];
    
    // Sort by startTime descending (newest first)
    return stakes.sort((a, b) => b.startTime - a.startTime);
  } catch (error) {
    console.error("Error getting user stakes:", error);
    throw error;
  }
}

/**
 * Get active stakes for a user
 */
export async function getActiveUserStakes(wallet: string): Promise<UserStake[]> {
  try {
    // Query without orderBy to avoid composite index requirement
    // We'll sort client-side instead
    const q = query(
      collection(db, COLLECTION_NAME),
      where("wallet", "==", wallet.toLowerCase()),
      where("status", "==", "active")
    );
    const querySnapshot = await getDocs(q);
    
    const stakes = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as UserStake[];
    
    // Sort by startTime descending (newest first)
    return stakes.sort((a, b) => b.startTime - a.startTime);
  } catch (error) {
    console.error("Error getting active user stakes:", error);
    throw error;
  }
}

/**
 * Get a single stake by wallet and stakeId
 */
export async function getUserStake(wallet: string, stakeId: number): Promise<UserStake | null> {
  try {
    const docId = `${wallet.toLowerCase()}_${stakeId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate(),
    } as UserStake;
  } catch (error) {
    console.error("Error getting user stake:", error);
    throw error;
  }
}

/**
 * Create a new user stake record
 */
export async function createUserStake(stake: Omit<UserStake, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const docId = `${stake.wallet.toLowerCase()}_${stake.stakeId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    
    await setDoc(docRef, {
      ...stake,
      wallet: stake.wallet.toLowerCase(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error creating user stake:", error);
    throw error;
  }
}

/**
 * Update a user stake
 */
export async function updateUserStake(wallet: string, stakeId: number, updates: Partial<Omit<UserStake, "id" | "wallet" | "stakeId" | "createdAt">>): Promise<void> {
  try {
    const docId = `${wallet.toLowerCase()}_${stakeId}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating user stake:", error);
    throw error;
  }
}

/**
 * Mark a stake as withdrawn
 */
export async function markStakeWithdrawn(wallet: string, stakeId: number): Promise<void> {
  try {
    await updateUserStake(wallet, stakeId, { status: "withdrawn" });
  } catch (error) {
    console.error("Error marking stake as withdrawn:", error);
    throw error;
  }
}

/**
 * Get all stakes (admin function)
 */
export async function getAllStakes(): Promise<UserStake[]> {
  try {
    // Get all stakes without orderBy to avoid index requirement
    // We'll sort client-side instead
    const q = query(collection(db, COLLECTION_NAME));
    const querySnapshot = await getDocs(q);
    
    const stakes = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as UserStake[];
    
    // Sort by startTime descending (newest first)
    return stakes.sort((a, b) => b.startTime - a.startTime);
  } catch (error) {
    console.error("Error getting all stakes:", error);
    throw error;
  }
}

/**
 * Get stakes by planId (admin function)
 */
export async function getStakesByPlan(planId: string): Promise<UserStake[]> {
  try {
    // Query without orderBy to avoid composite index requirement
    // We'll sort client-side instead
    const q = query(
      collection(db, COLLECTION_NAME),
      where("planId", "==", planId)
    );
    const querySnapshot = await getDocs(q);
    
    const stakes = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as UserStake[];
    
    // Sort by startTime descending (newest first)
    return stakes.sort((a, b) => b.startTime - a.startTime);
  } catch (error) {
    console.error("Error getting stakes by plan:", error);
    throw error;
  }
}
