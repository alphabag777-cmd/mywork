/**
 * User Selected Plans Storage
 * Tracks which investment plans each user has selected for display and referral sharing.
 * Supports two modes:
 *   - "single": one plan selected
 *   - "portfolio": the 40:40:20 portfolio (up to 3 plans)
 */

import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type PlanSelectionMode = "single" | "portfolio" | "multi";

export interface UserSelectedPlans {
  userId: string;                   // Wallet address (lowercase)
  mode: PlanSelectionMode;          // "single" | "portfolio"
  planIds: string[];                // Selected plan IDs (1 for single, up to 3 for portfolio)
  createdAt: number;
  updatedAt: number;
}

const COLLECTION = "userSelectedPlans";
const LOCAL_KEY_PREFIX = "alphabag_selected_plans_";

// ── Helpers ──────────────────────────────────────────

function timestampToNumber(ts: any): number {
  if (ts?.toMillis) return ts.toMillis();
  if (ts?.seconds) return ts.seconds * 1000;
  return ts || Date.now();
}

function fromFirestore(data: any, userId: string): UserSelectedPlans {
  return {
    userId,
    mode: data.mode || "single",
    planIds: Array.isArray(data.planIds) ? data.planIds : [],
    createdAt: timestampToNumber(data.createdAt),
    updatedAt: timestampToNumber(data.updatedAt),
  };
}

function toFirestore(data: Partial<UserSelectedPlans>): any {
  const now = Timestamp.now();
  return {
    userId: data.userId || "",
    mode: data.mode || "single",
    planIds: data.planIds || [],
    createdAt: data.createdAt ? Timestamp.fromMillis(data.createdAt) : now,
    updatedAt: now,
  };
}

// ── LocalStorage fallback ─────────────────────────────

function localKey(userId: string) {
  return LOCAL_KEY_PREFIX + userId.toLowerCase();
}

function getFromLocal(userId: string): UserSelectedPlans | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(localKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as UserSelectedPlans;
  } catch {
    return null;
  }
}

function saveToLocal(data: UserSelectedPlans): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(localKey(data.userId), JSON.stringify(data));
}

// ── Public API ───────────────────────────────────────

/**
 * Get the selected plans for a user.
 * Returns null if none have been saved.
 */
export async function getUserSelectedPlans(userId: string): Promise<UserSelectedPlans | null> {
  const uid = userId.toLowerCase();
  try {
    const ref = doc(db, COLLECTION, uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = fromFirestore(snap.data(), uid);
      saveToLocal(data); // sync to local
      return data;
    }
    // fallback
    return getFromLocal(uid);
  } catch (err) {
    console.error("getUserSelectedPlans error:", err);
    return getFromLocal(uid);
  }
}

/**
 * Save / update the user's selected plans.
 */
export async function saveUserSelectedPlans(
  userId: string,
  mode: PlanSelectionMode,
  planIds: string[]
): Promise<UserSelectedPlans> {
  const uid = userId.toLowerCase();
  const now = Date.now();

  // No hard cap — save all provided IDs
  const ids = planIds;

  const existing = await getUserSelectedPlans(uid);
  const data: UserSelectedPlans = {
    userId: uid,
    mode,
    planIds: ids,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  try {
    const ref = doc(db, COLLECTION, uid);
    await setDoc(ref, toFirestore(data));
  } catch (err) {
    console.error("saveUserSelectedPlans Firestore error:", err);
    // continue with local save
  }

  saveToLocal(data);
  return data;
}

/**
 * Clear the user's selected plans.
 */
export async function clearUserSelectedPlans(userId: string): Promise<void> {
  await saveUserSelectedPlans(userId, "single", []);
}

/**
 * Check whether a user has selected any plans.
 */
export async function hasUserSelectedPlans(userId: string): Promise<boolean> {
  const data = await getUserSelectedPlans(userId);
  return !!(data && data.planIds.length > 0);
}

/**
 * Get the plan IDs the user has selected (for filtering display).
 * Returns empty array if none selected (show all).
 */
export async function getSelectedPlanIds(userId: string): Promise<string[]> {
  const data = await getUserSelectedPlans(userId);
  return data?.planIds || [];
}
