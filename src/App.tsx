import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/components/WalletProvider";
import { ReferralTracker } from "@/components/ReferralTracker";
import { LoomxReferralGuard } from "@/components/LoomxReferralGuard";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { TermsAgreement } from "@/components/TermsAgreement";
import { UserNoticePopup } from "@/components/UserNoticePopup";
import { CartProvider } from "@/contexts/CartContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { StakingMaturityChecker } from "@/components/StakingMaturityChecker";
import { OnboardingGuide } from "@/components/OnboardingGuide";

// ── Always-eager (small, critical path) ─────────────────────────────────────
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminRouteGuard from "./pages/admin/AdminRouteGuard";

// ── Lazy-loaded pages (chunked by route) ─────────────────────────────────────
const Investment          = lazy(() => import("./pages/Investment"));
const Staking             = lazy(() => import("./pages/Staking"));
const Profile             = lazy(() => import("./pages/Profile"));
const Cart                = lazy(() => import("./pages/Cart"));
const Introduction        = lazy(() => import("./pages/Introduction"));
const Tutorial            = lazy(() => import("./pages/Tutorial"));
const Support             = lazy(() => import("./pages/Support"));
const CompanyRegistration = lazy(() => import("./pages/CompanyRegistration"));
const InvestmentHistory   = lazy(() => import("./pages/InvestmentHistory"));
const Promo               = lazy(() => import("./pages/Promo"));
const PromoDetail         = lazy(() => import("./pages/PromoDetail"));
const Notices             = lazy(() => import("./pages/Notices"));
const NoticeDetail        = lazy(() => import("./pages/NoticeDetail"));
const Community           = lazy(() => import("./pages/Community"));
const Earnings            = lazy(() => import("./pages/Earnings"));

// Admin pages — separate chunk
const AdminLogin    = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout   = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard      = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPlans          = lazy(() => import("./pages/admin/AdminPlans"));
const AdminContent        = lazy(() => import("./pages/admin/AdminContent"));
const AdminUsersOrg       = lazy(() => import("./pages/admin/AdminUsersOrg"));
const AdminAssets         = lazy(() => import("./pages/admin/AdminAssets"));
const AdminSupport        = lazy(() => import("./pages/admin/AdminSupport"));
const AdminNotifications  = lazy(() => import("./pages/admin/AdminNotifications"));

// ── Loading fallback ──────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// ── QueryClient ───────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1분간 캐시 유효
      retry: 2,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <LanguageProvider>
        <WalletProvider>
          <CartProvider>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <TermsAgreement />
                <UserNoticePopup />
                <ReferralTracker />
                <LoomxReferralGuard />
                <StakingMaturityChecker />
                <OnboardingGuide />
                <Toaster />
                <Sonner />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Admin routes */}
                    <Route path="/admin" element={<AdminLogin />} />
                    <Route element={<AdminRouteGuard />}>
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route path="dashboard"   element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
                        <Route path="plans"       element={<ErrorBoundary><AdminPlans /></ErrorBoundary>} />
                        <Route path="content"     element={<ErrorBoundary><AdminContent /></ErrorBoundary>} />
                        <Route path="users-org"   element={<ErrorBoundary><AdminUsersOrg /></ErrorBoundary>} />
                        <Route path="assets"      element={<ErrorBoundary><AdminAssets /></ErrorBoundary>} />
                        <Route path="support"         element={<ErrorBoundary><AdminSupport /></ErrorBoundary>} />
                        <Route path="notifications"   element={<ErrorBoundary><AdminNotifications /></ErrorBoundary>} />
                        {/* 구 URL 하위호환 */}
                        <Route path="add-plans"           element={<AdminPlans />} />
                        <Route path="staking-plans"       element={<AdminPlans />} />
                        <Route path="nodes"               element={<AdminAssets />} />
                        <Route path="notices"             element={<AdminContent />} />
                        <Route path="ads"                 element={<AdminContent />} />
                        <Route path="announcements"       element={<AdminContent />} />
                        <Route path="event-banners"       element={<AdminContent />} />
                        <Route path="referred"            element={<AdminUsersOrg />} />
                        <Route path="users"               element={<AdminUsersOrg />} />
                        <Route path="organization"        element={<AdminUsersOrg />} />
                        <Route path="total-earning"       element={<AdminAssets />} />
                        <Route path="company-applications" element={<AdminUsersOrg />} />
                      </Route>
                    </Route>

                    {/* Public routes — each wrapped in its own ErrorBoundary */}
                    <Route path="/"     element={<Index />} />
                    <Route path="/cart" element={<ErrorBoundary><Cart /></ErrorBoundary>} />
                    <Route path="/investment" element={<ErrorBoundary><Investment /></ErrorBoundary>} />
                    <Route path="/staking"    element={<ErrorBoundary><Staking /></ErrorBoundary>} />
                    <Route path="/profile"    element={<ErrorBoundary inline><Profile /></ErrorBoundary>} />
                    <Route path="/history"    element={<ErrorBoundary><InvestmentHistory /></ErrorBoundary>} />
                    <Route path="/earnings"   element={<ErrorBoundary><Earnings /></ErrorBoundary>} />
                    <Route path="/community"  element={<ErrorBoundary><Community /></ErrorBoundary>} />
                    <Route path="/introduction" element={<ErrorBoundary><Introduction /></ErrorBoundary>} />
                    <Route path="/tutorial"     element={<ErrorBoundary><Tutorial /></ErrorBoundary>} />
                    <Route path="/support"      element={<ErrorBoundary><Support /></ErrorBoundary>} />
                    <Route path="/company-registration" element={<ErrorBoundary><CompanyRegistration /></ErrorBoundary>} />
                    <Route path="/promo"        element={<ErrorBoundary><Promo /></ErrorBoundary>} />
                    <Route path="/promo/:planId" element={<ErrorBoundary><PromoDetail /></ErrorBoundary>} />
                    <Route path="/notices"       element={<ErrorBoundary><Notices /></ErrorBoundary>} />
                    <Route path="/notices/:id"   element={<ErrorBoundary><NoticeDetail /></ErrorBoundary>} />
                    <Route path="*"              element={<NotFound />} />
                  </Routes>
                </Suspense>
                <Footer />
                <BottomNav />
              </TooltipProvider>
            </QueryClientProvider>
          </CartProvider>
        </WalletProvider>
      </LanguageProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
