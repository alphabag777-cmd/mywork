/**
 * Referral validation utilities
 * Checks if referral codes/links are registered for projects
 */

import { getUserInvestments } from "./userInvestments";

const REFERRAL_LINKS_STORAGE_KEY = "alphabag_referral_links";
const LOOMX_PROJECT_ID = "loomx";

export interface ReferralLink {
  id: string;
  name: string;
  logo: string;
  placeholder: string;
  link: string;
  saved: boolean;
}

/**
 * Check if Loomx referral link is registered
 */
export function isLoomxReferralRegistered(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const stored = localStorage.getItem(REFERRAL_LINKS_STORAGE_KEY);
    if (!stored) {
      return false;
    }

    const links: ReferralLink[] = JSON.parse(stored);
    const loomxLink = links.find((link) => link.id === LOOMX_PROJECT_ID);
    
    // Check if Loomx link exists and has a saved/valid link
    return loomxLink ? !!loomxLink.link && loomxLink.link.trim() !== "" : false;
  } catch (error) {
    console.error("Error checking Loomx referral registration:", error);
    return false;
  }
}

/**
 * Get Loomx referral link if registered
 */
export function getLoomxReferralLink(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(REFERRAL_LINKS_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const links: ReferralLink[] = JSON.parse(stored);
    const loomxLink = links.find((link) => link.id === LOOMX_PROJECT_ID);
    
    return loomxLink?.link || null;
  } catch (error) {
    console.error("Error getting Loomx referral link:", error);
    return null;
  }
}

/**
 * Check if a wallet is new (has no investments in database)
 */
export async function isNewWallet(walletAddress: string): Promise<boolean> {
  if (!walletAddress) {
    return true; // Treat as new if no address provided
  }

  try {
    const investments = await getUserInvestments(walletAddress.toLowerCase());
    // Wallet is new if it has no investments
    return investments.length === 0;
  } catch (error) {
    console.error("Error checking if wallet is new:", error);
    // On error, treat as new to be safe (require referral registration)
    return true;
  }
}
