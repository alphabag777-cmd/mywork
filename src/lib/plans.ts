/**
 * Plan storage and management utilities
 * Handles CRUD operations for investment plans using Firebase Firestore
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type PlanStatus = "Display Node" | "ICO" | "Daily profit" | "Trading";

export interface InvestmentPlan {
  id: string;
  name: string;
  label: string;
  dailyProfit: string;
  status?: PlanStatus; // Status badge: Display Node, ICO, Daily profit, or Trading
  focus: string;
  logo: string;
  dappUrl: string;
  description: string;
  tags: string[];
  quickActionsDescription: string;
  youtubeUrl: string;
  telegram: string;
  twitter: string;
  materials: Array<{ title: string; url: string }>;
  recommendedAmount: string;
  referralCode?: string; // Auto-generated referral code for the project
  sortOrder?: number; // Order for display (lower numbers appear first)
  // Wallet allocation for investment distribution
  wallet1?: string; // First wallet address (BBAG)
  wallet1Percentage?: number; // Percentage for first wallet (0-100)
  useUserAddress1?: boolean; // If true, use user's wallet address instead of wallet1
  wallet1TokenConversionRate?: number; // Tokens per USDT for Wallet 1 (BBAG), e.g., 2 means 1 USDT = 2 tokens
  wallet1TokenPrice?: number; // Current token price in USDT for Wallet 1 (BBAG)
  wallet2?: string; // Second wallet address (SBAG)
  wallet2Percentage?: number; // Percentage for second wallet (0-100)
  useUserAddress2?: boolean; // If true, use user's wallet address instead of wallet2
  wallet2TokenConversionRate?: number; // Tokens per USDT for Wallet 2 (SBAG), e.g., 2 means 1 USDT = 2 tokens
  wallet2TokenPrice?: number; // Current token price in USDT for Wallet 2 (SBAG)
  wallet3?: string; // Third wallet address
  wallet3Percentage?: number; // Percentage for third wallet (0-100)
  useUserAddress3?: boolean; // If true, use user's wallet address instead of wallet3
  createdAt: number;
  updatedAt: number;
}

const PLANS_COLLECTION = "investment_plans";

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
 * Convert plan data from Firestore format
 */
function fromFirestore(docData: any, id: string): InvestmentPlan {
  return {
    id,
    name: docData.name || "",
    label: docData.label || "",
    dailyProfit: docData.dailyProfit || "",
    status: docData.status || "Daily profit", // Default to "Daily profit" for backwards compatibility
    wallet1: docData.wallet1 || "",
    wallet1Percentage: docData.wallet1Percentage || 0,
    useUserAddress1: docData.useUserAddress1 || false,
    wallet1TokenConversionRate: docData.wallet1TokenConversionRate || 0,
    wallet1TokenPrice: docData.wallet1TokenPrice || 0,
    wallet2: docData.wallet2 || "",
    wallet2Percentage: docData.wallet2Percentage || 0,
    useUserAddress2: docData.useUserAddress2 || false,
    wallet2TokenConversionRate: docData.wallet2TokenConversionRate || 0,
    wallet2TokenPrice: docData.wallet2TokenPrice || 0,
    wallet3: docData.wallet3 || "",
    wallet3Percentage: docData.wallet3Percentage || 0,
    useUserAddress3: docData.useUserAddress3 || false,
    focus: docData.focus || "",
    logo: docData.logo || "",
    dappUrl: docData.dappUrl || "",
    description: docData.description || "",
    tags: docData.tags || [],
    quickActionsDescription: docData.quickActionsDescription || "",
    youtubeUrl: docData.youtubeUrl || "",
    telegram: docData.telegram || "",
    twitter: docData.twitter || "",
    materials: docData.materials || [],
    recommendedAmount: docData.recommendedAmount || "1000",
    referralCode: docData.referralCode || "",
    sortOrder: docData.sortOrder !== undefined ? docData.sortOrder : 999999, // Default to high number if not set
    createdAt: timestampToNumber(docData.createdAt),
    updatedAt: timestampToNumber(docData.updatedAt),
  };
}

/**
 * Convert plan data to Firestore format
 */
