import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getReferralCodeFromURL, storeReferralFromURL, setReferralCodeRegistered, isReferralCodeRegistered, getOrCreateReferralCode } from "@/lib/referral";
import { useAccount } from "wagmi";
import { saveUser, getAllUsers } from "@/lib/users";
import { saveReferral } from "@/lib/referrals";

const Onboarding = () => {
  const [referralCode, setReferralCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();

  // Check if already registered on mount
  useEffect(() => {
    const checkRegistration = () => {
      // First, check if there's a referral code in URL
      const urlCode = getReferralCodeFromURL();
      if (urlCode) {
        // Auto-store from URL if wallet is connected
        if (isConnected && address) {
          const stored = storeReferralFromURL(address);
          if (stored) {
            // storeReferralFromURL already calls setReferralCodeRegistered()
            navigate("/", { replace: true });
            return;
          }
        } else {
          // Store URL code for later when wallet connects
          setReferralCode(urlCode);
        }
      }

      // Check if already registered
      if (isReferralCodeRegistered()) {
        navigate("/", { replace: true });
        return;
      }

      setIsChecking(false);
    };

    checkRegistration();
  }, [navigate, isConnected, address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate referral code format if provided (6 digits)
    if (referralCode.trim() && !/^\d{6}$/.test(referralCode.trim())) {
      setError("Referral code must be 6 digits");
      return;
    }

    setIsLoading(true);

    try {
      // If referral code is provided, store it
      if (referralCode.trim()) {
        const REFERRER_KEY = "alphabag_referrer_code";
        localStorage.setItem(REFERRER_KEY, referralCode.trim());
      }
      
      // Mark as registered (even without referral code)
      setReferralCodeRegistered();
      
      // Save to Firebase if wallet is connected
      if (isConnected && address) {
        try {
          const userReferralCode = getOrCreateReferralCode(address);
          
          // Find referrer wallet by referral code if provided
          let referrerWallet: string | null = null;
          if (referralCode.trim()) {
            const allUsers = await getAllUsers();
            const referrer = allUsers.find(u => u.referralCode === referralCode.trim());
            if (referrer) {
              referrerWallet = referrer.walletAddress;
            }
          }
          
          // Save user to Firebase
          await saveUser(address, {
            referralCode: userReferralCode,
            referrerCode: referralCode.trim() || null,
            referrerWallet: referrerWallet,
            isRegistered: true,
          });
          
          // Save referral relationship if referrer found
          if (referrerWallet && referralCode.trim()) {
            await saveReferral(referrerWallet, address, referralCode.trim());
          }
        } catch (firebaseError) {
          console.error("Error saving to Firebase:", firebaseError);
          // Continue even if Firebase save fails
        }
      }
      
      toast.success(referralCode.trim() ? "Registration successful!" : "Welcome! You can proceed without a referral code.");
      
      // Redirect to home page
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 500);
    } catch (err) {
      setError("Failed to complete registration. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking registration status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-metallic">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">Welcome to AlphaBag</CardTitle>
          <CardDescription className="text-base mt-2">
            To get started, you can optionally enter a referral code. You can proceed without one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="referralCode">Referral Code (Optional)</Label>
              <Input
                id="referralCode"
                type="text"
                placeholder="Enter 6-digit referral code (optional)"
                value={referralCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setReferralCode(value);
                  setError("");
                }}
                maxLength={6}
                className="text-center text-lg font-mono tracking-widest"
                disabled={isLoading}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit referral code if you have one (optional)
              </p>
            </div>

            <Button
              type="submit"
              variant="gold"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                "Continue"
              )}
            </Button>

            {!isConnected && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  You can connect your wallet after registration to access all features.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;

