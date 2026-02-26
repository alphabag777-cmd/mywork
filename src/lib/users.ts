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
  deleteDoc,
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
  id: string; // Wallet address or Firebase UID
  walletAddress: string;
  referralCode: string;
  referrerCode: string | null;
  referrerWallet: string | null;
  isRegistered: boolean;
  createdAt: number;
  updatedAt: number;
  lastConnectedAt: number;
  // 이메일/소셜 로그인 필드
  email?: string;
  displayName?: string;
  photoURL?: string;
  authProvider?: "wallet" | "email" | "google"; // 로그인 방식
  firebaseUid?: string; // Firebase Auth UID
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
  const data: any = {
    walletAddress: user.walletAddress || user.id || "",
    referralCode: user.referralCode || "",
    referrerCode: user.referrerCode || null,
    referrerWallet: user.referrerWallet || null,
    isRegistered: user.isRegistered !== undefined ? user.isRegistered : false,
    createdAt: user.createdAt ? Timestamp.fromMillis(user.createdAt) : now,
    updatedAt: now,
    lastConnectedAt: now,
  };
  // 이메일/소셜 로그인 선택 필드
  if (user.email !== undefined) data.email = user.email;
  if (user.displayName !== undefined) data.displayName = user.displayName;
  if (user.photoURL !== undefined) data.photoURL = user.photoURL;
  if (user.authProvider !== undefined) data.authProvider = user.authProvider;
  if (user.firebaseUid !== undefined) data.firebaseUid = user.firebaseUid;
  return data;
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
 * Get user by referral code (6-digit code)
 * Used to validate invite codes on onboarding
 */
