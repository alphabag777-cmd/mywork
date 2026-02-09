import { useEffect, useState, useRef } from "react";
import { useAccount } from "wagmi";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Loader2 } from "lucide-react";
import { isLoomxReferralRegistered, isNewWallet } from "@/lib/referralValidation";
import { setReferralCodeRegistered } from "@/lib/referral";
import { toast } from "sonner";

// LocalStorage key to track if pop-up has been shown for a wallet
const LOOMX_GUARD_SHOWN_KEY = "loomx_referral_guard_shown";

/**
 * Component that enforces mandatory Loomx referral registration for new wallets
 * Shows a non-dismissible pop-up when a new wallet connects without referral registration
 */
export const LoomxReferralGuard = () => {
  const { address, isConnected } = useAccount();
  const [showDialog, setShowDialog] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState<string>("");
  const [isRegisteringReferral, setIsRegisteringReferral] = useState(false);
  const checkedWalletRef = useRef<string | null>(null);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    const checkReferralRequirement = async () => {
      // Only check if wallet is connected
      if (!isConnected || !address) {
        setShowDialog(false);
        setIsChecking(false);
        return;
      }

      const normalizedAddress = address.toLowerCase();
      const hasShownKey = `${LOOMX_GUARD_SHOWN_KEY}_${normalizedAddress}`;

      // Always check if referral is registered first
      const referralRegistered = isLoomxReferralRegistered();
      console.log("[LoomxReferralGuard] Referral registered:", referralRegistered);
      
      // If referral is registered, clear any flags and don't show
      if (referralRegistered) {
        console.log("[LoomxReferralGuard] Referral already registered, not showing dialog");
        setShowDialog(false);
        localStorage.removeItem(hasShownKey);
        checkedWalletRef.current = normalizedAddress;
        hasCheckedRef.current = true;
        setIsChecking(false);
        return;
      }

      // If we already checked this wallet, re-check referral status
      if (checkedWalletRef.current === normalizedAddress && hasCheckedRef.current) {
        // Re-check referral status in case it was just registered
        const currentReferralStatus = isLoomxReferralRegistered();
        if (currentReferralStatus) {
          console.log("[LoomxReferralGuard] Referral now registered, hiding dialog");
          setShowDialog(false);
          localStorage.removeItem(hasShownKey);
        } else {
          // Referral still not registered, show dialog
          console.log("[LoomxReferralGuard] Referral still not registered, showing dialog");
          setShowDialog(true);
        }
        setIsChecking(false);
        return;
      }

      try {
        setIsChecking(true);

        // Check if wallet is new (has no investments in database)
        const walletIsNew = await isNewWallet(address);
        console.log("[LoomxReferralGuard] Wallet is new:", walletIsNew, "Address:", normalizedAddress);

        // Show pop-up if referral is not registered
        // For new wallets, always show. For existing wallets, show if referral not registered
        if (walletIsNew) {
          console.log("[LoomxReferralGuard] Showing dialog for new wallet without referral");
          setShowDialog(true);
          // Mark that we've shown the pop-up for this wallet (but allow it to show again if not registered)
          localStorage.setItem(hasShownKey, "true");
        } else {
          // For existing wallets, still show if referral is not registered
          // This ensures users who haven't registered yet will see the dialog
          console.log("[LoomxReferralGuard] Wallet is not new, but checking if referral is registered");
          // Referral check already done above, so if we reach here, referral is not registered
          // Show dialog to allow registration
          setShowDialog(true);
          localStorage.setItem(hasShownKey, "true");
        }

        checkedWalletRef.current = normalizedAddress;
        hasCheckedRef.current = true;
      } catch (error) {
        console.error("Error checking referral requirement:", error);
        // In case of error, don't block the user
        setShowDialog(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkReferralRequirement();

    // Listen for custom event when referral is registered (same page)
    const handleReferralRegistered = () => {
      if (address) {
        setShowDialog(false);
        const hasShownKey = `${LOOMX_GUARD_SHOWN_KEY}_${address.toLowerCase()}`;
        localStorage.removeItem(hasShownKey);
        // Reset check so it re-evaluates
        if (checkedWalletRef.current === address.toLowerCase()) {
          hasCheckedRef.current = false;
        }
      }
    };

    // Listen for storage changes (when referral is registered on another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "alphabag_referral_links" && address) {
        // Re-check if referral is now registered
        const referralRegistered = isLoomxReferralRegistered();
        if (referralRegistered) {
          setShowDialog(false);
          const hasShownKey = `${LOOMX_GUARD_SHOWN_KEY}_${address.toLowerCase()}`;
          localStorage.removeItem(hasShownKey);
        }
      }
    };

    window.addEventListener("loomx-referral-registered", handleReferralRegistered);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("loomx-referral-registered", handleReferralRegistered);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [isConnected, address]);

  // Reset when wallet disconnects
  useEffect(() => {
    if (!isConnected || !address) {
      checkedWalletRef.current = null;
      hasCheckedRef.current = false;
      setShowDialog(false);
    }
  }, [address, isConnected]);

  // Re-check when page becomes visible (user might have registered referral on another tab/page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isConnected && address) {
        // Reset check so it re-evaluates
        if (checkedWalletRef.current === address.toLowerCase()) {
          hasCheckedRef.current = false;
          // Trigger a re-check by updating a dependency
          const referralRegistered = isLoomxReferralRegistered();
          if (referralRegistered) {
            setShowDialog(false);
            const hasShownKey = `${LOOMX_GUARD_SHOWN_KEY}_${address.toLowerCase()}`;
            localStorage.removeItem(hasShownKey);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isConnected, address]);

  // Prevent closing dialog by clicking outside or pressing ESC
  // Dialog can only be closed by clicking the registration button
  const handleOpenChange = () => {
    // Prevent closing - dialog is non-dismissible
    // User must register referral code to close
  };

  const handleRegisterReferralCode = async () => {
    if (!referralCodeInput || referralCodeInput.trim() === "") {
      toast.error("Please enter a referral code");
      return;
    }

    setIsRegisteringReferral(true);
    
    try {
      if (typeof window !== "undefined") {
        const REFERRER_KEY = "alphabag_referrer_code";
        const REFERRAL_LINKS_STORAGE_KEY = "alphabag_referral_links";
        
        // Store the AlphaBag referrer code
        localStorage.setItem(REFERRER_KEY, referralCodeInput.trim());
        
        // Mark referral code as registered
        setReferralCodeRegistered();
        
        // Also create a minimal Loomx referral link entry to satisfy validation
        // This ensures the validation check passes
        try {
          const stored = localStorage.getItem(REFERRAL_LINKS_STORAGE_KEY);
          let links: Array<{ id: string; name: string; logo: string; placeholder: string; link: string; saved: boolean }> = [];
          
          if (stored) {
            links = JSON.parse(stored);
          }
          
          // Check if Loomx link exists
          const loomxLink = links.find((link) => link.id === "loomx");
          if (!loomxLink || !loomxLink.link || loomxLink.link.trim() === "") {
            // Add or update Loomx link with a placeholder
            const loomxIndex = links.findIndex((link) => link.id === "loomx");
            if (loomxIndex >= 0) {
              links[loomxIndex] = {
                ...links[loomxIndex],
                link: "registered", // Placeholder to satisfy validation
                saved: true,
              };
            } else {
              links.push({
                id: "loomx",
                name: "LoomX",
                logo: "/loomx.png",
                placeholder: "https://www.loomx.io/?ref=...",
                link: "registered",
                saved: true,
              });
            }
            localStorage.setItem(REFERRAL_LINKS_STORAGE_KEY, JSON.stringify(links));
          }
        } catch (error) {
          console.error("Error updating referral links:", error);
        }
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent("loomx-referral-registered"));
        
        toast.success("Referral code registered successfully!");
        setShowDialog(false);
        setReferralCodeInput("");
        
        // Mark that we've shown the pop-up (already done, but ensure it's set)
        if (address) {
          const hasShownKey = `${LOOMX_GUARD_SHOWN_KEY}_${address.toLowerCase()}`;
          localStorage.removeItem(hasShownKey);
        }
      }
    } catch (error) {
      console.error("Error registering referral code:", error);
      toast.error("Failed to register referral code. Please try again.");
    } finally {
      setIsRegisteringReferral(false);
    }
  };

  // Don't render anything while checking or if dialog shouldn't show
  console.log("[LoomxReferralGuard] Render check - isChecking:", isChecking, "showDialog:", showDialog);
  if (isChecking) {
    return null;
  }
  
  // Show dialog if showDialog is true
  if (!showDialog) {
    return null;
  }

  return (
    <Dialog 
      open={showDialog} 
      onOpenChange={handleOpenChange}
    >
      <DialogContent 
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden" 
        onPointerDownOutside={(e) => e.preventDefault()} 
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <Shield className="w-12 h-12 text-red-500" />
            </div>
            <DialogTitle className="text-center text-2xl md:text-3xl font-bold text-red-500">
              Mandatory Referral Registration Required
            </DialogTitle>
          </div>
          <DialogDescription className="text-center text-base md:text-lg pt-2 space-y-4">
            <p className="font-semibold text-foreground">
              Please register your <span className="underline">AlphaBag</span> referral code to proceed with any investments.
            </p>
            <p className="text-muted-foreground">
              This is mandatory to ensure proper tracking of the referral hierarchy and sales attribution.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Enter your AlphaBag referral code
            </label>
            <Input
              type="text"
              placeholder="Enter your AlphaBag referral code..."
              value={referralCodeInput}
              onChange={(e) => setReferralCodeInput(e.target.value)}
              className="w-full"
              disabled={isRegisteringReferral}
            />
          </div>
          <Button
            variant="gold"
            className="w-full text-base py-6"
            onClick={handleRegisterReferralCode}
            disabled={isRegisteringReferral || !referralCodeInput.trim()}
          >
            {isRegisteringReferral ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              "REGISTER REFERRAL CODE"
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Once registered, you can continue with any investment transactions.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
