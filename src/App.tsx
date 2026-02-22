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
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Investment from "./pages/Investment";
import Staking from "./pages/Staking";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import Introduction from "./pages/Introduction";
import Tutorial from "./pages/Tutorial";
import Support from "./pages/Support";
import CompanyRegistration from "./pages/CompanyRegistration";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAddPlans from "./pages/admin/AdminAddPlans";
import AdminStakingPlans from "./pages/admin/AdminStakingPlans";
import AdminNodes from "./pages/admin/AdminNodes";
import AdminNotices from "./pages/admin/AdminNotices";
import AdminAds from "./pages/admin/AdminAds";
import AdminReferred from "./pages/admin/AdminReferred";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminTotalEarning from "./pages/admin/AdminTotalEarning";
import AdminOrganization from "./pages/admin/AdminOrganization";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminCompanyApplications from "./pages/admin/AdminCompanyApplications";
import AdminRouteGuard from "./pages/admin/AdminRouteGuard";
import InvestmentHistory from "./pages/InvestmentHistory";
import Promo from "./pages/Promo";
import PromoDetail from "./pages/PromoDetail";
import { StakingMaturityChecker } from "@/components/StakingMaturityChecker";
import BottomNav from "@/components/BottomNav";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import AdminEventBanners from "./pages/admin/AdminEventBanners";

// QueryClient를 모듈 스코프에서 생성하여 HMR 시에도 인스턴스 유지
// staleTime 설정으로 불필요한 중복 요청 방지
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1분간 캐시 유효
      retry: 2,             // 실패 시 최대 2회 재시도
    },
  },
});

const App = () => (
  <ErrorBoundary>
  {/* BrowserRouter를 최상위로 이동 → 하위 컴포넌트(TermsAgreement, ReferralTracker 등)에서
      useNavigate, useLocation 등 router hooks 안전하게 사용 가능 */}
  <BrowserRouter>
    <LanguageProvider>
      <WalletProvider>
        <CartProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              {/* 라우터 컨텍스트 안에서 렌더링 → useNavigate 등 사용 가능 */}
              <TermsAgreement />
              <UserNoticePopup />
              <ReferralTracker />
              <LoomxReferralGuard />
              <StakingMaturityChecker />
              <OnboardingGuide />
              <Toaster />
              <Sonner />
              <Routes>
                {/* Admin routes */}
                <Route path="/admin" element={<AdminLogin />} />
                <Route element={<AdminRouteGuard />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="add-plans" element={<AdminAddPlans />} />
                    <Route path="staking-plans" element={<AdminStakingPlans />} />
                    <Route path="nodes" element={<AdminNodes />} />
                    <Route path="notices" element={<AdminNotices />} />
                    <Route path="ads" element={<AdminAds />} />
                    <Route path="referred" element={<AdminReferred />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="organization" element={<AdminOrganization />} />
                    <Route path="support" element={<AdminSupport />} />
                    <Route path="total-earning" element={<AdminTotalEarning />} />
                    <Route path="announcements" element={<AdminAnnouncements />} />
                    <Route path="event-banners" element={<AdminEventBanners />} />
                    <Route path="company-applications" element={<AdminCompanyApplications />} />
                  </Route>
                </Route>

                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/investment" element={<Investment />} />
                <Route path="/staking" element={<Staking />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/history" element={<InvestmentHistory />} />
                <Route path="/community" element={<Profile />} />
                <Route path="/introduction" element={<Introduction />} />
                <Route path="/tutorial" element={<Tutorial />} />
                <Route path="/support" element={<Support />} />
                <Route path="/company-registration" element={<CompanyRegistration />} />
                {/* 홍보 페이지 */}
                <Route path="/promo" element={<Promo />} />
                <Route path="/promo/:planId" element={<PromoDetail />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Footer />
              {/* 모바일 하단 탭바 — md 이상에서 자동 숨김 */}
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