function toFirestore(plan: Partial<InvestmentPlan>): any {
  const now = Timestamp.now();
  return {
    name: plan.name || "",
    label: plan.label || "",
    dailyProfit: plan.dailyProfit || "",
    status: plan.status || "Daily profit",
    focus: plan.focus || "",
    logo: plan.logo || "",
    dappUrl: plan.dappUrl || "",
    description: plan.description || "",
    tags: plan.tags || [],
    quickActionsDescription: plan.quickActionsDescription || "",
    youtubeUrl: plan.youtubeUrl || "",
    telegram: plan.telegram || "",
    twitter: plan.twitter || "",
    materials: plan.materials || [],
    recommendedAmount: plan.recommendedAmount || "1000",
    referralCode: plan.referralCode || "",
    sortOrder: plan.sortOrder !== undefined ? plan.sortOrder : 999999,
    wallet1: plan.wallet1 || "",
    wallet1Percentage: plan.wallet1Percentage !== undefined ? plan.wallet1Percentage : 0,
    useUserAddress1: plan.useUserAddress1 || false,
    wallet1TokenConversionRate: plan.wallet1TokenConversionRate !== undefined ? plan.wallet1TokenConversionRate : 0,
    wallet1TokenPrice: plan.wallet1TokenPrice !== undefined ? plan.wallet1TokenPrice : 0,
    wallet2: plan.wallet2 || "",
    wallet2Percentage: plan.wallet2Percentage !== undefined ? plan.wallet2Percentage : 0,
    useUserAddress2: plan.useUserAddress2 || false,
    wallet2TokenConversionRate: plan.wallet2TokenConversionRate !== undefined ? plan.wallet2TokenConversionRate : 0,
    wallet2TokenPrice: plan.wallet2TokenPrice !== undefined ? plan.wallet2TokenPrice : 0,
    wallet3: plan.wallet3 || "",
    wallet3Percentage: plan.wallet3Percentage !== undefined ? plan.wallet3Percentage : 0,
    useUserAddress3: plan.useUserAddress3 || false,
    createdAt: plan.createdAt ? Timestamp.fromMillis(plan.createdAt) : now,
    updatedAt: now,
  };
}

/**
 * Get all plans from Firestore
 */
export async function getAllPlans(): Promise<InvestmentPlan[]> {
  try {
    const plansRef = collection(db, PLANS_COLLECTION);
    // Fetch all plans and sort in memory (avoids needing Firestore index)
    const querySnapshot = await getDocs(plansRef);
    
    const plans: InvestmentPlan[] = [];
    querySnapshot.forEach((doc) => {
      try {
        plans.push(fromFirestore(doc.data(), doc.id));
      } catch (docError) {
        console.error(`Error parsing plan ${doc.id}:`, docError);
      }
    });
    
    console.log(`Loaded ${plans.length} plans from Firestore`);
    
    // Sort by sortOrder, then by createdAt if sortOrder is the same
    // Plans without sortOrder get 999999 (appear last)
    const sorted = plans.sort((a, b) => {
      const aOrder = a.sortOrder !== undefined ? a.sortOrder : 999999;
      const bOrder = b.sortOrder !== undefined ? b.sortOrder : 999999;
      const orderDiff = aOrder - bOrder;
      if (orderDiff !== 0) return orderDiff;
      return b.createdAt - a.createdAt; // Newer first if same order
    });
    
    return sorted;
  } catch (error) {
    console.error("Error getting plans from Firestore:", error);
    console.log("Falling back to localStorage...");
    // Fallback to localStorage if Firestore fails
    const localPlans = getPlansFromLocalStorage();
    console.log(`Loaded ${localPlans.length} plans from localStorage`);
    // Sort local plans the same way
    return localPlans.sort((a, b) => {
      const aOrder = a.sortOrder !== undefined ? a.sortOrder : 999999;
      const bOrder = b.sortOrder !== undefined ? b.sortOrder : 999999;
      const orderDiff = aOrder - bOrder;
      if (orderDiff !== 0) return orderDiff;
      return b.createdAt - a.createdAt;
    });
  }
}

/**
 * Get a plan by ID from Firestore
 */
export async function getPlanById(id: string): Promise<InvestmentPlan | null> {
  try {
    const planRef = doc(db, PLANS_COLLECTION, id);
    const planSnap = await getDoc(planRef);
    
    if (planSnap.exists()) {
      return fromFirestore(planSnap.data(), planSnap.id);
    }
    
    return null;
  } catch (error) {
    console.error("Error getting plan from Firestore:", error);
    // Fallback to localStorage
    const plans = getPlansFromLocalStorage();
    return plans.find((p) => p.id === id) || null;
  }
}

/**
 * Generate a unique referral code for a plan
 */
function generatePlanReferralCode(planLabel: string): string {
  // Generate a random 6-character alphanumeric code
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Use plan label prefix if available, otherwise use generic prefix
  const prefix = planLabel ? planLabel.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 3) : "REF";
  return `${prefix}-${code}`;
}

/**
 * Save a plan (create or update) to Firestore
 */
