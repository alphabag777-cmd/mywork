/**
 * User referral codes storage and management utilities
 * Handles CRUD operations for user-specific project referral codes using Firebase Firestore
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface UserReferralCodes {
  userId: string; // Wallet address
  projectCodes: { [projectId: string]: string }; // Map of projectId -> referral code
  nodeCodes: { [nodeId: string]: string }; // Map of nodeId -> referral code
  createdAt: number;
  updatedAt: number;
}

const USER_REFERRAL_CODES_COLLECTION = "userReferralCodes";

/**
 * Generate a unique referral code
 */
function generateReferralCode(prefix: string = "REF"): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

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
 * Convert data from Firestore format
 */
function fromFirestore(docData: any): UserReferralCodes {
  return {
    userId: docData.userId || "",
    projectCodes: docData.projectCodes || {},
    nodeCodes: docData.nodeCodes || {},
    createdAt: timestampToNumber(docData.createdAt),
    updatedAt: timestampToNumber(docData.updatedAt),
  };
}

/**
 * Convert data to Firestore format
 */
function toFirestore(data: Partial<UserReferralCodes>): any {
  const now = Timestamp.now();
  return {
    userId: data.userId || "",
    projectCodes: data.projectCodes || {},
    nodeCodes: data.nodeCodes || {},
    createdAt: data.createdAt ? Timestamp.fromMillis(data.createdAt) : now,
    updatedAt: now,
  };
}

/**
 * Get user referral codes from Firestore
 */
export async function getUserReferralCodes(userId: string): Promise<UserReferralCodes | null> {
  try {
    const docRef = doc(db, USER_REFERRAL_CODES_COLLECTION, userId.toLowerCase());
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return fromFirestore(docSnap.data());
    }
    
    return null;
  } catch (error) {
    console.error("Error getting user referral codes from Firestore:", error);
    return null;
  }
}

/**
 * Save or update user referral codes in Firestore
 */
export async function saveUserReferralCodes(
  userId: string,
  updates: {
    projectCodes?: { [projectId: string]: string };
    nodeCodes?: { [nodeId: string]: string };
  }
): Promise<UserReferralCodes> {
  try {
    const normalizedUserId = userId.toLowerCase();
    const docRef = doc(db, USER_REFERRAL_CODES_COLLECTION, normalizedUserId);
    
    // Get existing data
    const existing = await getUserReferralCodes(normalizedUserId);
    const now = Date.now();
    
    const updatedData: UserReferralCodes = {
      userId: normalizedUserId,
      projectCodes: {
        ...(existing?.projectCodes || {}),
        ...(updates.projectCodes || {}),
      },
      nodeCodes: {
        ...(existing?.nodeCodes || {}),
        ...(updates.nodeCodes || {}),
      },
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    
    await setDoc(docRef, toFirestore(updatedData));
    
    return updatedData;
  } catch (error) {
    console.error("Error saving user referral codes to Firestore:", error);
    throw error;
  }
}

/**
 * Get or create a referral code for a project
 */
export async function getOrCreateProjectReferralCode(
  userId: string,
  projectId: string,
  projectLabel?: string
): Promise<string> {
  try {
    const codes = await getUserReferralCodes(userId);
    
    // Check if code already exists
    if (codes?.projectCodes[projectId]) {
      return codes.projectCodes[projectId];
    }
    
    // Generate new code
    const prefix = projectLabel 
      ? projectLabel.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 3) || "PRJ"
      : "PRJ";
    const newCode = generateReferralCode(prefix);
    
    // Save it
    await saveUserReferralCodes(userId, {
      projectCodes: { [projectId]: newCode },
    });
    
    return newCode;
  } catch (error) {
    console.error("Error getting/creating project referral code:", error);
    // Fallback: generate code without saving
    const prefix = projectLabel 
      ? projectLabel.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 3) || "PRJ"
      : "PRJ";
    return generateReferralCode(prefix);
  }
}

/**
 * Get or create a referral code for a node
 */
export async function getOrCreateNodeReferralCode(
  userId: string,
  nodeId: number,
  nodeName?: string
): Promise<string> {
  try {
    const nodeIdStr = nodeId.toString();
    const codes = await getUserReferralCodes(userId);
    
    // Check if code already exists
    if (codes?.nodeCodes[nodeIdStr]) {
      return codes.nodeCodes[nodeIdStr];
    }
    
    // Generate new code
    const prefix = nodeName 
      ? nodeName.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 3) || "NOD"
      : "NOD";
    const newCode = generateReferralCode(prefix);
    
    // Save it
    await saveUserReferralCodes(userId, {
      nodeCodes: { [nodeIdStr]: newCode },
    });
    
    return newCode;
  } catch (error) {
    console.error("Error getting/creating node referral code:", error);
    // Fallback: generate code without saving
    const prefix = nodeName 
      ? nodeName.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 3) || "NOD"
      : "NOD";
    return generateReferralCode(prefix);
  }
}

/**
 * Update a project referral code
 */
export async function updateProjectReferralCode(
  userId: string,
  projectId: string,
  code: string
): Promise<void> {
  await saveUserReferralCodes(userId, {
    projectCodes: { [projectId]: code },
  });
}

/**
 * Update a node referral code
 */
export async function updateNodeReferralCode(
  userId: string,
  nodeId: number,
  code: string
): Promise<void> {
  await saveUserReferralCodes(userId, {
    nodeCodes: { [nodeId.toString()]: code },
  });
}

/**
 * Delete a project referral code
 */
export async function deleteProjectReferralCode(
  userId: string,
  projectId: string
): Promise<void> {
  try {
    const normalizedUserId = userId.toLowerCase();
    const docRef = doc(db, USER_REFERRAL_CODES_COLLECTION, normalizedUserId);
    
    // Get existing data
    const existing = await getUserReferralCodes(normalizedUserId);
    if (!existing) return;
    
    // Remove the project code
    const updatedProjectCodes = { ...existing.projectCodes };
    delete updatedProjectCodes[projectId];
    
    const updatedData: UserReferralCodes = {
      userId: normalizedUserId,
      projectCodes: updatedProjectCodes,
      nodeCodes: existing.nodeCodes,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    };
    
    await setDoc(docRef, toFirestore(updatedData));
  } catch (error) {
    console.error("Error deleting project referral code from Firestore:", error);
    throw error;
  }
}

