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
    const referralWallet = getReferralFromURL();
    if (referralWallet && !hasProcessedRef.current) {
      const REFERRER_WALLET_KEY = "alphabag_referrer_wallet";
      const existingRef = localStorage.getItem(REFERRER_WALLET_KEY);
      if (!existingRef) {
        localStorage.setItem(REFERRER_WALLET_KEY, referralWallet);
        hasProcessedRef.current = true;
      }
    }
  }, []);

  // When wallet connects, save to Firebase
  useEffect(() => {
    if (!isConnected || !address) return;

    const saveReferralData = async () => {
      try {
        const referralWallet = getReferrerWallet();

        if (referralWallet && referralWallet.toLowerCase() !== address.toLowerCase()) {
          await saveUser(address, {
            walletAddress: address,
            referrerWallet: referralWallet,
            isRegistered: true,
          });

          await saveReferral(referralWallet, address, "");
          toast.success("Referral link detected! You've been registered.");
        } else {
          // 레퍼럴 없이 유저 저장 — 실패해도 사용자에게 알리지 않음
          await saveUser(address, {
            walletAddress: address,
            referrerWallet: referralWallet || null,
            isRegistered: true,
          });
        }
      } catch (error) {
        // 레퍼럴 저장 실패는 사용자 경험에 영향 없는 백그라운드 작업이므로
        // 토스트 에러 대신 콘솔에만 기록
        console.warn("⚠️ Failed to save user/referral to Firebase (non-critical):", error);
      }
    };

    saveReferralData();
  }, [address, isConnected]);

  return null;
};
