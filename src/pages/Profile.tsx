import { useAccount } from "wagmi";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Copy,
  Check,
  Share2,
  Network,
  TrendingUp,
  Wallet,
  User,
  RefreshCw,
  ExternalLink,
  Users,
  ArrowLeft,
  Edit2,
  Save,
  X,
  DollarSign,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckSquare,
  Square,
  PackageCheck,
} from "lucide-react";
import { generateReferralLink, getReferrerWallet, getOrCreateReferralCode } from "@/lib/referral";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInvestments } from "@/lib/userInvestments";
import { getActiveUserStakes } from "@/lib/userStakes";
import {
  PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import {
  useUSDTToken,
  useUSDTDecimals,
  useTokenBalance,
  useUserInvestment,
  useSeparateInvestment,
  useUserVolume,
} from "@/hooks/useInvestment";
import { formatUnits } from "viem";
import { updateNodeReferralCode } from "@/lib/userReferralCodes";
import { useProfileData } from "@/hooks/useProfileData";
import type { UserNode } from "@/hooks/useProfileData";
import type { USDTTransfer } from "@/lib/walletTransfers";
import type { InvestmentPlan } from "@/lib/plans";
import { getAllPlans } from "@/lib/plans";
import { getUserSelectedPlans, saveUserSelectedPlans, UserSelectedPlans } from "@/lib/userSelectedPlans";
import ReferralShare from "@/components/ReferralShare";

const EARNINGS_COLORS: Record<string, string> = {
  BBAG: "#f59e0b",
  SBAG: "#3b82f6",
  CBAG: "#10b981",
  Staking: "#8b5cf6",
};

// ──────────────────────────────────────────────────────────────────────────────
// Helper: wallet transfer sub-card (used for BBAG / SBAG / CBAG)
// ──────────────────────────────────────────────────────────────────────────────
interface WalletSubCardProps {
  label: string;
  address: string;
  totalInvestment: number;
  totalProfit: number;
  isLoading: boolean;
  transfers: USDTTransfer[];
  conversionRate?: number;
  tokenPrice?: number;
  usdtLabel: string;
}

const WalletSubCard = ({
  label,
  address,
  totalInvestment,
  totalProfit,
  isLoading,
  transfers,
  conversionRate,
  tokenPrice,
  usdtLabel,
}: WalletSubCardProps) => (
  <div className="border border-border/50 rounded-lg p-4">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-foreground">{label}</h3>
      <div className="text-right">
        <p className="text-sm text-muted-foreground">Total Investment</p>
        <p className="text-lg font-bold text-foreground">
          {totalInvestment.toFixed(2)} {usdtLabel}
        </p>
        {totalProfit !== 0 && (
          <>
            <p className="text-sm text-muted-foreground mt-1">Profit</p>
            <p
              className={`text-lg font-bold ${
                totalProfit >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {totalProfit >= 0 ? "+" : ""}
              {totalProfit.toFixed(2)} {usdtLabel}
            </p>
          </>
        )}
      </div>
    </div>

    <p className="text-xs text-muted-foreground font-mono break-all mb-2">
      {address || "No wallet address configured"}
    </p>

    {isLoading ? (
      <div className="text-center py-4">
        <RefreshCw className="w-6 h-6 mx-auto mb-2 text-muted-foreground opacity-50 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading transactions...</p>
      </div>
    ) : transfers.length > 0 ? (
      <div className="space-y-2 mt-4">
        <h4 className="text-sm font-semibold text-foreground mb-2">Transactions:</h4>
        {transfers.map((transfer, index) => {
          const amount = Number(transfer.amount);
          let profit = 0;
          if (conversionRate && tokenPrice) {
            profit = amount * conversionRate * tokenPrice;
          }
          return (
            <div
              key={`${transfer.transactionHash}-${index}`}
              className="flex items-center justify-between p-2 bg-background/50 rounded border border-border/30"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground">
                    {amount.toFixed(2)} {usdtLabel}
                  </p>
                  {profit > 0 && (
                    <p
                      className={`text-sm font-semibold ${
                        profit >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      Profit: {profit >= 0 ? "+" : ""}
                      {profit.toFixed(2)} {usdtLabel}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(transfer.timestamp).toLocaleString()}
                </p>
                <a
                  href={`https://bscscan.com/tx/${transfer.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-1 block truncate"
                >
                  Tx: {transfer.transactionHash.slice(0, 6)}...
                  {transfer.transactionHash.slice(-4)}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground py-2">No transactions found</p>
    )}
  </div>
);

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────
const Profile = () => {
  const { address, isConnected } = useAccount();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // ── Earnings state ──
  const [earningsInvestments, setEarningsInvestments] = useState<any[]>([]);
  const [earningsStakes, setEarningsStakes] = useState<any[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(false);

  const loadEarnings = useCallback(async () => {
    if (!address) return;
    setEarningsLoading(true);
    try {
      const [invData, stakeData] = await Promise.all([
        getUserInvestments(address),
        getActiveUserStakes(address),
      ]);
      setEarningsInvestments(invData);
      setEarningsStakes(stakeData);
    } catch (e) {
      console.error(e);
    } finally {
      setEarningsLoading(false);
    }
  }, [address]);

  useEffect(() => { loadEarnings(); }, [loadEarnings]);

  // ── UI-only state (referral info, clipboard, node edit) ──
  const [referralLink, setReferralLink] = useState<string>("");
  const [referralCode, setReferralCode] = useState<string>("");
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
  const [referrerWallet, setReferrerWallet] = useState<string | null>(null);

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // ── Contract reads ──
  const usdtToken = useUSDTToken();
  const decimals = useUSDTDecimals(usdtToken);
  const tokenBalance = useTokenBalance(usdtToken);
  const { investment: userInvestment, decimals: investmentDecimals } = useUserInvestment(address);
  const { volume: userVolume, decimals: volumeDecimals } = useUserVolume(address);
  const { investments: contractInvestments, isLoading: isLoadingContractInvestments } =
    useSeparateInvestment(address);

  // ── All Firebase / heavy data via custom hook ──
  const {
    userNodes,
    isLoadingNodes,
    nodeReferralCodes,
    investmentsByCategory: _investmentsByCategory,
    isLoadingInvestments,
    bbagWallet,
    sbagWallet,
    cbagWallet,
    targetPlan,
    refreshSBAG: _refreshSBAG,
  } = useProfileData(address, isConnected, contractInvestments, decimals);

  // ── Referral link / code (UI-only, fast) ──
  useEffect(() => {
    if (isConnected && address) {
      setReferralLink(generateReferralLink("https://alphabag.net", address));
      const code = getOrCreateReferralCode(address);
      setReferralCode(code ? `AB-REF-${code}` : "AB-REF-9X27K3");
      setReferrerWallet(getReferrerWallet());
    } else {
      setReferralLink("");
      setReferralCode("");
      setReferrerWallet(null);
    }
  }, [isConnected, address]);

  // Suppress unused-variable warnings while keeping the values available
  void referrerWallet;
  void _investmentsByCategory;

  // ── Community groups ──
  const communityGroups = [
    {
      id: "telegram-global",
      name: "Telegram Global",
      url: "https://t.me/alphabagdao",
      icon: "telegram",
    },
    {
      id: "kakaotalk",
      name: "KakaoTalk OpenChat",
      url: "https://open.kakao.com/",
      icon: "kakao",
    },
    {
      id: "telegram-korea",
      name: "Telegram Korea",
      url: "https://t.me/alphabagdao",
      icon: "telegram",
    },
  ];

  // ── Handlers ──
  const handleCopy = async (text: string, projectId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied((prev) => ({ ...prev, [projectId]: true }));
      toast.success(t.profile.copiedToClipboard);
      setTimeout(() => setCopied((prev) => ({ ...prev, [projectId]: false })), 2000);
    } catch {
      toast.error(t.profile.failedToCopy);
    }
  };

  const handleEditNodeCode = (nodeId: number) => {
    const key = nodeId.toString();
    setEditingNodeId(key);
    setEditingCode(nodeReferralCodes[key] || "");
  };

  const handleCancelEdit = () => {
    setEditingNodeId(null);
    setEditingCode("");
  };

  const handleSaveNodeCode = async (nodeId: number) => {
    if (!address || !editingCode.trim()) {
      toast.error("Please enter a valid referral code");
      return;
    }
    setIsSaving(true);
    try {
      await updateNodeReferralCode(address, nodeId, editingCode.trim());
      toast.success("Referral code updated successfully");
      setEditingNodeId(null);
      setEditingCode("");
    } catch (error) {
      console.error("Failed to update referral code:", error);
      toast.error("Failed to update referral code");
    } finally {
      setIsSaving(false);
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "gold":
        return "border-primary/50 text-primary";
      case "blue":
        return "border-blue-500/50 text-blue-400";
      case "green":
        return "border-green-500/50 text-green-400";
      case "orange":
        return "border-orange-500/50 text-orange-400";
      default:
        return "border-border text-foreground";
    }
  };

  const balanceFormatted = tokenBalance ? formatUnits(tokenBalance, decimals) : "0";

  // ── Earnings computed values ──
  const eTotalInvested = earningsInvestments.reduce((s, i) => s + (i.amount || 0), 0);
  const eTotalProfit   = earningsInvestments.reduce((s, i) => s + (i.profit || 0), 0);
  const eTotalTokenVal = earningsInvestments.reduce((s, i) => s + (i.tokenValueUSDT || 0), 0);
  const eStakingPrincipal = earningsStakes.reduce((s, st) => {
    try { return s + parseFloat(formatUnits(BigInt(st.principal), 18)); } catch { return s; }
  }, 0);
  const eStakingDaily = earningsStakes.reduce((s, st) => {
    try {
      const p = parseFloat(formatUnits(BigInt(st.principal), 18));
      return s + (p * st.dailyRateBps) / 10000;
    } catch { return s; }
  }, 0);
  const eCategoryMap: Record<string, number> = {};
  earningsInvestments.forEach((inv) => {
    const cat = inv.category || "BBAG";
    eCategoryMap[cat] = (eCategoryMap[cat] || 0) + (inv.amount || 0);
  });
  const ePieData = Object.entries(eCategoryMap).map(([name, value]) => ({ name, value }));

  // investedAt 안전 변환: Firestore Timestamp / number / string / Date 모두 처리
  const toSafeDate = (val: any): Date | null => {
    try {
      if (!val) return null;
      // Firestore Timestamp 객체 (seconds 필드 보유)
      if (typeof val === "object" && "seconds" in val) {
        return new Date(val.seconds * 1000);
      }
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const eMonthlyMap: Record<string, number> = {};
  earningsInvestments.forEach((inv) => {
    try {
      const d = toSafeDate(inv.investedAt);
      if (!d) return;
      const m = format(d, "yyyy-MM");
      eMonthlyMap[m] = (eMonthlyMap[m] || 0) + (inv.amount || 0);
    } catch { /* 날짜 변환 실패 시 해당 항목 무시 */ }
  });
  const eBarData = Object.entries(eMonthlyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, amount]) => {
      try {
        return { month: format(new Date(month), "MMM yy"), amount };
      } catch {
        return { month, amount };
      }
    });

  // ── Plan Selection State ──
  const [allPlans, setAllPlans] = useState<InvestmentPlan[]>([]);
  const [userSelection, setUserSelection] = useState<UserSelectedPlans | null>(null);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [isSavingSelection, setIsSavingSelection] = useState(false);
  const [planSelectionDirty, setPlanSelectionDirty] = useState(false);

  // Load all plans + user's current selection
  useEffect(() => {
    getAllPlans().then(setAllPlans).catch(console.error);
  }, []);

  useEffect(() => {
    if (!address) return;
    getUserSelectedPlans(address).then(sel => {
      if (sel) {
        setUserSelection(sel);
        setSelectedPlanIds(sel.planIds);
      }
    }).catch(console.error);
  }, [address]);

  // 자유 다중 선택 토글 — 개수 제한 없음
  const handlePlanToggle = useCallback((planId: string) => {
    setPlanSelectionDirty(true);
    setSelectedPlanIds(prev =>
      prev.includes(planId)
        ? prev.filter(id => id !== planId)
        : [...prev, planId]
    );
  }, []);

  // 터치/클릭 공용 핸들러 — touch-action: manipulation 으로 300ms 지연 없음
  const makeTouchHandlers = useCallback((planId: string) => ({
    onClick: () => handlePlanToggle(planId),
  }), [handlePlanToggle]);

  // 전체 선택 / 전체 해제
  const handleSelectAll = () => {
    setPlanSelectionDirty(true);
    setSelectedPlanIds(allPlans.map(p => p.id));
  };
  const handleClearAll = () => {
    setPlanSelectionDirty(true);
    setSelectedPlanIds([]);
  };

  const handleSaveSelection = async () => {
    if (!address) return;
    setIsSavingSelection(true);
    try {
      const saved = await saveUserSelectedPlans(address, "multi", selectedPlanIds);
      setUserSelection(saved);
      setPlanSelectionDirty(false);
      toast.success("투자상품 선택이 저장되었습니다!");
    } catch {
      toast.error("저장 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSavingSelection(false);
    }
  };

  // ── Not connected ──
  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-[88px] sm:pt-20 pb-12">
          <div className="container mx-auto px-4 text-center">
            <Card className="max-w-md mx-auto mt-12">
              <CardContent className="pt-6">
                <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-2">{t.profile.connectWallet}</h2>
                <p className="text-muted-foreground">{t.profile.connectWalletDescription}</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // ── Connected ──
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[88px] sm:pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-display font-bold text-foreground">Community</h1>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Back Home</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
          </div>

          {/* ── 투자상품 선택 섹션 ── */}
          <Card className="mb-8 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-primary" />
                내 투자상품 선택
              </CardTitle>
              <CardDescription>
                홍보하고 싶은 투자상품을 자유롭게 선택하세요. 선택한 상품만 메인 화면에 표시되며, 레퍼럴 링크도 해당 상품들로 연결됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* 선택 현황 헤더 */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  상품 선택
                  {selectedPlanIds.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                      {selectedPlanIds.length}개 선택됨
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    style={{ touchAction: "manipulation" }}
                    className="text-xs text-primary hover:underline active:underline"
                  >
                    전체 선택
                  </button>
                  <span className="text-muted-foreground text-xs">|</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    style={{ touchAction: "manipulation" }}
                    className="text-xs text-muted-foreground hover:underline active:underline"
                  >
                    전체 해제
                  </button>
                </div>
              </div>

              {/* Plan list — 제한 없는 다중 선택 */}
              {allPlans.length === 0 ? (
                <p className="text-sm text-muted-foreground">투자상품을 불러오는 중…</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allPlans.map((plan) => {
                    const isSelected = selectedPlanIds.includes(plan.id);
                    const posIdx = selectedPlanIds.indexOf(plan.id);
                    const planId = plan.id;
                    return (
                      <div
                        key={planId}
                        role="checkbox"
                        aria-checked={isSelected}
                        tabIndex={0}
                        {...makeTouchHandlers(planId)}
                        onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") handlePlanToggle(planId); }}
                        style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", cursor: "pointer", userSelect: "none" }}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all select-none ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        }`}
                      >
                        <span className="pointer-events-none flex-shrink-0">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5 text-muted-foreground" />
                          )}
                        </span>
                        {plan.logo && (
                          <img src={plan.logo} alt="" aria-hidden="true" className="w-8 h-8 object-contain flex-shrink-0 pointer-events-none" />
                        )}
                        <div className="flex-1 min-w-0 pointer-events-none">
                          <p className="text-sm font-semibold truncate">{plan.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{plan.label}</p>
                          {plan.dailyProfit && (
                            <p className="text-xs text-primary font-medium mt-0.5">{plan.dailyProfit}</p>
                          )}
                        </div>
                        {isSelected && (
                          <span className="text-xs font-bold text-primary/70 flex-shrink-0 bg-primary/10 px-1.5 py-0.5 rounded pointer-events-none">
                            #{posIdx + 1}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 선택된 상품 순서 미리보기 */}
              {selectedPlanIds.length > 0 && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">선택 순서 (레퍼럴 링크에 포함됨)</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlanIds.map((id, idx) => {
                      const plan = allPlans.find(p => p.id === id);
                      if (!plan) return null;
                      return (
                        <div key={id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background border border-border text-xs">
                          <span className="font-bold text-primary">#{idx + 1}</span>
                          {plan.logo && <img src={plan.logo} alt={plan.label} className="w-3.5 h-3.5 object-contain" />}
                          <span className="font-medium">{plan.name}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handlePlanToggle(id); }}
                            style={{ touchAction: "manipulation" }}
                            className="text-muted-foreground hover:text-red-500 active:text-red-500 ml-0.5 p-2 -m-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Save button */}
              <Button
                variant="gold"
                className="w-full"
                onClick={handleSaveSelection}
                disabled={isSavingSelection}
              >
                {isSavingSelection ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> 저장 중…</>
                ) : planSelectionDirty ? (
                  <><Save className="w-4 h-4 mr-2" /> 선택 저장하기</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" /> 저장됨</>
                )}
              </Button>

              {/* 저장 상태 안내 */}
              {userSelection && !planSelectionDirty && (
                <div className="text-xs text-muted-foreground text-center">
                  {userSelection.planIds.length > 0
                    ? `✅ ${userSelection.planIds.length}개 상품 저장됨 — 메인화면과 레퍼럴 링크에 반영`
                    : "아직 선택된 상품이 없습니다. 상품을 선택하고 저장하세요."}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 레퍼럴 공유 섹션 (선택된 상품 포함) ── */}
          <ReferralShare />

          {/* Referral Link Section */}
          <Card className="mb-8 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                My Referral Link
              </CardTitle>
              <CardDescription>Share your referral link to invite others</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Referral Link */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Referral Link</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-background/50 rounded-lg border border-border/50 font-mono text-sm break-all">
                      {referralLink || "Loading..."}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(referralLink, "referral-link")}
                      disabled={!referralLink}
                      className="shrink-0 h-10 w-10"
                    >
                      {copied["referral-link"] ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Referral Code */}
                {referralCode && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Referral Code</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-background/50 rounded-lg border border-border/50 font-mono text-sm">
                        {referralCode}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(referralCode, "referral-code")}
                        className="shrink-0 h-10 w-10"
                      >
                        {copied["referral-code"] ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Community Groups */}
          <Card className="mb-8 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Community Groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {communityGroups.map((group) => (
                  <div
                    key={group.id}
                    className="card-metallic rounded-xl p-3 sm:p-4 border-2 border-border/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">
                          {group.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground break-all">
                          {group.url}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => window.open(group.url, "_blank", "noopener,noreferrer")}
                      className="text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-8 shrink-0 w-full sm:w-auto"
                    >
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* My Nodes Section */}
          <Card className="mb-8 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-primary" />
                    {t.profile.myNodes}
                  </CardTitle>
                  <CardDescription>{t.profile.myNodesDescription}</CardDescription>
                </div>
                {/* Refresh button — delegates to hook's internal reload via page reload */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.location.reload()}
                  disabled={isLoadingNodes || !address}
                  className="shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                >
                  <RefreshCw
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoadingNodes ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingNodes ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50 animate-spin" />
                  <p className="text-muted-foreground">Loading nodes...</p>
                </div>
              ) : userNodes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userNodes.map((node: UserNode) => {
                    const colors = getColorClasses(node.color);
                    return (
                      <div
                        key={node.id}
                        className={`card-metallic rounded-xl p-4 border-2 ${colors} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-display font-bold text-lg">{node.name}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              node.status === "Active"
                                ? "bg-green-500/20 text-green-400"
                                : node.status === "Pending"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {node.status}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.profile.price}</span>
                            <span className="font-semibold">
                              {node.price.toLocaleString()} {t.common.usdt}
                            </span>
                          </div>
                          {node.nodeId !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t.profile.nodeId}</span>
                              <span className="font-semibold">{node.nodeId}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Purchase Date</span>
                            <span className="font-semibold text-xs">
                              {new Date(node.purchaseDate).toLocaleDateString()}
                            </span>
                          </div>
                          {node.transactionHash && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground text-xs">Tx Hash</span>
                              <a
                                href={`https://bscscan.com/tx/${node.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-xs text-primary hover:underline truncate max-w-[120px]"
                                title={node.transactionHash}
                              >
                                {node.transactionHash.slice(0, 6)}...
                                {node.transactionHash.slice(-4)}
                              </a>
                            </div>
                          )}
                          {node.nodeId !== undefined &&
                            nodeReferralCodes[node.nodeId.toString()] && (
                              <div className="flex justify-between items-center pt-2 border-t border-border/50">
                                <span className="text-muted-foreground text-xs">Referral Code</span>
                                <div className="flex items-center gap-2">
                                  {editingNodeId === node.nodeId.toString() ? (
                                    <>
                                      <Input
                                        value={editingCode}
                                        onChange={(e) => setEditingCode(e.target.value)}
                                        className="h-6 text-xs font-mono w-24 sm:w-32"
                                        placeholder="Enter code"
                                        disabled={isSaving}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 sm:h-6 sm:w-6"
                                        onClick={() => handleSaveNodeCode(node.nodeId!)}
                                        disabled={isSaving}
                                      >
                                        {isSaving ? (
                                          <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                                        ) : (
                                          <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 sm:h-6 sm:w-6"
                                        onClick={handleCancelEdit}
                                        disabled={isSaving}
                                      >
                                        <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-mono text-xs text-primary">
                                        {nodeReferralCodes[node.nodeId.toString()]}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 sm:h-6 sm:w-6"
                                        onClick={() => handleEditNodeCode(node.nodeId!)}
                                      >
                                        <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 sm:h-6 sm:w-6"
                                        onClick={() =>
                                          handleCopy(
                                            nodeReferralCodes[node.nodeId!.toString()],
                                            `node-${node.nodeId}`
                                          )
                                        }
                                      >
                                        {copied[`node-${node.nodeId}`] ? (
                                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500" />
                                        ) : (
                                          <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        )}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Network className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {t.profile.noNodesYet || "You haven't purchased any nodes yet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Node Referral Codes Section */}
          {userNodes.length > 0 && Object.keys(nodeReferralCodes).length > 0 && (
            <Card className="mb-8 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  Node Referral Codes
                </CardTitle>
                <CardDescription>Your referral codes for purchased nodes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userNodes
                    .filter(
                      (node) =>
                        node.nodeId !== undefined && nodeReferralCodes[node.nodeId.toString()]
                    )
                    .map((node) => (
                      <div
                        key={node.id}
                        className="card-metallic rounded-xl p-4 border-2 border-border/50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ${getColorClasses(node.color)}`}
                          >
                            <Network className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground mb-1">{node.name}</h4>
                            {editingNodeId === node.nodeId!.toString() ? (
                              <Input
                                value={editingCode}
                                onChange={(e) => setEditingCode(e.target.value)}
                                className="h-7 text-sm font-mono mt-1"
                                placeholder="Enter code"
                                disabled={isSaving}
                              />
                            ) : (
                              <p className="text-sm font-mono text-muted-foreground">
                                {nodeReferralCodes[node.nodeId!.toString()]}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {editingNodeId === node.nodeId!.toString() ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSaveNodeCode(node.nodeId!)}
                                disabled={isSaving}
                                className="shrink-0 h-7 w-7 sm:h-8 sm:w-8"
                              >
                                {isSaving ? (
                                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                                ) : (
                                  <Save className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className="shrink-0 h-7 w-7 sm:h-8 sm:w-8"
                              >
                                <X className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditNodeCode(node.nodeId!)}
                                className="shrink-0 h-7 w-7 sm:h-8 sm:w-8"
                              >
                                <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleCopy(
                                    nodeReferralCodes[node.nodeId!.toString()],
                                    `node-ref-${node.nodeId}`
                                  )
                                }
                                className="shrink-0 h-7 w-7 sm:h-8 sm:w-8"
                              >
                                {copied[`node-ref-${node.nodeId}`] ? (
                                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Total Investment Summary */}
          <Card className="mb-8 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    {t.profile.myTotalInvestment}
                  </CardTitle>
                  <CardDescription>
                    {t.profile.myTotalInvestmentDescription} (Contract + Firebase)
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.location.reload()}
                  disabled={isLoadingInvestments || isLoadingContractInvestments || !address}
                  className="shrink-0"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      isLoadingInvestments || isLoadingContractInvestments ? "animate-spin" : ""
                    }`}
                  />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {userVolume
                    ? formatUnits(userVolume, volumeDecimals || 18)
                    : userInvestment
                    ? formatUnits(userInvestment, investmentDecimals)
                    : "0"}{" "}
                  {t.common.usdt}
                </div>
                <p className="text-muted-foreground mb-2">{t.profile.totalInvestedAmount}</p>
                {userVolume && (
                  <p className="text-xs text-muted-foreground mb-6">
                    From contract: {formatUnits(userVolume, volumeDecimals || 18)} {t.common.usdt}{" "}
                    (investSplit)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Wallets Section — BBAG / SBAG / CBAG */}
          {targetPlan && (
            <Card className="mb-8 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Wallets — {(targetPlan as InvestmentPlan).name}
                </CardTitle>
                <CardDescription>
                  Transactions and profits for BBAG, SBAG, and CBAG wallets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <WalletSubCard
                    label="BBAG Wallet"
                    address={bbagWallet.address}
                    totalInvestment={bbagWallet.totalInvestment}
                    totalProfit={bbagWallet.totalProfit}
                    isLoading={bbagWallet.isLoading}
                    transfers={bbagWallet.transfers}
                    conversionRate={(targetPlan as InvestmentPlan).wallet1TokenConversionRate}
                    tokenPrice={(targetPlan as InvestmentPlan).wallet1TokenPrice}
                    usdtLabel={t.common.usdt}
                  />
                  <WalletSubCard
                    label="SBAG NUMI"
                    address={sbagWallet.address}
                    totalInvestment={sbagWallet.totalInvestment}
                    totalProfit={sbagWallet.totalProfit}
                    isLoading={sbagWallet.isLoading}
                    transfers={sbagWallet.transfers}
                    conversionRate={(targetPlan as InvestmentPlan).wallet2TokenConversionRate}
                    tokenPrice={(targetPlan as InvestmentPlan).wallet2TokenPrice}
                    usdtLabel={t.common.usdt}
                  />
                  <WalletSubCard
                    label="CBAG Wallet"
                    address={cbagWallet.address}
                    totalInvestment={cbagWallet.totalInvestment}
                    totalProfit={cbagWallet.totalProfit}
                    isLoading={cbagWallet.isLoading}
                    transfers={cbagWallet.transfers}
                    usdtLabel={t.common.usdt}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wallet Balance */}
          <Card className="mb-8 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                {t.profile.walletBalance}
              </CardTitle>
              <CardDescription>{t.profile.walletBalanceDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {balanceFormatted} {t.common.usdt}
                </div>
                <p className="text-muted-foreground">{t.profile.availableForInvestment}</p>
              </div>
            </CardContent>
          </Card>

          {/* ── EARNINGS SECTION ── */}
          <Card className="mb-8 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    My Earnings
                  </CardTitle>
                  <CardDescription>Investment performance &amp; portfolio overview</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadEarnings} disabled={earningsLoading} className="gap-2">
                  <RefreshCw className={`w-4 h-4 ${earningsLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Invested",   value: `$${eTotalInvested.toLocaleString(undefined,{maximumFractionDigits:2})}`,  sub: "USDT",                                              icon: DollarSign, color: "border-l-primary" },
                  { label: "Total Token Value", value: `$${eTotalTokenVal.toLocaleString(undefined,{maximumFractionDigits:2})}`,  sub: "Current value",                                    icon: BarChart3,   color: "border-l-blue-500" },
                  { label: "Unrealized P/L",    value: `${eTotalProfit>=0?"+":""}$${eTotalProfit.toLocaleString(undefined,{maximumFractionDigits:2})}`, sub: eTotalInvested?`${((eTotalProfit/eTotalInvested)*100).toFixed(1)}%`:"0%", icon: TrendingUp, color: eTotalProfit>=0?"border-l-green-500":"border-l-red-500" },
                  { label: "Staking Daily",     value: `+$${eStakingDaily.toFixed(2)}`,                                            sub: `Principal: $${eStakingPrincipal.toFixed(2)}`,     icon: Wallet,      color: "border-l-purple-500" },
                ].map((kpi) => (
                  <Card key={kpi.label} className={`border-l-4 ${kpi.color}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                      <kpi.icon className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      {earningsLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">{kpi.value}</div>}
                      <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Pie */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <PieChart className="w-4 h-4 text-primary" /> Portfolio Allocation
                    </CardTitle>
                    <CardDescription>Investment by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {earningsLoading ? (
                      <Skeleton className="h-60 w-full" />
                    ) : ePieData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-60 text-muted-foreground gap-2">
                        <AlertCircle className="w-8 h-8" />
                        <p className="text-sm">No investment data</p>
                      </div>
                    ) : (
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie data={ePieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                              {ePieData.map((entry) => (
                                <Cell key={entry.name} fill={EARNINGS_COLORS[entry.name] || "#6b7280"} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Amount"]} />
                            <Legend />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="w-4 h-4 text-primary" /> Monthly Investment
                    </CardTitle>
                    <CardDescription>Last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {earningsLoading ? (
                      <Skeleton className="h-60 w-full" />
                    ) : eBarData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-60 text-muted-foreground gap-2">
                        <AlertCircle className="w-8 h-8" />
                        <p className="text-sm">No investment data</p>
                      </div>
                    ) : (
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={eBarData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                            <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Invested"]} />
                            <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Investment List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Investment Details</CardTitle>
                  <CardDescription>{earningsInvestments.length} total investments</CardDescription>
                </CardHeader>
                <CardContent>
                  {earningsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                    </div>
                  ) : earningsInvestments.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-muted-foreground gap-2">
                      <AlertCircle className="w-8 h-8" />
                      <p className="text-sm">No investments found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {earningsInvestments.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs font-mono">{inv.category}</Badge>
                            <div>
                              <p className="text-sm font-medium">{inv.projectName}</p>
                              <p className="text-xs text-muted-foreground">{(() => { try { const d = toSafeDate(inv.investedAt); return d ? format(d, "yyyy-MM-dd") : "-"; } catch { return "-"; } })()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">${(inv.amount||0).toLocaleString(undefined,{maximumFractionDigits:2})}</p>
                            {inv.profit !== undefined && (
                              <p className={`text-xs font-medium ${inv.profit>=0?"text-green-500":"text-red-500"}`}>
                                {inv.profit>=0?"+":""}{inv.profit.toFixed(2)} P/L
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
