import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPlanById } from "@/lib/plans";
import { useCart } from "@/contexts/CartContext";
import { getUserInvestments } from "@/lib/userInvestments";

const Investment = () => {
  const { isConnected, address } = useAccount();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const { items } = useCart();
  const [dappUrl, setDappUrl] = useState("http://maxfi.io/");
  const [planName, setPlanName] = useState("");
  const [copied, setCopied] = useState(false);
  const [successPopupOpen, setSuccessPopupOpen] = useState(false);
  const [loading, setLoading] = useState(true); // 플랜 정보 로딩 상태 (UI 로딩 스피너에 활용)

  // Get plan information from URL params, recent investment, or cart
  useEffect(() => {
    const loadPlanInfo = async () => {
      try {
        const planId = searchParams.get("planId");
        let plan = null;

        // Priority 1: Get plan from URL param (from cart navigation)
        if (planId) {
          plan = await getPlanById(planId);
        }

        // Priority 2: Get plan from most recent investment
        if (!plan && address && isConnected) {
          try {
            const investments = await getUserInvestments(address);
            if (investments.length > 0) {
              // Get the most recent investment
              const mostRecentInvestment = investments[0];
              if (mostRecentInvestment.projectId) {
                plan = await getPlanById(mostRecentInvestment.projectId);
              }
            }
          } catch (error) {
            console.error("Error loading user investments:", error);
          }
        }

        // Priority 3: Get plan from cart
        if (!plan && items.length > 0) {
          if (planId) {
            plan = items.find(item => item.plan.id === planId)?.plan || null;
          } else {
            // Use first item in cart if no planId specified
            plan = items[0].plan;
          }
        }

        if (plan) {
          setDappUrl(plan.dappUrl || "http://maxfi.io/");
          setPlanName(plan.name || "");
        } else {
          // Default to maxfi if no plan found
          setDappUrl("http://maxfi.io/");
          setPlanName("");
        }
      } catch (error) {
        console.error("Error loading plan info:", error);
        setDappUrl("http://maxfi.io/");
        setPlanName("");
      } finally {
        setLoading(false);
      }
    };

    if (isConnected) {
      loadPlanInfo();
    } else {
      setLoading(false);
    }
  }, [searchParams, items, address, isConnected]);

  const handleCopy = async () => {
    const urlToCopy = dappUrl || t.investment.dappUrlPlaceholder;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      toast.success(t.investment.urlCopied);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(t.investment.copyFailed);
    }
  };

  const handleOpenDApp = () => {
    if (dappUrl && dappUrl !== t.investment.dappUrlPlaceholder && dappUrl.startsWith('http')) {
      window.open(dappUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error(t.investment.invalidUrl);
    }
  };

  if (!isConnected) {
    navigate("/");
    return null;
  }

  // 플랜 정보 로딩 중 스켈레톤 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 sm:pt-20 pb-12">
          <div className="container mx-auto px-4">
            <div className="animate-pulse space-y-4 mt-8">
              <div className="h-8 bg-secondary rounded w-1/3" />
              <div className="h-48 bg-secondary rounded" />
              <div className="h-48 bg-secondary rounded" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 sm:pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-foreground">
              AlphaBag • {t.investment.title}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Investment Status */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl font-display">
                    {t.investment.investmentStatus}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t.investment.successPopup}
                  </p>
                </CardContent>
              </Card>

              {/* Remaining 40% Manual Investment */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-2xl font-display">
                    {t.investment.remaining40Manual}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">
                    {t.investment.remaining40Description}
                  </p>

                  {/* Project DApp URL */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      {planName ? `${planName} - ${t.investment.projectDAppUrl}` : t.investment.projectDAppUrl}
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Input
                        value={dappUrl || t.investment.dappUrlPlaceholder}
                        onChange={(e) => setDappUrl(e.target.value)}
                        className="font-mono text-sm flex-1"
                        placeholder={t.investment.dappUrlPlaceholder}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleCopy}
                          className="shrink-0"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="gold"
                          onClick={handleOpenDApp}
                          className="shrink-0 gap-2 text-xs sm:text-sm"
                        >
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">{t.investment.openDApp}</span>
                          <span className="sm:hidden">Open</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Remaining 40% Funds Reference */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      {t.investment.remaining40Funds}
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {t.investment.remaining40FundsDesc}
                    </p>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-purple-200">
                        {t.investment.disclaimer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Integration Status Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-border/50 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-xl font-display">
                    {t.investment.integrationStatus}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {planName 
                        ? `Integrating with ${planName} (${t.investment.notYetConnected})`
                        : `${t.investment.integratingWithBBAG} (${t.investment.notYetConnected})`
                      }
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      {t.investment.currentStep}
                    </label>
                    <p className="text-sm text-foreground">
                      {t.investment.currentStepDesc}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      {t.investment.support}
                    </label>
                    <p className="text-sm text-foreground">
                      {t.investment.supportDesc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Success Popup Dialog */}
      <Dialog open={successPopupOpen} onOpenChange={setSuccessPopupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-display text-green-500">
              {t.investment.investmentSuccessful}
            </DialogTitle>
            <DialogDescription>
              {t.investment.investmentCompleted}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-muted-foreground">
              {t.investment.successPopup}
            </p>
            <div className="bg-secondary/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">
                {planName ? `${planName} - ${t.investment.remaining40Manual}` : t.investment.remaining40Manual}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {t.investment.remaining40Description}
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={dappUrl || t.investment.dappUrlPlaceholder}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="gold"
                  onClick={handleOpenDApp}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t.investment.openDApp}
                </Button>
              </div>
            </div>
            <Button
              variant="gold"
              className="w-full"
              onClick={() => setSuccessPopupOpen(false)}
            >
              {t.investment.gotIt}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Investment;

