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
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Investment from "./pages/Investment";
import Staking from "./pages/Staking";
import Profile from "./pages/Profile";
import Community from "./pages/Community";
import Cart from "./pages/Cart";
import Introduction from "./pages/Introduction";
import Tutorial from "./pages/Tutorial";
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
import AdminTotalEarning from "./pages/admin/AdminTotalEarning";
import AdminOrganization from "./pages/admin/AdminOrganization";
import AdminRouteGuard from "./pages/admin/AdminRouteGuard";

const queryClient = new QueryClient();

const App = () => (
  <LanguageProvider>
    <WalletProvider>
      <CartProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <TermsAgreement />
            <ReferralTracker />
            <LoomxReferralGuard />
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
                  <Route path="total-earning" element={<AdminTotalEarning />} />
                </Route>
              </Route>

              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/investment" element={<Investment />} />
              <Route path="/staking" element={<Staking />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/community" element={<Community />} />
              <Route path="/introduction" element={<Introduction />} />
              <Route path="/tutorial" element={<Tutorial />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </CartProvider>
    </WalletProvider>
  </LanguageProvider>
);

export default App;
