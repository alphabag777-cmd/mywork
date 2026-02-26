/**
 * ReferralDashboard – 추천 등급 현황판
 * 현재 등급, 다음 등급 진행률, 등급 혜택 로드맵 표시
 * (직접 추천인수·팀 투자액은 하단 Team Performance 카드에서 별도 표시)
 */

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Gift,
  RefreshCw,
  ChevronRight,
  Award,
  Star,
} from "lucide-react";
import { getReferralsByReferrer } from "@/lib/referrals";

interface RewardTier {
  label: string;
  requiredReferrals: number;
  bonus: string;
  color: string;
  bgColor: string;
}

const COMING_SOON = "향후 보상정책 제공 예정";

const REWARD_TIERS: RewardTier[] = [
  { label: "브론즈",    requiredReferrals: 1,  bonus: COMING_SOON, color: "text-orange-700", bgColor: "bg-orange-100 dark:bg-orange-900/20" },
  { label: "실버",      requiredReferrals: 3,  bonus: COMING_SOON, color: "text-slate-500",  bgColor: "bg-slate-100 dark:bg-slate-800/30" },
  { label: "골드",      requiredReferrals: 5,  bonus: COMING_SOON, color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/20" },
  { label: "플래티넘",  requiredReferrals: 10, bonus: COMING_SOON, color: "text-blue-600",   bgColor: "bg-blue-100 dark:bg-blue-900/20" },
  { label: "다이아몬드",requiredReferrals: 20, bonus: COMING_SOON, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/20" },
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
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading]             = useState(false);
  const [lastUpdated, setLastUpdated]     = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const directReferrals = await getReferralsByReferrer(address.toLowerCase()).catch(() => []);
      setReferralCount(directReferrals.length);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("ReferralDashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  if (!isConnected || !address) return null;

  const { tier, next, progress } = getCurrentTier(referralCount);

  return (
    <Card className="mb-8 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="w-4 h-4 text-primary" />
              내 추천 등급
            </CardTitle>
            <CardDescription className="text-xs">
              친구를 초대할수록 더 높은 등급을 달성합니다
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
        {/* ── 현재 등급 배지 ── */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30">
          <Award className={`w-8 h-8 shrink-0 ${tier?.color ?? "text-muted-foreground"}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">
                {tier ? `${tier.label} 등급` : "등급 없음"}
              </span>
              {tier && (
                <Badge className={`text-xs px-2 py-0 ${tier.bgColor} ${tier.color} border-0`}>
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

        {/* ── 다음 등급 진행률 ── */}
        {next && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {tier?.label ?? "시작"} → {next.label}
              </span>
              <span className="font-mono text-foreground">
                {loading ? "—" : referralCount} / {next.requiredReferrals}
              </span>
            </div>
            <Progress value={loading ? 0 : progress} className="h-2" />
          </div>
        )}

        {/* ── 등급 혜택 로드맵 ── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            등급 혜택 로드맵
          </p>
          <div className="space-y-2">
            {REWARD_TIERS.map((t, i) => {
              const achieved   = referralCount >= t.requiredReferrals;
              const isCurrent  = tier?.label === t.label;
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
                    <p className="text-xs text-muted-foreground/70 italic">{t.bonus}</p>
                  </div>
                  {isCurrent && (
                    <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">현재</Badge>
                  )}
                  {!achieved && !isCurrent && (
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
