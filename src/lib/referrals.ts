/**
 * Referral tracking storage and management utilities
 * Handles CRUD operations for referrals using Firebase Firestore
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Referral {
  id: string;
  referrerWallet: string; // Wallet address of the person who referred
  referredWallet: string; // Wallet address of the person who was referred
  referrerCode: string; // Referral code used
  createdAt: number;
  updatedAt: number;
}

const REFERRALS_COLLECTION = "referrals";

function timestampToNumber(timestamp: any): number {
  if (!timestamp) return Date.now();
  if (timestamp instanceof Timestamp) {
    return timestamp.toMillis();
  }
  if (typeof timestamp === "number") {
    return timestamp;
  }
  return Date.now();
}

function fromFirestore(docData: any, id: string): Referral {
  return {
    id,
    referrerWallet: docData.referrerWallet || "",
    referredWallet: docData.referredWallet || "",
    referrerCode: docData.referrerCode || "",
    createdAt: timestampToNumber(docData.createdAt),
    updatedAt: timestampToNumber(docData.updatedAt),
  };
}

function toFirestore(referral: Partial<Referral>): any {
  const now = Timestamp.now();
  return {
    referrerWallet: referral.referrerWallet?.toLowerCase() || "",
    referredWallet: referral.referredWallet?.toLowerCase() || "",
    referrerCode: referral.referrerCode || "",
    createdAt: referral.createdAt ? Timestamp.fromMillis(referral.createdAt) : now,
    updatedAt: now,
  };
}

/**
 * Save referral to Firestore
 */
export async function saveReferral(
  referrerWallet: string,
  referredWallet: string,
  referrerCode: string
): Promise<Referral> {
  try {
    // Check if referral already exists
    const referralsRef = collection(db, REFERRALS_COLLECTION);
    const q = query(
      referralsRef,
      where("referrerWallet", "==", referrerWallet.toLowerCase()),
      where("referredWallet", "==", referredWallet.toLowerCase())
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Referral already exists, return existing one
      const existingDoc = querySnapshot.docs[0];
      return fromFirestore(existingDoc.data(), existingDoc.id);
    }

    // Create new referral
    const referralId = `${referrerWallet.toLowerCase()}_${referredWallet.toLowerCase()}_${Date.now()}`;
    const referralRef = doc(db, REFERRALS_COLLECTION, referralId);
    
    const referralData: Referral = {
      id: referralId,
      referrerWallet: referrerWallet.toLowerCase(),
      referredWallet: referredWallet.toLowerCase(),
      referrerCode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await setDoc(referralRef, toFirestore(referralData));
    return referralData;
  } catch (error) {
    console.error("Error saving referral to Firestore:", error);
    throw error;
  }
}

/**
 * Get all referrals
 */
export async function getAllReferrals(): Promise<Referral[]> {
  try {
    const referralsRef = collection(db, REFERRALS_COLLECTION);
    const q = query(referralsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const referrals: Referral[] = [];
    querySnapshot.forEach((doc) => {
      referrals.push(fromFirestore(doc.data(), doc.id));
    });
    
    return referrals;
  } catch (error) {
    console.error("Error getting referrals from Firestore:", error);
    return [];
  }
}

/**
 * Get referrals by referrer wallet
 */
export async function getReferralsByReferrer(referrerWallet: string): Promise<Referral[]> {
  try {
    const referralsRef = collection(db, REFERRALS_COLLECTION);
    const normalizedWallet = referrerWallet.toLowerCase();
    
    // Try with orderBy first (requires composite index)
    try {
      const q = query(
        referralsRef,
        where("referrerWallet", "==", normalizedWallet),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      const referrals: Referral[] = [];
      querySnapshot.forEach((doc) => {
        referrals.push(fromFirestore(doc.data(), doc.id));
      });
      
      // Sort by createdAt descending (in case orderBy fails)
      referrals.sort((a, b) => b.createdAt - a.createdAt);
      
      return referrals;
    } catch (orderByError: any) {
      // If orderBy fails (missing index), try without it
      if (orderByError.code === "failed-precondition") {
        console.warn("Composite index missing, fetching without orderBy:", orderByError);
        const q = query(
          referralsRef,
          where("referrerWallet", "==", normalizedWallet)
        );
        const querySnapshot = await getDocs(q);
        
        const referrals: Referral[] = [];
        querySnapshot.forEach((doc) => {
          referrals.push(fromFirestore(doc.data(), doc.id));
        });
        
        // Sort by createdAt descending manually
        referrals.sort((a, b) => b.createdAt - a.createdAt);
        
        return referrals;
      }
      throw orderByError;
    }
  } catch (error) {
    console.error("Error getting referrals by referrer from Firestore:", error);
    return [];
  }
}

/**
 * Get referral by referred wallet
 */
export async function getReferralByReferred(referredWallet: string): Promise<Referral | null> {
  try {
    const referralsRef = collection(db, REFERRALS_COLLECTION);
    const q = query(
      referralsRef,
      where("referredWallet", "==", referredWallet.toLowerCase())
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return fromFirestore(doc.data(), doc.id);
  } catch (error) {
    console.error("Error getting referral by referred from Firestore:", error);
    return null;
  }
}

/**
 * Get all referrals and return a map of referrer wallet -> count
 * This is much more efficient than calling getReferralsByReferrer for each user
 */
export async function getAllReferralCounts(): Promise<{ [referrerWallet: string]: number }> {
  try {
    const referralsRef = collection(db, REFERRALS_COLLECTION);
    const querySnapshot = await getDocs(referralsRef);
    
    const counts: { [key: string]: number } = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const referrerWallet = (data.referrerWallet || "").toLowerCase();
      if (referrerWallet) {
        counts[referrerWallet] = (counts[referrerWallet] || 0) + 1;
      }
    });
    
    return counts;
  } catch (error) {
    console.error("Error getting all referral counts from Firestore:", error);
    return {};
  }
}

