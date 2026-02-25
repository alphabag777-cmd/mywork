/**
 * Profile.tsx — 완전 재작성 (2026-02-23)
 *
 * 구조:
 *   ProfileGate (default export)
 *     ├─ isConnected=false → <ProfileIntroPage />  (훅 없음, 순수 UI)
 *     └─ isConnected=true  → <ProfilePage />        (모든 데이터 로직)
 *
 * ProfilePage 내부도 모든 heavy 섹션을 React.lazy + Suspense + SectionErrorBoundary 3중 격리
 */

import { useAccount } from "wagmi";
import { lazy, Suspense, Component, ReactNode, ErrorInfo } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, User, TrendingUp, Share2, Network, BarChart3,
  DollarSign, PieChart, AlertCircle, ArrowLeft, RefreshCw,
  Copy, Check, ExternalLink, Users, Edit2, Save, X,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatUnits } from "viem";
import {
  PieChart as RechartsPie, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
} from "recharts";
import { generateReferralLink, getReferrerWallet, getOrCreateReferralCode } from "@/lib/referral";
import { getUserInvestments } from "@/lib/userInvestments";
import { getActiveUserStakes } from "@/lib/userStakes";
import { getUserByWallet } from "@/lib/users";
import { getReferralsByReferrer } from "@/lib/referrals";
import { getReferralActivitiesByReferrer, ReferralActivity } from "@/lib/referralActivities";
import { updateNodeReferralCode } from "@/lib/userReferralCodes";
import { useProfileData } from "@/hooks/useProfileData";
import type { UserNode } from "@/hooks/useProfileData";
import type { USDTTransfer } from "@/lib/walletTransfers";
import { InvestmentCertificateButton } from "@/components/InvestmentCertificate";
import { formatAddress } from "@/lib/utils";
import { logActivity } from "@/lib/userActivityLog";

// ── Lazy-loaded heavy components ──────────────────────────────────────────────
const ReferralShare     = lazy(() => import("@/components/ReferralShare"));
const PlanSelector      = lazy(() => import("@/components/PlanSelector"));
const ReferralDashboard = lazy(() => import("@/components/ReferralDashboard"));
const OrgChart          = lazy(() => import("@/components/OrgChart").then(m => ({ default: m.OrgChart })));

// ── Types ─────────────────────────────────────────────────────────────────────
type InvestmentPlan = import("@/lib/plans").InvestmentPlan;

interface DirectReferral {
  address: string;
  level: string;
  directPush: { current: number; required: number };
  personalPerformance: number;
  communityPerformance: number;
  thirtySky: number;
  totalTeamPerformance: number;
  totalTeamMembers: number;
}

// ── Earnings colors ───────────────────────────────────────────────────────────
const EARNINGS_COLORS: Record<string, string> = {
  BBAG: "#f59e0b",
  SBAG: "#3b82f6",
  CBAG: "#10b981",
  Staking: "#8b5cf6",
};

// ── SectionErrorBoundary ─────────────────────────────────────────────────────
class SectionErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode; name?: string },
  { hasError: boolean; errMsg: string }
