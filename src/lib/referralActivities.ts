/**
 * Referral activity tracking storage and management utilities
 * Tracks activities of referred users (investments, node purchases, etc.)
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { getReferralByReferred } from "./referrals";

export type ActivityType = "plan_added_to_cart" | "plan_invested" | "node_purchased";

export interface ReferralActivity {
  id: string;
  referrerWallet: string; // Wallet address of the person who referred
  referredWallet: string; // Wallet address of the person who performed the activity
  activityType: ActivityType;
  planId?: string; // Plan ID if activity is plan-related
  planName?: string; // Plan name if activity is plan-related
  amount?: number; // Investment amount if applicable
  nodeId?: number; // Node ID if activity is node-related
  nodeName?: string; // Node name if activity is node-related
  nodePrice?: number; // Node price if activity is node-related
  transactionHash?: string; // Transaction hash if applicable
  createdAt: number;
  updatedAt: number;
}

const REFERRAL_ACTIVITIES_COLLECTION = "referral_activities";

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

function fromFirestore(docData: any, id: string): ReferralActivity {
  return {
    id,
    referrerWallet: docData.referrerWallet || "",
    referredWallet: docData.referredWallet || "",
    activityType: docData.activityType || "plan_added_to_cart",
    planId: docData.planId,
    planName: docData.planName,
    amount: docData.amount,
    nodeId: docData.nodeId,
    nodeName: docData.nodeName,
    nodePrice: docData.nodePrice,
    transactionHash: docData.transactionHash,
    createdAt: timestampToNumber(docData.createdAt),
    updatedAt: timestampToNumber(docData.updatedAt),
  };
}

function toFirestore(activity: Partial<ReferralActivity>): any {
  const now = Timestamp.now();
  return {
    referrerWallet: activity.referrerWallet?.toLowerCase() || "",
    referredWallet: activity.referredWallet?.toLowerCase() || "",
    activityType: activity.activityType || "plan_added_to_cart",
    planId: activity.planId || null,
    planName: activity.planName || null,
    amount: activity.amount || null,
    nodeId: activity.nodeId || null,
    nodeName: activity.nodeName || null,
    nodePrice: activity.nodePrice || null,
    transactionHash: activity.transactionHash || null,
    createdAt: activity.createdAt ? Timestamp.fromMillis(activity.createdAt) : now,
    updatedAt: now,
  };
}

/**
 * Track a referral activity
 * Automatically finds the referrer based on the referred wallet
 */
export async function trackReferralActivity(
  referredWallet: string,
  activity: Omit<ReferralActivity, "id" | "referrerWallet" | "referredWallet" | "createdAt" | "updatedAt">
): Promise<ReferralActivity | null> {
  try {
    // Find the referrer for this referred user
    const referral = await getReferralByReferred(referredWallet);
    if (!referral) {
      // User wasn't referred, don't track activity
      return null;
    }

    const now = Date.now();
    const activityId = `activity_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    const activityData: ReferralActivity = {
      id: activityId,
      referrerWallet: referral.referrerWallet,
      referredWallet: referredWallet.toLowerCase(),
      ...activity,
      createdAt: now,
      updatedAt: now,
    };
    
    const activityRef = doc(db, REFERRAL_ACTIVITIES_COLLECTION, activityId);
    await setDoc(activityRef, toFirestore(activityData));
    
    return activityData;
  } catch (error) {
    console.error("Error tracking referral activity:", error);
    return null;
  }
}

/**
 * Get all activities for a referrer
 */
export async function getReferralActivitiesByReferrer(referrerWallet: string): Promise<ReferralActivity[]> {
  try {
    const activitiesRef = collection(db, REFERRAL_ACTIVITIES_COLLECTION);
    const normalizedWallet = referrerWallet.toLowerCase();
    
    try {
      const q = query(
        activitiesRef,
        where("referrerWallet", "==", normalizedWallet),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      const activities: ReferralActivity[] = [];
      querySnapshot.forEach((doc) => {
        activities.push(fromFirestore(doc.data(), doc.id));
      });
      
      activities.sort((a, b) => b.createdAt - a.createdAt);
      
      return activities;
    } catch (orderByError: any) {
      if (orderByError.code === "failed-precondition") {
        console.warn("Composite index missing, fetching without orderBy:", orderByError);
        const q = query(
          activitiesRef,
          where("referrerWallet", "==", normalizedWallet)
        );
        const querySnapshot = await getDocs(q);
        
        const activities: ReferralActivity[] = [];
        querySnapshot.forEach((doc) => {
          activities.push(fromFirestore(doc.data(), doc.id));
        });
        
        activities.sort((a, b) => b.createdAt - a.createdAt);
        
        return activities;
      }
      throw orderByError;
    }
  } catch (error) {
    console.error("Error getting referral activities from Firestore:", error);
    return [];
  }
}

/**
 * Get activities for a specific referred user
 */
export async function getReferralActivitiesByReferred(referredWallet: string): Promise<ReferralActivity[]> {
  try {
    const activitiesRef = collection(db, REFERRAL_ACTIVITIES_COLLECTION);
    const normalizedWallet = referredWallet.toLowerCase();
    
    const q = query(
      activitiesRef,
      where("referredWallet", "==", normalizedWallet),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    const activities: ReferralActivity[] = [];
    querySnapshot.forEach((doc) => {
      activities.push(fromFirestore(doc.data(), doc.id));
    });
    
    return activities;
  } catch (error) {
    console.error("Error getting referral activities by referred from Firestore:", error);
    return [];
  }
}
