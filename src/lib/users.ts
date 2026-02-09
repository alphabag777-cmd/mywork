/**
 * User storage and management utilities
 * Handles CRUD operations for users using Firebase Firestore
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
  limit,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";

export interface User {
  id: string; // Wallet address
  walletAddress: string;
  referralCode: string;
  referrerCode: string | null;
  referrerWallet: string | null;
  isRegistered: boolean;
  createdAt: number;
  updatedAt: number;
  lastConnectedAt: number;
}

const USERS_COLLECTION = "users";

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

function fromFirestore(docData: any, id: string): User {
  return {
    id,
    walletAddress: docData.walletAddress || id,
    referralCode: docData.referralCode || "",
    referrerCode: docData.referrerCode || null,
    referrerWallet: docData.referrerWallet || null,
    isRegistered: docData.isRegistered !== undefined ? docData.isRegistered : false,
    createdAt: timestampToNumber(docData.createdAt),
    updatedAt: timestampToNumber(docData.updatedAt),
    lastConnectedAt: timestampToNumber(docData.lastConnectedAt),
  };
}

function toFirestore(user: Partial<User>): any {
  const now = Timestamp.now();
  return {
    walletAddress: user.walletAddress || user.id || "",
    referralCode: user.referralCode || "",
    referrerCode: user.referrerCode || null,
    referrerWallet: user.referrerWallet || null,
    isRegistered: user.isRegistered !== undefined ? user.isRegistered : false,
    createdAt: user.createdAt ? Timestamp.fromMillis(user.createdAt) : now,
    updatedAt: now,
    lastConnectedAt: now,
  };
}

/**
 * Save or update user in Firestore
 */
export async function saveUser(walletAddress: string, data: Partial<User>): Promise<User> {
  try {
    const userRef = doc(db, USERS_COLLECTION, walletAddress.toLowerCase());
    const existingDoc = await getDoc(userRef);
    
    const now = Date.now();
    const userData: User = {
      id: walletAddress.toLowerCase(),
      walletAddress: walletAddress.toLowerCase(),
      referralCode: data.referralCode || "",
      referrerCode: data.referrerCode || null,
      referrerWallet: data.referrerWallet || null,
      isRegistered: data.isRegistered !== undefined ? data.isRegistered : false,
      createdAt: existingDoc.exists() ? timestampToNumber(existingDoc.data()?.createdAt) : now,
      updatedAt: now,
      lastConnectedAt: now,
      ...data,
    };

    await setDoc(userRef, toFirestore(userData));
    return userData;
  } catch (error) {
    console.error("Error saving user to Firestore:", error);
    throw error;
  }
}

/**
 * Get user by wallet address
 */
export async function getUserByWallet(walletAddress: string): Promise<User | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, walletAddress.toLowerCase());
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return fromFirestore(userDoc.data(), userDoc.id);
  } catch (error) {
    console.error("Error getting user from Firestore:", error);
    return null;
  }
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      users.push(fromFirestore(doc.data(), doc.id));
    });
    
    return users;
  } catch (error) {
    console.error("Error getting users from Firestore:", error);
    return [];
  }
}

export interface PaginatedUsersResult {
  users: User[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Get users with pagination
 */
export async function getUsersPaginated(
  pageSize: number = 20,
  lastDocSnapshot: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<PaginatedUsersResult> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    let q = query(usersRef, orderBy("createdAt", "desc"), limit(pageSize));
    
    if (lastDocSnapshot) {
      q = query(usersRef, orderBy("createdAt", "desc"), startAfter(lastDocSnapshot), limit(pageSize));
    }
    
    const querySnapshot = await getDocs(q);
    
    const users: User[] = [];
    let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
    
    querySnapshot.forEach((doc) => {
      users.push(fromFirestore(doc.data(), doc.id));
      lastDoc = doc;
    });
    
    return {
      users,
      lastDoc,
      hasMore: querySnapshot.docs.length === pageSize,
    };
  } catch (error) {
    console.error("Error getting paginated users from Firestore:", error);
    return {
      users: [],
      lastDoc: null,
      hasMore: false,
    };
  }
}

/**
 * Get total count of users (optimized - only counts documents)
 */
export async function getUsersCount(): Promise<number> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting users count from Firestore:", error);
    return 0;
  }
}

/**
 * Search users by wallet address, referral code, or referrer
 * Supports exact and partial matches
 */
