import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isReferralCodeRegistered } from "@/lib/referral";
import { Loader2 } from "lucide-react";

/**
 * Route guard that ensures users have registered a referral code
 * before accessing protected routes
 */
const ReferralCodeGuard = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check registration status
    const registered = isReferralCodeRegistered();
    setIsRegistered(registered);
    setIsChecking(false);
  }, [location.pathname]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    // Redirect to onboarding if not registered
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }

  // User is registered, allow access
  return <Outlet />;
};

export default ReferralCodeGuard;

