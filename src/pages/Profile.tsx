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
} from "lucide-react";
import { generateReferralLink, getReferrerWallet, getOrCreateReferralCode } from "@/lib/referral";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useState, useEffect, useCallback, useMemo } from "react";
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
import ReferralShare from "@/components/ReferralShare";
import PlanSelector from "@/components/PlanSelector";

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
                  {(() => { try { const d = toSafeDate ? toSafeDate(transfer.timestamp) : new Date(transfer.timestamp); return d ? d.toLocaleString() : "-"; } catch { return "-"; } })()}
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
// ──────────────────────────────────────────────────────────────────────────────
// NodeCard — 노드 카드 독립 컴포넌트 (insertBefore 에러 방지)
// isSaving, editingNodeId 등 상태 변화 시 DOM 구조가 항상 동일하게 유지됨
// ──────────────────────────────────────────────────────────────────────────────
interface NodeCardProps {
  node: UserNode;
  nodeReferralCodes: Record<string, string>;
  editingNodeId: string | null;
  editingCode: string;
  isSaving: boolean;
  copied: Record<string, boolean>;
  t: any;
  getColorClasses: (color: string) => string;
  onEditNodeCode: (nodeId: number) => void;
  onCancelEdit: () => void;
  onSaveNodeCode: (nodeId: number) => void;
  onCopy: (text: string, key: string) => void;
  onEditingCodeChange: (val: string) => void;
}