export async function searchUsers(
  searchParams: {
    walletAddress?: string;
    referralCode?: string;
    referrer?: string;
  },
  pageSize: number = 20,
  lastDocSnapshot: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<PaginatedUsersResult> {
  try {
    const { walletAddress, referralCode, referrer } = searchParams;
    
    // If no search params, use regular pagination
    if (!walletAddress && !referralCode && !referrer) {
      return getUsersPaginated(pageSize, lastDocSnapshot);
    }

    // For exact matches, use Firestore queries
    // For partial matches, we'll need to fetch and filter
    
    const usersRef = collection(db, USERS_COLLECTION);
    let users: User[] = [];
    let querySnapshot: any;
    
    // Try exact match queries first (more efficient)
    if (walletAddress && walletAddress.length >= 2) {
      // Check if it looks like a full address (starts with 0x and is 42 chars)
      const isFullAddress = walletAddress.startsWith("0x") && walletAddress.length === 42;
      
      if (isFullAddress) {
        // Exact wallet address match
        const user = await getUserByWallet(walletAddress);
        if (user) {
          // Check other filters
          let matches = true;
          if (referralCode && user.referralCode !== referralCode) matches = false;
          if (referrer && user.referrerWallet?.toLowerCase() !== referrer.toLowerCase()) matches = false;
          
          return {
            users: matches ? [user] : [],
            lastDoc: null,
            hasMore: false,
          };
        }
        return { users: [], lastDoc: null, hasMore: false };
      }
    }
    
    // For partial matches or multiple search criteria, fetch all and filter
    // This is less efficient but necessary for partial text search
    const allUsersQuery = query(usersRef, orderBy("createdAt", "desc"));
    querySnapshot = await getDocs(allUsersQuery);
    
    querySnapshot.forEach((doc: any) => {
      const user = fromFirestore(doc.data(), doc.id);
      let matches = true;
      
      // Filter by wallet address (partial match)
      if (walletAddress && walletAddress.trim()) {
        const searchLower = walletAddress.toLowerCase().trim();
        const userWallet = user.walletAddress.toLowerCase();
        if (!userWallet.includes(searchLower)) {
          matches = false;
        }
      }
      
      // Filter by referral code (exact or partial match)
      if (referralCode && referralCode.trim()) {
        const searchCode = referralCode.trim();
        const userCode = user.referralCode || "";
        if (!userCode.includes(searchCode)) {
          matches = false;
        }
      }
      
      // Filter by referrer wallet (partial match)
      if (referrer && referrer.trim()) {
        const searchReferrer = referrer.toLowerCase().trim();
        const userReferrer = user.referrerWallet?.toLowerCase() || "";
        if (!userReferrer.includes(searchReferrer)) {
          matches = false;
        }
      }
      
      if (matches) {
        users.push(user);
      }
    });
    
    // Apply pagination to filtered results
    const startIndex = lastDocSnapshot ? 
      users.findIndex(u => u.id === lastDocSnapshot.id) + 1 : 0;
    const paginatedUsers = users.slice(startIndex, startIndex + pageSize);
    const hasMore = startIndex + pageSize < users.length;
    
    // Create a mock lastDoc for pagination (we'll use the last user's ID)
    let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
    if (paginatedUsers.length > 0 && hasMore) {
      // We need to get the actual document snapshot for the last user
      // For now, we'll use a workaround by storing the last user's ID
      const lastUser = paginatedUsers[paginatedUsers.length - 1];
      const lastUserRef = doc(db, USERS_COLLECTION, lastUser.id);
      const lastUserDoc = await getDoc(lastUserRef);
      if (lastUserDoc.exists()) {
        lastDoc = lastUserDoc as QueryDocumentSnapshot<DocumentData>;
      }
    }
    
    return {
      users: paginatedUsers,
      lastDoc,
      hasMore,
    };
  } catch (error) {
    console.error("Error searching users from Firestore:", error);
    return {
      users: [],
      lastDoc: null,
      hasMore: false,
    };
  }
}

/**
 * Get users by referrer
 */
export async function getUsersByReferrer(referrerWallet: string): Promise<User[]> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(
      usersRef,
      where("referrerWallet", "==", referrerWallet.toLowerCase()),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      users.push(fromFirestore(doc.data(), doc.id));
    });
    
    return users;
  } catch (error) {
    console.error("Error getting users by referrer from Firestore:", error);
    return [];
  }
}

/**
 * Update user's last connected time
 */
export async function updateUserConnection(walletAddress: string): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, walletAddress.toLowerCase());
    await setDoc(
      userRef,
      {
        lastConnectedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating user connection:", error);
  }
}

/**
 * Update user's referral relationship (upline/downline)
 * This updates the referrerWallet and referrerCode for a user
 */
export async function updateUserReferrer(
  walletAddress: string,
  referrerWallet: string | null,
  referrerCode: string | null
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, walletAddress.toLowerCase());
    await setDoc(
      userRef,
      {
        referrerWallet: referrerWallet?.toLowerCase() || null,
        referrerCode: referrerCode || null,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating user referrer:", error);
    throw error;
  }
}

/**
 * Check if a wallet is new (does not exist in database)
 * Returns true if wallet is new (not found in database), false if wallet exists
 */
export async function isNewWallet(walletAddress: string): Promise<boolean> {
  try {
    const user = await getUserByWallet(walletAddress);
    return user === null;
  } catch (error) {
    console.error("Error checking if wallet is new:", error);
    // In case of error, assume wallet is not new to avoid blocking legitimate users
    return false;
  }
}

