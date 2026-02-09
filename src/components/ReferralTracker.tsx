import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { storeReferralFromURL, getReferralFromURL, getReferrerWallet } from "@/lib/referral";
import { saveUser } from "@/lib/users";
import { saveReferral } from "@/lib/referrals";
import { toast } from "sonner";

/**
 * Component to track referrals on page load
 * Checks URL parameters for referral wallet addresses and stores them
 * Automatically saves to Firebase when user connects wallet
 */
export const ReferralTracker = () => {
  const { address, isConnected } = useAccount();
  const hasProcessedRef = useRef(false);

  // First, check URL for referral parameter even before wallet connects
  useEffect(() => {
    // Check for referral in URL and store it in localStorage
    const referralWallet = getReferralFromURL();
    if (referralWallet && !hasProcessedRef.current) {
      // Store referral in localStorage immediately (even without wallet)
      const REFERRER_WALLET_KEY = "alphabag_referrer_wallet";
      const existingRef = localStorage.getItem(REFERRER_WALLET_KEY);
      
      if (!existingRef) {
        localStorage.setItem(REFERRER_WALLET_KEY, referralWallet);
        console.log("✅ Referral stored from URL:", referralWallet);
        hasProcessedRef.current = true;
      }
    }
  }, []);

  // When wallet connects, save to Firebase
  useEffect(() => {
    if (!isConnected || !address) {
      return;
    }

    const saveReferralData = async () => {
      try {
        // Get referral wallet from localStorage (stored from URL)
        const referralWallet = getReferrerWallet();
        
        if (referralWallet && referralWallet.toLowerCase() !== address.toLowerCase()) {
          console.log("💾 Saving referral to Firebase:", {
            referrer: referralWallet,
            referred: address,
          });
          
          // Save user with referrer info
          await saveUser(address, {
            walletAddress: address,
            referrerWallet: referralWallet,
            isRegistered: true,
          });
          
          // Save referral relationship
          await saveReferral(referralWallet, address, "");
          
          console.log("✅ Referral saved to Firebase successfully");
          toast.success("Referral link detected! You've been registered.");
        } else {
          // User connected but no referral - just save user info
          await saveUser(address, {
            walletAddress: address,
            referrerWallet: referralWallet || null,
            isRegistered: true,
          });
          console.log("✅ User saved to Firebase");
        }
      } catch (error) {
        console.error("❌ Failed to save referral to Firebase:", error);
        toast.error("Failed to save referral. Please try again.");
      }
    };
    
    saveReferralData();
  }, [address, isConnected]);

  return null; // This component doesn't render anything
};