> {
  state = { hasError: false, errMsg: "" };

  // 구글 번역 관련 DOM 에러 판별
  static isTranslationError(e: Error): boolean {
    const msg = e?.message ?? "";
    return (
      msg.includes("removeChild") ||
      msg.includes("insertBefore") ||
      msg.includes("NotFoundError") ||
      msg.includes("not a child of this node") ||
      (msg.includes("Failed to execute") && msg.includes("Node"))
    );
  }

  static getDerivedStateFromError(e: Error) {
    if (SectionErrorBoundary.isTranslationError(e)) {
      console.warn("[SectionErrorBoundary] 번역 DOM 에러 무시:", e.message);
      return { hasError: false, errMsg: "" };
    }
    return { hasError: true, errMsg: e.message };
  }

  componentDidCatch(e: Error, info: ErrorInfo) {
    if (SectionErrorBoundary.isTranslationError(e)) return;
    const name = (this.props as { name?: string }).name || "unknown";
    const log = `[${name}] ${e.message}\n${info.componentStack}`;
    console.warn("[SectionErrorBoundary]", log);
    // Save to localStorage for debugging
    try { localStorage.setItem("profile_last_error", log.slice(0, 2000)); } catch {}
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 text-sm text-muted-foreground text-center border border-destructive/40 rounded-lg mb-4">
          <p className="font-semibold text-destructive mb-1">섹션 오류 ({(this.props as {name?:string}).name})</p>
          <p className="text-xs mb-2 break-all">{this.state.errMsg}</p>
          <button className="underline text-primary" onClick={() => this.setState({ hasError: false, errMsg: "" })}>
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Helper: lazy section wrapper ─────────────────────────────────────────────
const LazySection = ({
  children,
  fallbackHeight = "h-24",
  name,
}: {
  children: ReactNode;
  fallbackHeight?: string;
  name?: string;
}) => (
  <SectionErrorBoundary name={name}>
    <Suspense fallback={<div className={`${fallbackHeight} animate-pulse bg-muted rounded-lg mb-6`} />}>
      {children}
    </Suspense>
  </SectionErrorBoundary>
);

// ── Helper: WalletSubCard ─────────────────────────────────────────────────────
const WalletSubCard = ({
  label, address, totalInvestment, totalProfit, isLoading, transfers, usdtLabel,
}: {
  label: string; address: string; totalInvestment: number; totalProfit: number;
  isLoading: boolean; transfers: USDTTransfer[]; usdtLabel: string;
  conversionRate?: number; tokenPrice?: number;
}) => (
  <div className="border border-border/50 rounded-lg p-4">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">{label}</h3>
      <div className="text-right">
        <p className="text-sm text-muted-foreground">Total Investment</p>
        <p className="text-lg font-bold">{totalInvestment.toFixed(2)} {usdtLabel}</p>
        <p className="text-sm text-muted-foreground mt-1" style={{ visibility: totalProfit !== 0 ? "visible" : "hidden" }}>Profit</p>
        <p className={`text-lg font-bold ${totalProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
           style={{ visibility: totalProfit !== 0 ? "visible" : "hidden" }}>
          {totalProfit >= 0 ? "+" : ""}{totalProfit.toFixed(2)} {usdtLabel}
        </p>
      </div>
    </div>
    <p className="text-xs text-muted-foreground font-mono break-all mb-2">
      {address || "No wallet address configured"}
    </p>
    {isLoading ? (
      <div className="text-center py-4">
        <RefreshCw className="w-6 h-6 mx-auto mb-2 text-muted-foreground opacity-50 animate-spin" />
      </div>
    ) : transfers.length > 0 ? (
      <div className="space-y-2 mt-4">
        <h4 className="text-sm font-semibold mb-2">Transactions:</h4>
        {transfers.slice(0, 5).map((transfer, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-border/30">
            <span className="text-muted-foreground font-mono">{formatAddress(transfer.from || "")}</span>
            <span className="font-medium">{Number(transfer.amount).toFixed(2)} {usdtLabel}</span>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-xs text-muted-foreground text-center py-4">No transactions found</p>
    )}
  </div>
);

// ── Helper: NodeCard ──────────────────────────────────────────────────────────
const NodeCard = ({
  node, nodeReferralCodes, editingNodeId, editingCode, isSaving,
  copied, t, getColorClasses, onEditNodeCode, onCancelEdit, onSaveNodeCode,
  onCopy, onEditingCodeChange,
}: {
  node: UserNode;
  nodeReferralCodes: Record<string, string>;
  editingNodeId: string | null;
  editingCode: string;
  isSaving: boolean;
  copied: Record<string, boolean>;
  t: ReturnType<typeof useLanguage>["t"];
  getColorClasses: (color: string) => string;
  onEditNodeCode: (nodeId: number) => void;
  onCancelEdit: () => void;
  onSaveNodeCode: (nodeId: number) => void;
  onCopy: (text: string, key: string) => void;
  onEditingCodeChange: (v: string) => void;
}) => {
  const isEditing = editingNodeId === node.nodeId?.toString();
  const refCode = node.nodeId !== undefined ? nodeReferralCodes[node.nodeId.toString()] : "";
  return (
    <div className={`p-4 rounded-lg border-2 ${getColorClasses(node.color)}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-base">{node.name}</h3>
          <p className="text-xs text-muted-foreground">{node.purchaseDate ? format(new Date(node.purchaseDate), "yyyy-MM-dd") : ""}</p>
        </div>
        <Badge variant={node.status === "Active" ? "default" : "outline"} className="text-xs">{node.status}</Badge>
      </div>
      <p className="text-lg font-bold mb-3">{node.price.toLocaleString()} {t.common.usdt}</p>
      {node.nodeId !== undefined && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-1">{t.profile.referralCode}</p>
          {isEditing ? (
            <div className="flex gap-2">
              <input
                className="flex-1 text-xs border border-border rounded px-2 py-1 bg-background font-mono"
                value={editingCode}
                onChange={e => onEditingCodeChange(e.target.value)}
                placeholder="Enter referral code"
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={isSaving} onClick={() => onSaveNodeCode(node.nodeId!)}>
                {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 text-green-500" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancelEdit}>
                <X className="w-3 h-3 text-red-500" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex-1 text-xs font-mono text-foreground truncate">
                {refCode || "No code assigned"}
              </span>
              {refCode && (
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onCopy(refCode, `node-${node.nodeId}`)}>
                  {copied[`node-${node.nodeId}`] ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEditNodeCode(node.nodeId!)}>
                <Edit2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ProfilePage — only mounted when wallet IS connected
// ─────────────────────────────────────────────────────────────────────────────
const ProfilePage = ({
  address,
  isConnected,
}: {
  address: `0x${string}`;
  isConnected: boolean;
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // ── Team / Community state ────────────────────────────────────────────────
  const [teamPerformance, setTeamPerformance] = useState({
    marketLevel: "W S0", teamNode: 0, personalPerformance: 0,
    regionalPerformance: 0, communityPerformance: 0, thirtySky: 0,
    totalTeamPerformance: 0, totalTeamMembers: 0,
  });
  const [directReferrals, setDirectReferrals] = useState<DirectReferral[]>([]);
  const [referredUsers, setReferredUsers] = useState<Array<{ wallet: string; joinedAt: number }>>([]);
  const [referralActivities, setReferralActivities] = useState<ReferralActivity[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [copiedCommunity, setCopiedCommunity] = useState<Record<string, boolean>>({});

  const handleCopyCommunity = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedCommunity(p => ({ ...p, [key]: true }));
    setTimeout(() => setCopiedCommunity(p => ({ ...p, [key]: false })), 2000);
    logActivity(address.toLowerCase(), "referral_link_copy", { copied: text.slice(0, 42) });
  }, [address]);

  const loadTeamData = useCallback(async () => {
    setIsLoadingTeam(true);
    try {
      const norm = address.toLowerCase();

      // referrals 컬렉션 기준으로 추천인 목록 조회 (Admin과 동일한 소스)
      const [myInvestments, referralDocs, activities] = await Promise.all([
        getUserInvestments(norm).catch(() => [] as any[]),
        getReferralsByReferrer(norm).catch(() => [] as any[]),
        getReferralActivitiesByReferrer(norm).catch(() => [] as any[]),
      ]);

      // 내 개인 성과 (Personal Performance)
      const myPersonalPerf = myInvestments.reduce(
        (s: number, inv: { amount?: number }) => s + (inv.amount || 0), 0
      );

      // referredWallet 목록 추출
      const referredWallets: string[] = referralDocs.map(
        (r: { referredWallet: string }) => r.referredWallet.toLowerCase()
      );

      // 각 추천인의 User 정보 및 투자 데이터 병렬 조회
      const [userResults, invResults] = await Promise.all([
        Promise.all(referredWallets.map(w => getUserByWallet(w).catch(() => null))),
        Promise.all(referredWallets.map(w => getUserInvestments(w).catch(() => [] as any[]))),
      ]);

      const users = referredWallets.map((wallet, idx) => ({
        wallet,
        joinedAt: userResults[idx]?.createdAt ?? 0,
      }));

      setReferredUsers(users);
      setReferralActivities(activities);

      let totalTeamPerf = myPersonalPerf; // 내 투자 포함
      const built: DirectReferral[] = users.map((user, idx) => {
        const perf = invResults[idx].reduce(
          (s: number, inv: { amount?: number }) => s + (inv.amount || 0), 0
        );
        totalTeamPerf += perf;
        return {
          address: user.wallet,
          level: "Direct",
          directPush: { current: 0, required: 1 },
          personalPerformance: perf,
          communityPerformance: 0,
          thirtySky: 0,
          totalTeamPerformance: perf,
          totalTeamMembers: 1,
        };
      });

      setDirectReferrals(built);
      setTeamPerformance(p => ({
        ...p,
        teamNode: users.length,
        totalTeamMembers: users.length,
        personalPerformance: myPersonalPerf,
        totalTeamPerformance: totalTeamPerf,
      }));
    } catch (e) {
      console.error("loadTeamData error:", e);
    } finally {
      setIsLoadingTeam(false);
    }
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadTeamData();
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Earnings state ────────────────────────────────────────────────────────
  const [earningsInvestments, setEarningsInvestments] = useState<any[]>([]);
  const [earningsStakes, setEarningsStakes] = useState<any[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(false);

  const loadEarnings = useCallback(async () => {
    setEarningsLoading(true);
    try {
      const [inv, stakes] = await Promise.all([
        getUserInvestments(address),
        getActiveUserStakes(address),
      ]);
      setEarningsInvestments(inv);
      setEarningsStakes(stakes);
    } catch (e) {
      console.error("loadEarnings error:", e);
    } finally {
      setEarningsLoading(false);
    }
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadEarnings();
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── UI state ──────────────────────────────────────────────────────────────
  const [referralLink, setReferralLink] = useState("");
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    setReferralLink(generateReferralLink(origin, address));
    void getReferrerWallet();
    void getOrCreateReferralCode(address);
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Firebase / profile data ───────────────────────────────────────────────
  const decimals = 18;
  const {
    userNodes,
    isLoadingNodes,
    nodeReferralCodes,
    isLoadingInvestments,
    bbagWallet,
    sbagWallet,
    cbagWallet,
    targetPlan,
  } = useProfileData(address, isConnected, undefined, decimals);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCopy = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(p => ({ ...p, [key]: true }));
      toast.success(t.profile.copiedToClipboard);
      setTimeout(() => setCopied(p => ({ ...p, [key]: false })), 2000);
    } catch {
      toast.error(t.profile.failedToCopy);
    }
  }, [t]);

  const handleEditNodeCode = useCallback((nodeId: number) => {
    setEditingNodeId(nodeId.toString());
    setEditingCode(nodeReferralCodes[nodeId.toString()] || "");
  }, [nodeReferralCodes]);

  const handleCancelEdit = useCallback(() => {
    setEditingNodeId(null);
    setEditingCode("");
  }, []);

  const handleSaveNodeCode = useCallback(async (nodeId: number) => {
    if (!editingCode.trim()) return;
    setIsSaving(true);
    try {
      await updateNodeReferralCode(address.toLowerCase(), nodeId, editingCode.trim());
      toast.success("Referral code updated");
      setEditingNodeId(null);
    } catch {
      toast.error("Failed to save code");
    } finally {
      setIsSaving(false);
    }
  }, [address, editingCode]);

  const getColorClasses = useCallback((color: string) => {
    switch (color) {
      case "gold": return "border-yellow-500/50 text-yellow-400";
      case "silver": return "border-gray-400/50 text-gray-400";
      case "blue": return "border-blue-500/50 text-blue-400";
      case "green": return "border-green-500/50 text-green-400";
      case "red": return "border-red-500/50 text-red-400";
      case "purple": return "border-purple-500/50 text-purple-400";
      case "orange": return "border-orange-500/50 text-orange-400";
      default: return "border-border text-foreground";
    }
  }, []);

  // ── Earnings computed ─────────────────────────────────────────────────────
  const earningsComputed = useMemo(() => {
    try {
      const eTotalInvested = earningsInvestments.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const eTotalProfit   = earningsInvestments.reduce((s, i) => s + (Number(i.profit) || 0), 0);
      const eTotalTokenVal = earningsInvestments.reduce((s, i) => s + (Number(i.tokenValueUSDT) || 0), 0);
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
      earningsInvestments.forEach(inv => {
        const cat = inv.category || "Other";
        eCategoryMap[cat] = (eCategoryMap[cat] || 0) + (Number(inv.amount) || 0);
      });
      if (eStakingPrincipal > 0) eCategoryMap["Staking"] = eStakingPrincipal;
      const ePieData = Object.entries(eCategoryMap).map(([name, value]) => ({ name, value }));
      const monthMap: Record<string, number> = {};
      earningsInvestments.forEach(inv => {
        try {
          const raw = inv.investedAt;
          const d = raw instanceof Date ? raw
            : typeof raw === "number" ? new Date(raw > 1e12 ? raw : raw * 1000)
            : raw?.seconds ? new Date(raw.seconds * 1000)
            : raw?.toDate ? raw.toDate()
            : null;
          if (!d || isNaN(d.getTime())) return;
          const key = format(d, "MMM yy");
          monthMap[key] = (monthMap[key] || 0) + (Number(inv.amount) || 0);
        } catch { /* skip */ }
      });
      const now = new Date();
      const eBarData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        const key = format(d, "MMM yy");
        return { month: key, amount: monthMap[key] || 0 };
      });
      return { eTotalInvested, eTotalProfit, eTotalTokenVal, eStakingPrincipal, eStakingDaily, ePieData, eBarData };
    } catch {
      return { eTotalInvested: 0, eTotalProfit: 0, eTotalTokenVal: 0, eStakingPrincipal: 0, eStakingDaily: 0, ePieData: [], eBarData: [] };
    }
  }, [earningsInvestments, earningsStakes]);

  const { eTotalInvested, eTotalProfit, eTotalTokenVal, eStakingPrincipal, eStakingDaily, ePieData, eBarData } = earningsComputed;

  // ── Community groups ──────────────────────────────────────────────────────
  const communityGroups = [
    { id: "tg-global", name: "Telegram Global", url: "https://t.me/alphabagdao", icon: "telegram" },
    { id: "kakao",     name: "KakaoTalk OpenChat", url: "https://open.kakao.com/", icon: "kakao" },
    { id: "tg-korea",  name: "Telegram Korea",  url: "https://t.me/alphabagdao", icon: "telegram" },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <main className="pt-[88px] sm:pt-20 pb-12">
        <div className="container mx-auto px-3 sm:px-4 w-full max-w-full">

          {/* Profile Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground">{t.profile.title || "Profile"}</h1>
            </div>
            <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Back Home</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>

          {/* ── Plan Selector ── */}
          <LazySection fallbackHeight="h-24" name="PlanSelector">
            <PlanSelector />
          </LazySection>

          {/* ── Referral Dashboard ── */}
          <LazySection fallbackHeight="h-20" name="ReferralDashboard">
            <ReferralDashboard />
          </LazySection>

          {/* ── Referral Share ── */}
          <LazySection fallbackHeight="h-4" name="ReferralShare">
            <ReferralShare />
          </LazySection>

          {/* ── Community Groups ── */}
          <Card className="mb-8 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {t.community.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {communityGroups.map(group => (
                  <div key={group.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Share2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{group.name}</p>
                        <p className="text-xs text-muted-foreground">{group.url}</p>
                      </div>
                    </div>
                    <Button variant="default" size="sm"
                      onClick={() => window.open(group.url, "_blank", "noopener,noreferrer")}
                      className="text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-8 shrink-0 w-full sm:w-auto">
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── My Nodes ── */}
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
                <Button variant="outline" size="icon" onClick={() => window.location.reload()}
                  disabled={isLoadingNodes || !address} className="shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoadingNodes ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingNodes ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50 animate-spin" />
                </div>
              ) : userNodes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userNodes.map((node: UserNode) => (
                    <NodeCard
                      key={node.id}
                      node={node}
                      nodeReferralCodes={nodeReferralCodes}
                      editingNodeId={editingNodeId}
                      editingCode={editingCode}
                      isSaving={isSaving}
                      copied={copied}
                      t={t}
                      getColorClasses={getColorClasses}
                      onEditNodeCode={handleEditNodeCode}
                      onCancelEdit={handleCancelEdit}
                      onSaveNodeCode={handleSaveNodeCode}
                      onCopy={handleCopy}
                      onEditingCodeChange={setEditingCode}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Network className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">{t.profile.noNodesYet || "No nodes yet"}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Total Investment ── */}
          <Card className="mb-8 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    {t.profile.myTotalInvestment}
                  </CardTitle>
                  <CardDescription>{t.profile.myTotalInvestmentDescription}</CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={() => window.location.reload()}
                  disabled={isLoadingInvestments || !address} className="shrink-0">
                  <RefreshCw className={`w-4 h-4 ${isLoadingInvestments ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {eTotalInvested.toFixed(2)} {t.common.usdt}
                </div>
                <p className="text-muted-foreground mb-2">{t.profile.totalInvestedAmount}</p>
              </div>
            </CardContent>
          </Card>

          {/* ── Wallets BBAG/SBAG/CBAG ── */}
          {targetPlan && (
            <Card className="mb-8 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Wallets — {(targetPlan as InvestmentPlan).name}
                </CardTitle>
                <CardDescription>Transactions and profits for BBAG, SBAG, and CBAG wallets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <WalletSubCard label="BBAG Wallet" address={bbagWallet.address}
                    totalInvestment={bbagWallet.totalInvestment} totalProfit={bbagWallet.totalProfit}
                    isLoading={bbagWallet.isLoading} transfers={bbagWallet.transfers} usdtLabel={t.common.usdt} />
                  <WalletSubCard label="SBAG NUMI" address={sbagWallet.address}
                    totalInvestment={sbagWallet.totalInvestment} totalProfit={sbagWallet.totalProfit}
                    isLoading={sbagWallet.isLoading} transfers={sbagWallet.transfers} usdtLabel={t.common.usdt} />
                  <WalletSubCard label="CBAG Wallet" address={cbagWallet.address}
                    totalInvestment={cbagWallet.totalInvestment} totalProfit={cbagWallet.totalProfit}
                    isLoading={cbagWallet.isLoading} transfers={cbagWallet.transfers} usdtLabel={t.common.usdt} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Leaderboard ── admin only, not shown on profile page */}

          {/* ── OrgChart (user view) ── */}
          <div className="mb-8">
            <LazySection fallbackHeight="h-24" name="OrgChart">
              <OrgChart viewAs="user" />
            </LazySection>
          </div>

          {/* ── Team Performance ── */}
          <Card className="mb-8 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    {t.community.overallTeamPerformance}
                  </CardTitle>
                  <CardDescription>
                    {t.community.myShare} · {referredUsers.length}{t.community.totalTeamMembers ? ` ${t.community.totalTeamMembers}` : "명"}
                  </CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={loadTeamData} disabled={isLoadingTeam}
                  className="shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoadingTeam ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: t.community.marketLevel,         value: teamPerformance.marketLevel },
                  { label: t.community.teamNode,            value: String(teamPerformance.teamNode) },
                  { label: t.community.personalPerformance, value: `$${teamPerformance.personalPerformance.toFixed(2)}` },
                  { label: t.community.regionalPerformance, value: `$${teamPerformance.regionalPerformance.toFixed(2)}` },
                  { label: `${t.community.communityPerformance} / 30sky`, value: `$${teamPerformance.communityPerformance.toFixed(2)} / $${teamPerformance.thirtySky.toFixed(2)}` },
                  { label: t.community.totalTeamPerformance, value: `$${teamPerformance.totalTeamPerformance.toFixed(2)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-sm font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              {/* Direct referral list */}
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3">
                  {t.community.myShare} ({referredUsers.length})
                </p>
                {isLoadingTeam ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50 animate-spin" />
                  </div>
                ) : referredUsers.length > 0 ? (
                  <div className="space-y-4">
                    {referredUsers.map((user, index) => {
                      const userActivities = referralActivities.filter(
                        a => a.referredWallet.toLowerCase() === user.wallet.toLowerCase()
                      );
                      const perfData = directReferrals.find(
                        r => r.address.toLowerCase() === user.wallet.toLowerCase()
                      );
                      return (
                        <div key={index} className="rounded-xl p-4 border-2 border-border/50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-sm truncate">{user.wallet}</p>
                                <p className="text-xs text-muted-foreground">
                                  Joined: {new Date(user.joinedAt).toLocaleDateString()}
                                  {perfData && <span className="ml-2 text-primary font-medium">{perfData.level}</span>}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => handleCopyCommunity(user.wallet, `user-${index}`)}>
                              {copiedCommunity[`user-${index}`]
                                ? <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                                : <Copy className="w-3 h-3 sm:w-4 sm:h-4" />}
                            </Button>
                          </div>
                          {perfData && (
                            <div className="mt-2 mb-3 grid grid-cols-2 gap-1.5 text-xs pl-3 border-l-2 border-primary/30">
                              {[
                                [t.community.numberOfDirectPush, `${perfData.directPush.current}/${perfData.directPush.required}`],
                                [t.community.personalPerformance, `$${perfData.personalPerformance.toFixed(2)}`],
                                [`${t.community.communityPerformance} / 30sky`, `$${perfData.communityPerformance.toFixed(2)} / $${perfData.thirtySky.toFixed(2)}`],
                                [t.community.totalTeamPerformance, `$${perfData.totalTeamPerformance.toFixed(2)}`],
                              ].map(([lbl, val]) => (
                                <div key={lbl} className="flex justify-between gap-1">
                                  <span className="text-muted-foreground">{lbl}</span>
                                  <span className="font-medium">{val}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {userActivities.length > 0 ? (
                            <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Activities:</p>
                              {userActivities.map(activity => {
                                const actText =
                                  activity.activityType === "plan_added_to_cart"
                                    ? `Added plan "${activity.planName || activity.planId}" to cart`
                                    : activity.activityType === "plan_invested"
                                    ? `Invested ${activity.amount ? `${activity.amount} USDT` : ""} in "${activity.planName || activity.planId}"`
                                    : activity.activityType === "node_purchased"
                                    ? `Purchased node "${activity.nodeName || `Node ${activity.nodeId}`}"${activity.nodePrice ? ` (${activity.nodePrice} USDT)` : ""}`
                                    : activity.activityType;
                                return (
                                  <div key={activity.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                                    <span className="text-primary mt-0.5">•</span>
                                    <div className="flex-1 min-w-0">
                                      <span>{actText}</span>
                                      <span className="text-[10px] text-muted-foreground/70 ml-1">{new Date(activity.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="mt-3 pt-3 border-t border-border/30">
                              <p className="text-xs text-muted-foreground">No activities yet</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Share2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No referred users yet</p>
                    <p className="text-sm text-muted-foreground mt-2">Share your referral link to invite others</p>
                  </div>
                )}
              </div>

              {/* Referral link quick-copy */}
              {referralLink && (
                <div className="pt-4 border-t border-border/40">
                  <p className="text-xs text-muted-foreground mb-2">My Referral Link</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={referralLink}
                      className="flex-1 text-xs font-mono border border-border rounded px-3 py-2 bg-muted/30 truncate"
                    />
                    <Button size="sm" variant="outline" onClick={() => handleCopy(referralLink, "ref-link")}>
                      {copied["ref-link"] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── EARNINGS ── */}
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
              {/* KPI */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Invested",   value: `$${eTotalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, sub: "USDT",                  icon: DollarSign, color: "border-l-primary" },
                  { label: "Total Token Value", value: `$${eTotalTokenVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, sub: "Current value",          icon: BarChart3,   color: "border-l-blue-500" },
                  { label: "Unrealized P/L",    value: `${eTotalProfit >= 0 ? "+" : ""}$${eTotalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, sub: eTotalInvested ? `${((eTotalProfit / eTotalInvested) * 100).toFixed(1)}%` : "0%", icon: TrendingUp, color: eTotalProfit >= 0 ? "border-l-green-500" : "border-l-red-500" },
                  { label: "Staking Daily",     value: `+$${eStakingDaily.toFixed(2)}`,                                                                             sub: `Principal: $${eStakingPrincipal.toFixed(2)}`,    icon: Wallet,      color: "border-l-purple-500" },
                ].map(kpi => (
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <PieChart className="w-4 h-4 text-primary" /> Portfolio Allocation
                    </CardTitle>
                    <CardDescription>Investment by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {earningsLoading ? <Skeleton className="h-60 w-full" /> :
                      ePieData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-60 text-muted-foreground gap-2">
                          <AlertCircle className="w-8 h-8" /><p className="text-sm">No investment data</p>
                        </div>
                      ) : (
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                              <Pie data={ePieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {ePieData.map(entry => <Cell key={entry.name} fill={EARNINGS_COLORS[entry.name] || "#6b7280"} />)}
                              </Pie>
                              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Amount"]} />
                              <Legend />
                            </RechartsPie>
                          </ResponsiveContainer>
                        </div>
                      )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="w-4 h-4 text-primary" /> Monthly Investment
                    </CardTitle>
                    <CardDescription>Last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {earningsLoading ? <Skeleton className="h-60 w-full" /> :
                      eBarData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-60 text-muted-foreground gap-2">
                          <AlertCircle className="w-8 h-8" /><p className="text-sm">No investment data</p>
                        </div>
                      ) : (
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={eBarData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                              <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Invested"]} />
                              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                  </CardContent>
                </Card>
              </div>

              {/* Investment list */}
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
                      <AlertCircle className="w-8 h-8" /><p className="text-sm">No investments found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {earningsInvestments.map(inv => {
                        let dateStr = "-";
                        try {
                          const raw = inv.investedAt;
                          const d = raw instanceof Date ? raw
                            : typeof raw === "number" ? new Date(raw > 1e12 ? raw : raw * 1000)
                            : raw?.seconds ? new Date(raw.seconds * 1000)
                            : raw?.toDate ? raw.toDate() : null;
                          if (d && !isNaN(d.getTime())) dateStr = format(d, "yyyy-MM-dd");
                        } catch { /* skip */ }
                        return (
                          <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs font-mono">{inv.category}</Badge>
                              <div>
                                <p className="text-sm font-medium">{inv.projectName}</p>
                                <p className="text-xs text-muted-foreground">{dateStr}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">${(inv.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                              {inv.profit !== undefined && (
                                <p className={`text-xs font-medium ${inv.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                                  {inv.profit >= 0 ? "+" : ""}{(inv.profit || 0).toFixed(2)} P/L
                                </p>
                              )}
                              <InvestmentCertificateButton
                                investorAddress={address}
                                planName={inv.projectName || inv.category || "AlphaBag"}
                                amount={inv.amount || 0}
                                date={dateStr}
                              />
                            </div>
                          </div>
                        );
                      })}
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

// ─────────────────────────────────────────────────────────────────────────────
// ProfileIntroPage — shown when wallet is NOT connected (no hooks at all)
// ─────────────────────────────────────────────────────────────────────────────
const ProfileIntroPage = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <main className="pt-[88px] sm:pt-20 pb-12">
        <div className="container mx-auto px-3 sm:px-4 w-full max-w-full">
          <div className="max-w-2xl mx-auto mt-12 space-y-6">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden">
              <CardContent className="pt-8 pb-8 text-center relative">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/10 rounded-full blur-3xl" />
                </div>
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                    <Wallet className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-display font-bold mb-2">{t.profile.connectWallet}</h2>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{t.profile.connectWalletDescription}</p>
                  <div className="grid grid-cols-3 gap-3 mt-4 mb-6">
                    {([
                      { label: "Investments", Icon: DollarSign },
                      { label: "Referrals",   Icon: Share2 },
                      { label: "Earnings",    Icon: TrendingUp },
                    ] as const).map(({ label, Icon }) => (
                      <div key={label} className="bg-muted/40 rounded-lg p-3 text-center">
                        <div className="flex justify-center mb-1"><Icon className="w-6 h-6 text-muted-foreground/60" /></div>
                        <div className="text-xs text-muted-foreground font-medium">{label}</div>
                        <div className="text-sm font-bold text-muted-foreground/50 mt-0.5">—</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Connect your wallet using the button in the top navigation bar.
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                { Icon: BarChart3,   title: "Investment Dashboard", desc: "Track all your BBAG & SBAG investments, profits, and portfolio allocation in one place." },
                { Icon: Network,     title: "Referral Network",     desc: "Share your unique referral link and earn rewards from your growing team." },
                { Icon: AlertCircle, title: "Account Settings",     desc: "Manage your profile, update your username, and secure your account." },
              ] as const).map(({ Icon, title, desc }) => (
                <Card key={title} className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="pt-5 pb-4 flex gap-3">
                    <Icon className="w-6 h-6 text-primary/60 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm mb-0.5">{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ProfileGate — default export
//   · useAccount only (no other hooks)
//   · Disconnected → <ProfileIntroPage />  (zero data hooks)
//   · Connected    → <ProfilePage />       (all data hooks, only mounted here)
// ─────────────────────────────────────────────────────────────────────────────
const ProfileGate = () => {
  const { address, isConnected } = useAccount();
  if (!isConnected || !address) return <ProfileIntroPage />;
  return <ProfilePage address={address} isConnected={isConnected} />;
};

export default ProfileGate;
