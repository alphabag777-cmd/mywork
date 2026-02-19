import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAddress } from "@/lib/utils";
import { Trophy, Users, TrendingUp, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { getAllUserInvestments } from "@/lib/userInvestments";
import { getAllReferralCounts } from "@/lib/referrals";
import { Button } from "@/components/ui/button";

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  value: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let _cache: {
  investors: LeaderboardEntry[];
  referrers: LeaderboardEntry[];
  fetchedAt: number;
} | null = null;

export function Leaderboard() {
  const [topInvestors, setTopInvestors] = useState<LeaderboardEntry[]>([]);
  const [topReferrers, setTopReferrers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (force = false) => {
    if (!force && _cache && Date.now() - _cache.fetchedAt < CACHE_TTL) {
      setTopInvestors(_cache.investors);
      setTopReferrers(_cache.referrers);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [investments, referralCounts] = await Promise.all([
        getAllUserInvestments(),
        getAllReferralCounts(),
      ]);

      // Aggregate investment per wallet
      const investorMap = new Map<string, number>();
      investments.forEach((inv) => {
        const w = inv.userId.toLowerCase();
        investorMap.set(w, (investorMap.get(w) || 0) + (inv.amount || 0));
      });

      const investors: LeaderboardEntry[] = Array.from(investorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([wallet, value], i) => ({ rank: i + 1, wallet, value }));

      const referrers: LeaderboardEntry[] = Object.entries(referralCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([wallet, value], i) => ({ rank: i + 1, wallet, value }));

      _cache = { investors, referrers, fetchedAt: Date.now() };
      setTopInvestors(investors);
      setTopReferrers(referrers);
    } catch (err) {
      console.error("Leaderboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rankBadge = (rank: number) =>
    `w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
      rank === 1
        ? "bg-yellow-500 text-black"
        : rank === 2
        ? "bg-gray-300 text-black"
        : rank === 3
        ? "bg-amber-600 text-white"
        : "bg-muted text-muted-foreground"
    }`;

  const SkeletonRow = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Top Investors */}
      <Card className="border-primary/20 bg-card/50">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-yellow-500" />
            Top Investors
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => loadData(true)}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : topInvestors.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
              : topInvestors.map((entry) => (
                  <div key={entry.rank} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={rankBadge(entry.rank)}>{entry.rank}</div>
                      <span className="font-mono text-sm">{formatAddress(entry.wallet)}</span>
                    </div>
                    <span className="font-semibold text-sm">
                      {entry.value.toLocaleString()} USDT
                    </span>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Referrers */}
      <Card className="border-primary/20 bg-card/50">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-blue-500" />
            Top Referrers
          </CardTitle>
          <Trophy className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : topReferrers.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
              : topReferrers.map((entry) => (
                  <div key={entry.rank} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={rankBadge(entry.rank)}>{entry.rank}</div>
                      <span className="font-mono text-sm">{formatAddress(entry.wallet)}</span>
                    </div>
                    <span className="font-semibold text-sm">{entry.value} Invites</span>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