export async function getUserByReferralCode(referralCode: string): Promise<User | null> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(
      usersRef,
      where("referralCode", "==", referralCode.trim())
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const d = querySnapshot.docs[0];
    return fromFirestore(d.data(), d.id);
  } catch (error) {
    console.error("Error getting user by referral code:", error);
    return null;
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

/**
 * Delete a user document from Firestore
 * WARNING: Only deletes the users collection document.
 * Related data (referrals, investments, nodePurchases, etc.) must be
 * handled separately to avoid orphaned records.
 */
export async function deleteUser(walletAddress: string): Promise<boolean> {
  try {
    const userRef = doc(db, USERS_COLLECTION, walletAddress.toLowerCase());
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    console.error("Error deleting user from Firestore:", error);
    return false;
  }
}

/**
 * Get users with invalid referrer codes — 병렬 처리로 속도 최적화
 * - referrerCode is set but no matching user exists (invalid 6-digit code)
 * - referrerWallet is set but no matching user exists (invalid wallet referral)
 *
 * 개선 사항:
 *   1) 추천인 정보가 있는 유저만 먼저 필터링 (불필요한 DB 호출 제거)
 *   2) 모든 고유 referrerWallet / referrerCode를 한 번에 병렬 조회
 *   3) 조회 결과를 Map으로 캐싱 → 중복 요청 제거
 */
export async function getUsersWithInvalidReferrer(): Promise<User[]> {
  try {
    const allUsers = await getAllUsers();

    // 추천인 정보가 있는 유저만 추출
    const candidates = allUsers.filter(u => u.referrerCode || u.referrerWallet);
    if (candidates.length === 0) return [];

    // 고유 referrerWallet 목록 추출
    const uniqueWallets = [...new Set(
      candidates
        .filter(u => u.referrerWallet)
        .map(u => u.referrerWallet!.toLowerCase())
    )];

    // 고유 referrerCode 목록 추출 (wallet 없는 케이스)
    const uniqueCodes = [...new Set(
      candidates
        .filter(u => u.referrerCode && !u.referrerWallet)
        .map(u => u.referrerCode!)
    )];

    // 병렬로 모든 referrerWallet 존재 여부 조회
    const walletResults = await Promise.all(
      uniqueWallets.map(async w => ({ w, exists: !!(await getUserByWallet(w)) }))
    );
    const walletMap = new Map(walletResults.map(r => [r.w, r.exists]));

    // 병렬로 모든 referrerCode 존재 여부 조회
    const codeResults = await Promise.all(
      uniqueCodes.map(async c => ({ c, exists: !!(await getUserByReferralCode(c)) }))
    );
    const codeMap = new Map(codeResults.map(r => [r.c, r.exists]));

    // Map 기반으로 유효성 판별 (추가 DB 요청 없음)
    const invalid: User[] = [];
    for (const user of candidates) {
      if (user.referrerWallet) {
        const key = user.referrerWallet.toLowerCase();
        if (walletMap.get(key) === false) { invalid.push(user); continue; }
      }
      if (user.referrerCode && !user.referrerWallet) {
        if (codeMap.get(user.referrerCode) === false) { invalid.push(user); }
      }
    }

    return invalid;
  } catch (error) {
    console.error("Error getting users with invalid referrer:", error);
    return [];
  }
}

/**
 * Completely delete a user and ALL related data across collections:
 *   - users
 *   - referrals (as referrer OR as referred)
 *   - user_investments
 *   - nodePurchases
 *   - referral_activities (as referrer OR as referred)
 *
 * Returns an object summarising what was deleted.
 */
export async function deleteUserCompletely(walletAddress: string): Promise<{
  success: boolean;
  deleted: {
    user: boolean;
    referrals: number;
    investments: number;
    nodePurchases: number;
    referralActivities: number;
  };
  error?: string;
}> {
  const wallet = walletAddress.toLowerCase();
  const result = {
    success: false,
    deleted: { user: false, referrals: 0, investments: 0, nodePurchases: 0, referralActivities: 0 },
  };

  try {
    // 1. referrals (referrerWallet == wallet OR referredWallet == wallet)
    const referralsRef = collection(db, "referrals");
    const [asReferrer, asReferred] = await Promise.all([
      getDocs(query(referralsRef, where("referrerWallet", "==", wallet))),
      getDocs(query(referralsRef, where("referredWallet",  "==", wallet))),
    ]);
    const refDocs = [...asReferrer.docs, ...asReferred.docs];
    await Promise.all(refDocs.map(d => deleteDoc(doc(db, "referrals", d.id))));
    result.deleted.referrals = refDocs.length;

    // 2. user_investments (walletAddress == wallet)
    const investRef = collection(db, "user_investments");
    const investSnap = await getDocs(query(investRef, where("walletAddress", "==", wallet)));
    await Promise.all(investSnap.docs.map(d => deleteDoc(doc(db, "user_investments", d.id))));
    result.deleted.investments = investSnap.size;

    // 3. nodePurchases (walletAddress == wallet)
    const nodeRef = collection(db, "nodePurchases");
    const nodeSnap = await getDocs(query(nodeRef, where("walletAddress", "==", wallet)));
    await Promise.all(nodeSnap.docs.map(d => deleteDoc(doc(db, "nodePurchases", d.id))));
    result.deleted.nodePurchases = nodeSnap.size;

    // 4. referral_activities (referrerWallet OR referredWallet == wallet)
    const actRef = collection(db, "referral_activities");
    const [actAsReferrer, actAsReferred] = await Promise.all([
      getDocs(query(actRef, where("referrerWallet", "==", wallet))),
      getDocs(query(actRef, where("referredWallet",  "==", wallet))),
    ]);
    const actDocs = [...actAsReferrer.docs, ...actAsReferred.docs];
    await Promise.all(actDocs.map(d => deleteDoc(doc(db, "referral_activities", d.id))));
    result.deleted.referralActivities = actDocs.length;

    // 5. users document (last — after all related data removed)
    await deleteDoc(doc(db, USERS_COLLECTION, wallet));
    result.deleted.user = true;

    result.success = true;
    return result;
  } catch (error: any) {
    console.error("deleteUserCompletely error:", error);
    return { ...result, error: error?.message || "Unknown error" };
  }
}
