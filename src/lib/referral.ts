/**
 * Referral system utilities
 * Handles generation, storage, and tracking of referral codes
 */

const REFERRAL_CODE_KEY = "alphabag_referral_code";
const REFERRAL_CODE_LENGTH = 6;

/**
 * Generate a unique 6-digit referral code
 */
export function generateReferralCode(): string {
  // Generate a random 6-digit number (100000 to 999999)
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

/**
 * Get or create a referral code for the current user
 * Stores it in localStorage if it doesn't exist
 * If address is provided, validates it's not null or zero address
 */
export function getOrCreateReferralCode(address?: string | null): string {
  // Check for null/zero address if address parameter is provided
  if (address !== undefined && (address === null || address === "0x0000000000000000000000000000000000000000" || !address)) {
    return "";
  }

  if (typeof window === "undefined") {
    return generateReferralCode();
  }

  const stored = localStorage.getItem(REFERRAL_CODE_KEY);
  if (stored) {
    return stored;
  }

  const newCode = generateReferralCode();
  localStorage.setItem(REFERRAL_CODE_KEY, newCode);
  return newCode;
}

/**
 * Get the referral wallet address from URL parameters
 * Format: ?referral=0x...
 */
export function getReferralFromURL(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const referral = params.get("referral");
  console.log("Checking URL for referral parameter:", referral);
  
  // Validate it's a valid wallet address
  if (referral && referral.startsWith("0x") && referral.length === 42) {
    const normalized = referral.toLowerCase();
    console.log("Valid referral wallet found:", normalized);
    return normalized;
  }
  
  console.log("No valid referral found in URL");
  return null;
}

/**
 * Get the referral code from URL parameters (legacy support)
 */
export function getReferralCodeFromURL(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const code = params.get("ref");
  return code && code.length === REFERRAL_CODE_LENGTH ? code : null;
}

/**
 * Get the wallet address from URL parameters
 */
export function getWalletFromURL(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const wallet = params.get("wallet");
  return wallet && wallet.startsWith("0x") ? wallet : null;
}

/**
 * Store referral wallet address from URL as the referrer
 * This marks that the current user was referred by someone
 * Format: ?referral=0x...
 */
export function storeReferralFromURL(address?: string | null): boolean {
  // Check for null/zero address if address parameter is provided
  if (address !== undefined && (address === null || address === "0x0000000000000000000000000000000000000000" || !address)) {
    return false;
  }

  if (typeof window === "undefined") {
    return false;
  }

  // Get referral wallet address from URL
  const referrerWallet = getReferralFromURL();
  if (!referrerWallet) {
    return false;
  }

  // Don't store if it's the user's own wallet
  if (address && referrerWallet.toLowerCase() === address.toLowerCase()) {
    return false;
  }

  // Store the referrer wallet address
  const REFERRER_WALLET_KEY = "alphabag_referrer_wallet";
  const existingRef = localStorage.getItem(REFERRER_WALLET_KEY);
  
  // Only store if not already stored (first visit)
  if (!existingRef) {
    localStorage.setItem(REFERRER_WALLET_KEY, referrerWallet);
    return true;
  }

  return existingRef.toLowerCase() === referrerWallet.toLowerCase();
}

/**
 * Check if user was referred
 */
export function wasReferred(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const REFERRER_KEY = "alphabag_referrer_code";
  const referrer = localStorage.getItem(REFERRER_KEY);
  return !!referrer;
}

/**
 * Check if referral code has been registered (user completed onboarding)
 */
export function isReferralCodeRegistered(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const REGISTRATION_KEY = "alphabag_referral_registered";
  return localStorage.getItem(REGISTRATION_KEY) === "true";
}

/**
 * Mark referral code as registered (user completed onboarding)
 */
export function setReferralCodeRegistered(): void {
  if (typeof window === "undefined") {
    return;
  }

  const REGISTRATION_KEY = "alphabag_referral_registered";
  localStorage.setItem(REGISTRATION_KEY, "true");
}

/**
 * Clear referral registration (for testing/debugging)
 */
export function clearReferralRegistration(): void {
  if (typeof window === "undefined") {
    return;
  }

  const REGISTRATION_KEY = "alphabag_referral_registered";
  localStorage.removeItem(REGISTRATION_KEY);
}

/**
 * Get the referrer code
 */
export function getReferrerCode(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const REFERRER_KEY = "alphabag_referrer_code";
  return localStorage.getItem(REFERRER_KEY);
}

/**
 * Get the referrer wallet address
 */
export function getReferrerWallet(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const REFERRER_WALLET_KEY = "alphabag_referrer_wallet";
  const wallet = localStorage.getItem(REFERRER_WALLET_KEY);
  
  // Fallback to wallet from URL if not in localStorage
  if (!wallet) {
    return getWalletFromURL();
  }
  
  return wallet && wallet.startsWith("0x") ? wallet : null;
}

/**
 * Generate referral link with user's wallet address
 * Format: https://alpha-bag.com/?referral=0x...
 */
export function generateReferralLink(baseUrl?: string, address?: string | null): string {
  const url = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  
  // Use wallet address directly in the referral parameter
  if (address && address !== "0x0000000000000000000000000000000000000000" && address.startsWith("0x")) {
    return `${url}/?referral=${address}`;
  }
  
  return url;
}

/**
 * Clear referral data (for testing/debugging)
 */
export function clearReferralData(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(REFERRAL_CODE_KEY);
  localStorage.removeItem("alphabag_referrer_code");
  localStorage.removeItem("alphabag_referrer_wallet");
  clearReferralRegistration();
}

/**
 * Add a user as a direct referral to their referrer
 * This is called when a user connects with a referral link
 */
export function addDirectReferral(referrerAddress: string, referredAddress: string): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!referrerAddress || !referredAddress || referrerAddress.toLowerCase() === referredAddress.toLowerCase()) {
    return;
  }

  const DIRECT_REFERRALS_KEY = `alphabag_direct_referrals_${referrerAddress.toLowerCase()}`;
  const stored = localStorage.getItem(DIRECT_REFERRALS_KEY);
  const referrals: Array<{
    address: string;
    level: string;
    directPush: { current: number; required: number };
    personalPerformance: number;
    communityPerformance: number;
    thirtySky: number;
    totalTeamPerformance: number;
    totalTeamMembers: number;
  }> = stored ? JSON.parse(stored) : [];

  // Check if this referral already exists
  const existingIndex = referrals.findIndex(
    (r) => r.address.toLowerCase() === referredAddress.toLowerCase()
  );

  if (existingIndex === -1) {
    // Add new referral with default values
    referrals.push({
      address: referredAddress,
      level: "S0",
      directPush: { current: 0, required: 5 },
      personalPerformance: 0,
      communityPerformance: 0,
      thirtySky: 0,
      totalTeamPerformance: 0,
      totalTeamMembers: 0,
    });
    localStorage.setItem(DIRECT_REFERRALS_KEY, JSON.stringify(referrals));
  }
}

/**
 * Get direct referrals for a given address
 */
export function getDirectReferrals(address: string): Array<{
  address: string;
  level: string;
  directPush: { current: number; required: number };
  personalPerformance: number;
  communityPerformance: number;
  thirtySky: number;
  totalTeamPerformance: number;
  totalTeamMembers: number;
}> {
  if (typeof window === "undefined" || !address) {
    return [];
  }

  const DIRECT_REFERRALS_KEY = `alphabag_direct_referrals_${address.toLowerCase()}`;
  const stored = localStorage.getItem(DIRECT_REFERRALS_KEY);
  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse direct referrals:", e);
    return [];
  }
}