const NodeCard = ({
  node, nodeReferralCodes, editingNodeId, editingCode, isSaving,
  copied, t, getColorClasses, onEditNodeCode, onCancelEdit,
  onSaveNodeCode, onCopy, onEditingCodeChange,
}: NodeCardProps) => {
  const colors = getColorClasses(node.color);
  const nodeKey = node.nodeId?.toString() ?? "";
  const isEditing = editingNodeId === nodeKey;
  const hasReferralCode = nodeKey && nodeReferralCodes[nodeKey];

  return (
    <div className={`card-metallic rounded-xl p-4 border-2 ${colors} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-lg">{node.name}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${
          node.status === "Active" ? "bg-green-500/20 text-green-400"
          : node.status === "Pending" ? "bg-yellow-500/20 text-yellow-400"
          : "bg-red-500/20 text-red-400"
        }`}>{node.status}</span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t.profile.price}</span>
          <span className="font-semibold">{node.price.toLocaleString()} {t.common.usdt}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t.profile.nodeId}</span>
          <span className="font-semibold">{node.nodeId ?? "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Purchase Date</span>
          <span className="font-semibold text-xs">
            {new Date(node.purchaseDate).toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-xs">Tx Hash</span>
          {node.transactionHash ? (
            <a href={`https://bscscan.com/tx/${node.transactionHash}`} target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-primary hover:underline truncate max-w-[120px]"
              title={node.transactionHash}>
              {node.transactionHash.slice(0, 6)}...{node.transactionHash.slice(-4)}
            </a>
          ) : <span className="text-xs text-muted-foreground">-</span>}
        </div>
        {hasReferralCode && (
          <div className="flex justify-between items-center pt-2 border-t border-border/50">
            <span className="text-muted-foreground text-xs">Referral Code</span>
            {/* 항상 고정 DOM 구조 — display 전환으로 insertBefore 방지 */}
            <div className="flex items-center gap-1">
              {/* editing 뷰 */}
              <div style={{ display: isEditing ? "flex" : "none" }} className="items-center gap-1">
                <Input value={editingCode} onChange={(e) => onEditingCodeChange(e.target.value)}
                  className="h-6 text-xs font-mono w-24 sm:w-32" placeholder="Enter code" disabled={isSaving} />
                <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6"
                  onClick={() => onSaveNodeCode(node.nodeId!)} disabled={isSaving}>
                  {isSaving
                    ? <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    : <Save className="w-2.5 h-2.5 text-green-500" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6"
                  onClick={onCancelEdit} disabled={isSaving}>
                  <X className="w-2.5 h-2.5 text-red-500" />
                </Button>
              </div>
              {/* view 뷰 */}
              <div style={{ display: isEditing ? "none" : "flex" }} className="items-center gap-1">
                <span className="font-mono text-xs text-primary">{nodeReferralCodes[nodeKey]}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6"
                  onClick={() => onEditNodeCode(node.nodeId!)}>
                  <Edit2 className="w-2.5 h-2.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6"
                  onClick={() => onCopy(nodeReferralCodes[nodeKey], `node-${node.nodeId}`)}>
                  {copied[`node-${node.nodeId}`]
                    ? <Check className="w-2.5 h-2.5 text-green-500" />
                    : <Copy className="w-2.5 h-2.5" />}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// NodeRefRow — Node Referral Codes 행 독립 컴포넌트
// <>Fragment + 조건부 버튼이 insertBefore 에러 유발 → 고정된 DOM 구조로 변경
// ──────────────────────────────────────────────────────────────────────────────
interface NodeRefRowProps {
  node: UserNode;
  refCode: string;
  isEditing: boolean;
  editingCode: string;
  isSaving: boolean;
  isCopied: boolean;
  colorClass: string;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onCopy: () => void;
  onCodeChange: (val: string) => void;
}

const NodeRefRow = ({
  node, refCode, isEditing, editingCode, isSaving, isCopied,
  colorClass, onEdit, onSave, onCancel, onCopy, onCodeChange,
}: NodeRefRowProps) => (
  <div className="card-metallic rounded-xl p-4 border-2 border-border/50 flex items-center justify-between">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ${colorClass}`}>
        <Network className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground mb-1">{node.name}</h4>
        {/* 항상 같은 DOM 구조 — isEditing에 따라 visibility만 전환 */}
        <div style={{ display: isEditing ? "block" : "none" }}>
          <Input value={editingCode} onChange={(e) => onCodeChange(e.target.value)}
            className="h-7 text-sm font-mono mt-1" placeholder="Enter code" disabled={isSaving} />
        </div>
        <div style={{ display: isEditing ? "none" : "block" }}>
          <p className="text-sm font-mono text-muted-foreground">{refCode}</p>
        </div>
      </div>
    </div>
    {/* 항상 4개 버튼 유지 — 불필요한 버튼은 hidden */}
    <div className="flex items-center gap-1">
      {/* Save 버튼 (editing 상태에서만 표시) */}
      <Button variant="ghost" size="icon"
        className={`shrink-0 h-7 w-7 sm:h-8 sm:w-8 ${isEditing ? "" : "hidden"}`}
        onClick={onSave} disabled={isSaving}>
        {isSaving
          ? <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
          : <Save className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />}
      </Button>
      {/* Cancel 버튼 (editing 상태에서만 표시) */}
      <Button variant="ghost" size="icon"
        className={`shrink-0 h-7 w-7 sm:h-8 sm:w-8 ${isEditing ? "" : "hidden"}`}
        onClick={onCancel} disabled={isSaving}>
        <X className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
      </Button>
      {/* Edit 버튼 (비편집 상태에서만 표시) */}
      <Button variant="ghost" size="icon"
        className={`shrink-0 h-7 w-7 sm:h-8 sm:w-8 ${isEditing ? "hidden" : ""}`}
        onClick={onEdit}>
        <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
      </Button>
      {/* Copy 버튼 (비편집 상태에서만 표시) */}
      <Button variant="ghost" size="icon"
        className={`shrink-0 h-7 w-7 sm:h-8 sm:w-8 ${isEditing ? "hidden" : ""}`}
        onClick={onCopy}>
        {isCopied
          ? <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
          : <Copy className="w-3 h-3 sm:w-4 sm:h-4" />}
      </Button>
    </div>
  </div>
);

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
      // 도메인 하드코딩 제거 — 항상 현재 origin 사용
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setReferralLink(generateReferralLink(origin, address));
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

  // decimals가 undefined일 때 formatUnits 크래시 방지
  const balanceFormatted = (tokenBalance != null && decimals != null)
    ? (() => { try { return formatUnits(tokenBalance, decimals); } catch { return "0"; } })()
    : "0";

  // ── Earnings computed values (useMemo로 격리 — 예외가 re-render를 오염시키지 않도록) ──
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
      earningsInvestments.forEach((inv) => {
        const cat = inv.category || "BBAG";
        eCategoryMap[cat] = (eCategoryMap[cat] || 0) + (Number(inv.amount) || 0);
      });
      const ePieData = Object.entries(eCategoryMap).map(([name, value]) => ({ name, value }));

      // investedAt 안전 변환: Firestore Timestamp / number / string / Date 모두 처리
      const toSafeDate = (val: any): Date | null => {
        try {
          if (!val) return null;
          if (typeof val === "object" && "seconds" in val) return new Date(val.seconds * 1000);
          if (typeof val === "object" && "toMillis" in val) return new Date(val.toMillis());
          const d = new Date(val);
          return isNaN(d.getTime()) ? null : d;
        } catch { return null; }
      };

      const eMonthlyMap: Record<string, number> = {};
      earningsInvestments.forEach((inv) => {
        try {
          const d = toSafeDate(inv.investedAt);
          if (!d) return;
          const m = format(d, "yyyy-MM");
          eMonthlyMap[m] = (eMonthlyMap[m] || 0) + (Number(inv.amount) || 0);
        } catch { /* skip */ }
      });
      const eBarData = Object.entries(eMonthlyMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6)
        .map(([month, amount]) => {
          try { return { month: format(new Date(month), "MMM yy"), amount }; }
          catch { return { month, amount }; }
        });

      return { eTotalInvested, eTotalProfit, eTotalTokenVal, eStakingPrincipal, eStakingDaily, ePieData, eBarData, toSafeDate };
    } catch (err) {
      console.error("[Profile] earningsComputed error:", err);
      return {
        eTotalInvested: 0, eTotalProfit: 0, eTotalTokenVal: 0,
        eStakingPrincipal: 0, eStakingDaily: 0,
        ePieData: [], eBarData: [],
        toSafeDate: (_: any) => null as Date | null,
      };
    }
  }, [earningsInvestments, earningsStakes]);

  const { eTotalInvested, eTotalProfit, eTotalTokenVal, eStakingPrincipal, eStakingDaily, ePieData, eBarData, toSafeDate } = earningsComputed;

  // Plan Selection → PlanSelector 컴포넌트로 완전 분리됨

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

          {/* ── 투자상품 선택 섹션 (독립 컴포넌트) ── */}
          <PlanSelector />

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
                  <p className="text-muted-foreground">
                    {t.profile.noNodesYet || "You haven't purchased any nodes yet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Node Referral Codes Section — NodeRefRow 컴포넌트로 분리해 insertBefore 완전 방지 */}
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
                      <NodeRefRow
                        key={node.id}
                        node={node}
                        refCode={nodeReferralCodes[node.nodeId!.toString()]}
                        isEditing={editingNodeId === node.nodeId!.toString()}
                        editingCode={editingCode}
                        isSaving={isSaving}
                        isCopied={!!copied[`node-ref-${node.nodeId}`]}
                        colorClass={getColorClasses(node.color)}
                        onEdit={() => handleEditNodeCode(node.nodeId!)}
                        onSave={() => handleSaveNodeCode(node.nodeId!)}
                        onCancel={handleCancelEdit}
                        onCopy={() => handleCopy(nodeReferralCodes[node.nodeId!.toString()], `node-ref-${node.nodeId}`)}
                        onCodeChange={setEditingCode}
                      />
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
                    ? (() => { try { return formatUnits(userVolume as bigint, volumeDecimals ?? 18); } catch { return "0"; } })()
                    : (userInvestment != null && investmentDecimals != null)
                    ? (() => { try { return formatUnits(userInvestment as bigint, investmentDecimals); } catch { return "0"; } })()
                    : "0"}{" "}
                  {t.common.usdt}
                </div>
                <p className="text-muted-foreground mb-2">{t.profile.totalInvestedAmount}</p>
                {userVolume && (
                  <p className="text-xs text-muted-foreground mb-6">
                    From contract: {(() => { try { return formatUnits(userVolume as bigint, volumeDecimals ?? 18); } catch { return "0"; } })()} {t.common.usdt}{" "}
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
                                {inv.profit>=0?"+":""}{ (inv.profit||0).toFixed(2)} P/L
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
