/**
 * User investment tracking for individual projects
 * Tracks investments by category (BBAG, SBAG, CBAG) and project
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

export type InvestmentCategory = "BBAG" | "SBAG" | "CBAG" | "SELF_COLLECTION";

export interface UserInvestment {
  id: string;
  userId: string; // Wallet address
  category: InvestmentCategory; // BBAG, SBAG, or CBAG
  projectId: string; // Plan ID
  projectName: string; // Plan name
  amount: number; // Investment amount in USDT
  ownershipPercentage: number; // User's ownership percentage in this project
  transactionHash?: string; // Transaction hash if applicable
  investedAt: number; // Timestamp when investment was made
  // Token calculations (for BBAG and SBAG)
  tokenAmount?: number; // Number of tokens received (calculated from amount * conversion rate)
  tokenValueUSDT?: number; // Current value of tokens in USDT (calculated from tokenAmount * tokenPrice)
  profit?: number; // Profit in USDT (calculated from tokenValueUSDT - amount)
  createdAt: number;
  updatedAt: number;
}

const USER_INVESTMENTS_COLLECTION = "user_investments";

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

function fromFirestore(docData: any, id: string): UserInvestment {
  return {
    id,
    userId: docData.userId || "",
    category: docData.category || "BBAG",
    projectId: docData.projectId || "",
    projectName: docData.projectName || "",
    amount: docData.amount || 0,
    ownershipPercentage: docData.ownershipPercentage || 0,
    transactionHash: docData.transactionHash || null,
    investedAt: timestampToNumber(docData.investedAt),
    tokenAmount: docData.tokenAmount || undefined,
    tokenValueUSDT: docData.tokenValueUSDT || undefined,
    profit: docData.profit || undefined,
    createdAt: timestampToNumber(docData.createdAt),
    updatedAt: timestampToNumber(docData.updatedAt),
  };
}

function toFirestore(investment: Partial<UserInvestment>): any {
  const now = Timestamp.now();
  return {
    userId: investment.userId?.toLowerCase() || "",
    category: investment.category || "BBAG",
    projectId: investment.projectId || "",
    projectName: investment.projectName || "",
    amount: investment.amount || 0,
    ownershipPercentage: investment.ownershipPercentage || 0,
    transactionHash: investment.transactionHash || null,
    investedAt: investment.investedAt ? Timestamp.fromMillis(investment.investedAt) : now,
    tokenAmount: investment.tokenAmount !== undefined ? investment.tokenAmount : null,
    tokenValueUSDT: investment.tokenValueUSDT !== undefined ? investment.tokenValueUSDT : null,
    profit: investment.profit !== undefined ? investment.profit : null,
    createdAt: investment.createdAt ? Timestamp.fromMillis(investment.createdAt) : now,
    updatedAt: now,
  };
}

/**
 * Extract category from project name
 * Looks for BBAG, SBAG, CBAG, or SELF_COLLECTION in the name
 */
export function extractCategoryFromName(projectName: string): InvestmentCategory {
  const nameUpper = projectName.toUpperCase();
  if (nameUpper.includes("SELF_COLLECTION") || nameUpper.includes("셀프콜렉션")) return "SELF_COLLECTION";
  if (nameUpper.includes("+SBAG+") || nameUpper.includes("SBAG")) {
    if (nameUpper.includes("CBAG")) return "CBAG";
    return "SBAG";
  }
  if (nameUpper.includes("CBAG")) return "CBAG";
  if (nameUpper.includes("BBAG")) return "BBAG";
  // Default to BBAG if no category found
  return "BBAG";
}

/**
 * Save a user investment
 */
