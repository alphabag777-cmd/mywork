/**
 * Staking Plans management for Firebase Firestore
 * Manages /staking_plans collection
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface StakingPlan {
  id: string;
  planId: string;
  token: string;
  lockDays: number;
  dailyRateBps: number; // Daily rate in basis points (e.g., 130 = 1.3%)
  title: string;
  minDeposit: number;
  maxDeposit: number;
  rewardPool: number;
  active: boolean;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

const COLLECTION_NAME = "staking_plans";

/**
 * Get all staking plans
 */
export async function getAllStakingPlans(): Promise<StakingPlan[]> {
  try {
    // Get all plans without orderBy to avoid index requirement
    // We'll sort client-side instead
    const q = query(collection(db, COLLECTION_NAME));
    const querySnapshot = await getDocs(q);
    
    const plans = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as StakingPlan[];
    
    // Sort by createdAt descending (newest first)
    return plans.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error("Error getting staking plans:", error);
    throw error;
  }
}

/**
 * Get active staking plans only
 */
export async function getActiveStakingPlans(): Promise<StakingPlan[]> {
  try {
    // Query without orderBy to avoid composite index requirement
    // We'll sort client-side instead
    const q = query(
      collection(db, COLLECTION_NAME),
      where("active", "==", true)
    );
    const querySnapshot = await getDocs(q);
    
    const plans = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as StakingPlan[];
    
    // Sort by createdAt descending (newest first)
    return plans.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error("Error getting active staking plans:", error);
    throw error;
  }
}

/**
 * Get a single staking plan by ID
 */
export async function getStakingPlan(planId: string): Promise<StakingPlan | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, planId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate(),
    } as StakingPlan;
  } catch (error) {
    console.error("Error getting staking plan:", error);
    throw error;
  }
}

/**
 * Get a staking plan by planId field
 */
export async function getStakingPlanByPlanId(planId: string): Promise<StakingPlan | null> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("planId", "==", planId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate(),
    } as StakingPlan;
  } catch (error) {
    console.error("Error getting staking plan by planId:", error);
    throw error;
  }
}

/**
 * Create a new staking plan
 */
export async function createStakingPlan(plan: Omit<StakingPlan, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const docRef = doc(collection(db, COLLECTION_NAME));
    await setDoc(docRef, {
      ...plan,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error creating staking plan:", error);
    throw error;
  }
}

/**
 * Update a staking plan
 */
export async function updateStakingPlan(planId: string, updates: Partial<Omit<StakingPlan, "id" | "createdAt">>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, planId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating staking plan:", error);
    throw error;
  }
}

/**
 * Delete a staking plan
 */
export async function deleteStakingPlan(planId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, planId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting staking plan:", error);
    throw error;
  }
}

/**
 * Toggle plan active status
 */
export async function toggleStakingPlanActive(planId: string, active: boolean): Promise<void> {
  try {
    await updateStakingPlan(planId, { active });
  } catch (error) {
    console.error("Error toggling staking plan active status:", error);
    throw error;
  }
}