export async function savePlan(
  plan: Omit<InvestmentPlan, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<InvestmentPlan> {
  try {
    const now = Date.now();
    const planId = plan.id || `plan_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get existing plan to preserve createdAt if updating
    let existingPlan: InvestmentPlan | null = null;
    if (plan.id) {
      existingPlan = await getPlanById(plan.id);
    }
    
    // Generate referral code only for new plans (not when updating)
    let referralCode = plan.referralCode || existingPlan?.referralCode;
    if (!referralCode && !plan.id) {
      // New plan - generate referral code
      referralCode = generatePlanReferralCode(plan.label);
    }
    
    const planData = toFirestore({
      ...plan,
      referralCode,
      createdAt: existingPlan?.createdAt || now,
    });
    
    const planRef = doc(db, PLANS_COLLECTION, planId);
    await setDoc(planRef, planData);
    
    // Also save to localStorage as backup
    savePlanToLocalStorage({
      ...plan,
      id: planId,
      referralCode,
    });
    
    return {
      ...plan,
      id: planId,
      referralCode,
      createdAt: existingPlan?.createdAt || now,
      updatedAt: now,
    } as InvestmentPlan;
  } catch (error) {
    console.error("Error saving plan to Firestore:", error);
    // Fallback to localStorage
    return savePlanToLocalStorage(plan);
  }
}

/**
 * Delete a plan by ID from Firestore
 */
export async function deletePlan(id: string): Promise<boolean> {
  try {
    const planRef = doc(db, PLANS_COLLECTION, id);
    await deleteDoc(planRef);
    
    // Also remove from localStorage
    deletePlanFromLocalStorage(id);
    
    return true;
  } catch (error) {
    console.error("Error deleting plan from Firestore:", error);
    // Fallback to localStorage
    return deletePlanFromLocalStorage(id);
  }
}

/**
 * Update the sort order of multiple plans
 */
export async function updatePlanOrder(planOrders: Array<{ id: string; sortOrder: number }>): Promise<void> {
  try {
    const updatePromises = planOrders.map(({ id, sortOrder }) => {
      const planRef = doc(db, PLANS_COLLECTION, id);
      return setDoc(planRef, { sortOrder, updatedAt: Timestamp.now() }, { merge: true });
    });
    
    await Promise.all(updatePromises);
    
    // Also update localStorage
    if (typeof window !== "undefined") {
      const plans = getPlansFromLocalStorage();
      const updatedPlans = plans.map((plan) => {
        const orderUpdate = planOrders.find((o) => o.id === plan.id);
        if (orderUpdate) {
          return { ...plan, sortOrder: orderUpdate.sortOrder, updatedAt: Date.now() };
        }
        return plan;
      });
      localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(updatedPlans));
    }
  } catch (error) {
    console.error("Error updating plan order:", error);
    throw error;
  }
}

/**
 * Clear all plans (for testing/debugging)
 */
export async function clearAllPlans(): Promise<void> {
  try {
    const plans = await getAllPlans();
    const deletePromises = plans.map((plan) => deletePlan(plan.id));
    await Promise.all(deletePromises);
    
    // Also clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("alphabag_investment_plans");
    }
  } catch (error) {
    console.error("Error clearing plans from Firestore:", error);
  }
}

// ========== LocalStorage Fallback Functions ==========

const PLANS_STORAGE_KEY = "alphabag_investment_plans";

function getPlansFromLocalStorage(): InvestmentPlan[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = localStorage.getItem(PLANS_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const plans = JSON.parse(stored);
    // Ensure all plans have sortOrder
    return plans.map((plan: InvestmentPlan, index: number) => ({
      ...plan,
      sortOrder: plan.sortOrder !== undefined ? plan.sortOrder : index,
    }));
  } catch (e) {
    console.error("Failed to parse plans from localStorage:", e);
    return [];
  }
}

function savePlanToLocalStorage(
  plan: Omit<InvestmentPlan, "id" | "createdAt" | "updatedAt"> & { id?: string }
): InvestmentPlan {
  if (typeof window === "undefined") {
    throw new Error("Cannot save plan: window is undefined");
  }

  const plans = getPlansFromLocalStorage();
  const now = Date.now();

  if (plan.id && plans.some((p) => p.id === plan.id)) {
    // Update existing plan - preserve referral code if not provided
    const existingPlan = plans.find((p) => p.id === plan.id);
    const referralCode = plan.referralCode || existingPlan?.referralCode || "";
    const sortOrder = plan.sortOrder !== undefined ? plan.sortOrder : (existingPlan?.sortOrder || 999999);
    
    const updatedPlans = plans.map((p) =>
      p.id === plan.id
        ? {
            ...plan,
            id: plan.id,
            referralCode,
            status: plan.status || p.status || "Daily profit",
            sortOrder,
            updatedAt: now,
            createdAt: p.createdAt,
          }
        : p
    );
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(updatedPlans));
    return updatedPlans.find((p) => p.id === plan.id)!;
  } else {
    // Create new plan - generate referral code if not provided
    let referralCode = plan.referralCode;
    if (!referralCode) {
      referralCode = generatePlanReferralCode(plan.label);
    }
    
    // Get max sortOrder and add 1 for new plan
    const maxSortOrder = plans.length > 0 
      ? Math.max(...plans.map(p => p.sortOrder || 999999)) 
      : -1;
    
    const newPlan: InvestmentPlan = {
      ...plan,
      id: plan.id || `plan_${now}_${Math.random().toString(36).substr(2, 9)}`,
      referralCode,
      status: plan.status || "Daily profit",
      sortOrder: plan.sortOrder !== undefined ? plan.sortOrder : (maxSortOrder + 1),
      createdAt: now,
      updatedAt: now,
    };
    plans.push(newPlan);
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
    return newPlan;
  }
}

function deletePlanFromLocalStorage(id: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const plans = getPlansFromLocalStorage();
  const filtered = plans.filter((p) => p.id !== id);
  
  if (filtered.length === plans.length) {
    return false; // Plan not found
  }

  localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}