export async function saveUserInvestment(
  investment: Omit<UserInvestment, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<UserInvestment> {
  try {
    const now = Date.now();
    const investmentId = investment.id || `investment_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    const investmentData: UserInvestment = {
      ...investment,
      id: investmentId,
      category: investment.category || extractCategoryFromName(investment.projectName),
      createdAt: now,
      updatedAt: now,
    };
    
    const investmentRef = doc(db, USER_INVESTMENTS_COLLECTION, investmentId);
    await setDoc(investmentRef, toFirestore(investmentData));
    
    return investmentData;
  } catch (error) {
    console.error("Error saving user investment to Firestore:", error);
    throw error;
  }
}

/**
 * Get all investments for a user
 */
export async function getUserInvestments(userId: string): Promise<UserInvestment[]> {
  try {
    const investmentsRef = collection(db, USER_INVESTMENTS_COLLECTION);
    const normalizedUserId = userId.toLowerCase();
    
    try {
      const q = query(
        investmentsRef,
        where("userId", "==", normalizedUserId),
        orderBy("investedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      const investments: UserInvestment[] = [];
      querySnapshot.forEach((doc) => {
        investments.push(fromFirestore(doc.data(), doc.id));
      });
      
      investments.sort((a, b) => b.investedAt - a.investedAt);
      
      return investments;
    } catch (orderByError: any) {
      if (orderByError.code === "failed-precondition") {
        console.warn("Composite index missing, fetching without orderBy:", orderByError);
        const q = query(
          investmentsRef,
          where("userId", "==", normalizedUserId)
        );
        const querySnapshot = await getDocs(q);
        
        const investments: UserInvestment[] = [];
        querySnapshot.forEach((doc) => {
          investments.push(fromFirestore(doc.data(), doc.id));
        });
        
        investments.sort((a, b) => b.investedAt - a.investedAt);
        
        return investments;
      }
      throw orderByError;
    }
  } catch (error) {
    console.error("Error getting user investments from Firestore:", error);
    return [];
  }
}

/**
 * Get investments grouped by category
 */
export async function getUserInvestmentsByCategory(userId: string): Promise<Record<InvestmentCategory, UserInvestment[]>> {
  const investments = await getUserInvestments(userId);
  
  const grouped: Record<InvestmentCategory, UserInvestment[]> = {
    BBAG: [],
    SBAG: [],
    CBAG: [],
    SELF_COLLECTION: [],
  };
  
  investments.forEach((investment) => {
    const category = investment.category || "BBAG";
    if (grouped[category]) {
      grouped[category].push(investment);
    }
  });
  
  return grouped;
}

/**
 * Update a user investment (admin function)
 */
export async function updateUserInvestment(
  investmentId: string,
  updates: Partial<UserInvestment>
): Promise<UserInvestment> {
  try {
    const investmentRef = doc(db, USER_INVESTMENTS_COLLECTION, investmentId);
    const existingDoc = await getDoc(investmentRef);
    
    if (!existingDoc.exists()) {
      throw new Error("Investment not found");
    }
    
    const existingData = fromFirestore(existingDoc.data(), investmentId);
    const updatedData = {
      ...existingData,
      ...updates,
      updatedAt: Date.now(),
    };
    
    await setDoc(investmentRef, toFirestore(updatedData));
    return updatedData;
  } catch (error) {
    console.error("Error updating user investment from Firestore:", error);
    throw error;
  }
}

/**
 * Delete a user investment (admin function)
 */
export async function deleteUserInvestment(investmentId: string): Promise<boolean> {
  try {
    const investmentRef = doc(db, USER_INVESTMENTS_COLLECTION, investmentId);
    await deleteDoc(investmentRef);
    return true;
  } catch (error) {
    console.error("Error deleting user investment from Firestore:", error);
    throw error;
  }
}

/**
 * Get all investments for admin (all users)
 */
export async function getAllUserInvestments(): Promise<UserInvestment[]> {
  try {
    const investmentsRef = collection(db, USER_INVESTMENTS_COLLECTION);
    const q = query(investmentsRef, orderBy("investedAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const investments: UserInvestment[] = [];
    querySnapshot.forEach((doc) => {
      investments.push(fromFirestore(doc.data(), doc.id));
    });
    
    return investments;
  } catch (error) {
    console.error("Error getting all user investments from Firestore:", error);
    return [];
  }
}
