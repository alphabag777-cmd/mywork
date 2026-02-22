/**
 * ReferralDashboard – 추천 보상 현황판
 * 초대 인원, 투자 금액, 단계별 보상 진행률을 실시간 표시
 */

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  TrendingUp,
  Gift,
  RefreshCw,
  ChevronRight,
  Award,
  Star,
} from "lucide-react";
import { getReferralsByReferrer } from "@/lib/referrals";
import { getUserInvestments } from "@/lib/userInvestments";

interface RewardTier {
  label: string;
  requiredReferrals: number;
  bonus: string;
  color: string;
  bgColor: string;
}

const REWARD_TIERS: RewardTier[] = [
  { label: "브론즈", requiredReferrals: 1,  bonus: "첫 추천 보너스",    color: "text-orange-700",  bgColor: "bg-orange-100 dark:bg-orange-900/20" },
  { label: "실버",   requiredReferrals: 3,  bonus: "+0.5% 수수료 보상", color: "text-slate-500",   bgColor: "bg-slate-100 dark:bg-slate-800/30" },
  { label: "골드",   requiredReferrals: 5,  bonus: "+1% 수수료 보상",   color: "text-yellow-600",  bgColor: "bg-yellow-100 dark:bg-yellow-900/20" },
  { label: "플래티넘",requiredReferrals: 10, bonus: "VIP 전담 지원",    color: "text-blue-600",    bgColor: "bg-blue-100 dark:bg-blue-900/20" },
  { label: "다이아몬드",requiredReferrals: 20, bonus: "+2% 수수료 보상 + 특별 NFT 배지", color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/20" },
];

function getCurrentTier(count: number): { tier: RewardTier | null; next: RewardTier | null; progress: number } {
  const achieved = REWARD_TIERS.filter((t) => count >= t.requiredReferrals);
  const pending  = REWARD_TIERS.filter((t) => count < t.requiredReferrals);
  const tier = achieved[achieved.length - 1] ?? null;
  const next = pending[0] ?? null;
  const progress = next
    ? Math.min(100, Math.round((count / next.requiredReferrals) * 100))
    : 100;
  return { tier, next, progress };
}

const ReferralDashboard = () => {
  const { address, isConnected } = useAccount();
  const [referralCount, setReferralCount]     = useState(0);
  const [totalInvested, setTotalInvested]     = useState(0);  // USDT sum of referred users
  const [loading, setLoading]                 = useState(false);
  const [lastUpdated, setLastUpdated]         = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const referrals = await getReferralsByReferrer(address.toLowerCase());
      setReferralCount(referrals.length);

      // Sum investments of referred wallets
      const invArrays = await Promise.all(
        referrals.map((r) => getUserInvestments(r.referredWallet).catch(() => []))
      );
      const total = invArrays.flat().reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0);
      setTotalInvested(total);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("ReferralDashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) load();
  }, [address, isConnected, load]);

  if (!isConnected || !address) return null;

  const { tier, next, progress } = getCurrentTier(referralCount);

  return (
    <Card className="mb-8 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="w-4 h-4 text-primary" />
              추천 보상 현황판
            </CardTitle>
            <CardDescription className="text-xs">
              친구를 초대할수록 더 높은 등급과 보상을 받습니다
              {lastUpdated && (
                <span className="ml-2 text-muted-foreground/60">
                  {lastUpdated.toLocaleTimeString()} 기준
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4 bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">초대한 친구</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {loading ? "—" : referralCount}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">명</p>
          </div>
          <div className="rounded-xl p-4 bg-green-500/5 border border-green-500/10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">팀 총 투자액</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {loading ? "—" : `$${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">USDT</p>
          </div>
        </div>

        {/* Current tier badge */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30">
          <Award className={`w-8 h-8 shrink-0 ${tier?.color ?? "text-muted-foreground"}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {tier ? `${tier.label} 등급` : "등급 없음"}
              </span>
              {tier && (
                <Badge
                  className={`text-xs px-2 py-0 ${tier.bgColor} ${tier.color} border-0`}
                >
                  {tier.bonus}
                </Badge>
              )}
            </div>
            {next ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                다음 등급까지: {next.requiredReferrals - referralCount}명 더 초대
              </p>
            ) : (
              <p className="text-xs text-green-500 mt-0.5">✓ 최고 등급 달성!</p>
            )}
          </div>
        </div>

        {/* Progress to next tier */}
        {next && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {tier?.label ?? "시작"} → {next.label}
              </span>
              <span className="font-mono text-foreground">
                {referralCount} / {next.requiredReferrals}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Tier ladder */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            등급 혜택 로드맵
          </p>
          <div className="space-y-2">
            {REWARD_TIERS.map((t, i) => {
              const achieved = referralCount >= t.requiredReferrals;
              const isCurrent = tier?.label === t.label;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                    isCurrent
                      ? `${t.bgColor} border border-primary/30`
                      : achieved
                      ? "bg-muted/30 border border-border/40"
                      : "bg-muted/10 border border-border/20 opacity-60"
                  }`}
                >
                  {achieved ? (
                    <Star className={`w-4 h-4 shrink-0 fill-current ${t.color}`} />
                  ) : (
                    <Star className="w-4 h-4 shrink-0 text-muted-foreground/30" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${achieved ? t.color : "text-muted-foreground"}`}>
                        {t.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t.requiredReferrals}명 이상
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{t.bonus}</p>
                  </div>
                  {isCurrent && (
                    <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">현재</Badge>
                  )}
                  {!achieved && (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralDashboard;
