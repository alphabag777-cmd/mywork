/**
 * ReferralDashboard.tsx
 *
 * "내 추천인 현황" 카드 - 직접 추천인수 + 총 하위 추천인수 표시
 *
 * 데이터 소스: referrals 컬렉션 (Admin 유저목록과 동일한 소스)
 * - 직접 추천인수: getReferralsByReferrer(내 지갑) 결과 개수
 * - 총 하위 추천인수: 직접 추천인들의 추천인까지 재귀 합산 (2단계)
 */

import { useAccount } from "wagmi";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReferralsByReferrer } from "@/lib/referrals";

const ReferralDashboard = () => {
  const { isConnected, address } = useAccount();

  const [directCount, setDirectCount] = useState<number>(0);
  const [totalSubCount, setTotalSubCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const loadCounts = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const norm = address.toLowerCase();

      // 1단계: 내가 직접 추천한 사람들
      const directReferrals = await getReferralsByReferrer(norm).catch(() => []);
      const directWallets = directReferrals.map(
        (r: { referredWallet: string }) => r.referredWallet.toLowerCase()
      );
      setDirectCount(directWallets.length);

      // 2단계: 직접 추천인들이 추천한 사람들 (전체 하위)
      if (directWallets.length > 0) {
        const subResults = await Promise.all(
          directWallets.map(w => getReferralsByReferrer(w).catch(() => []))
        );
        const subTotal = subResults.reduce((sum, arr) => sum + arr.length, 0);
        setTotalSubCount(directWallets.length + subTotal);
      } else {
        setTotalSubCount(0);
      }
    } catch (e) {
      console.error("ReferralDashboard loadCounts error:", e);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      loadCounts();
    }
  }, [isConnected, address, loadCounts]);

  if (!isConnected || !address) return null;

  return (
    <Card className="mb-8 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5 text-primary" />
            내 추천인 현황
          </CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={loadCounts}
            disabled={loading}
            className="shrink-0 h-8 w-8"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* 직접 추천인수 */}
          <div className="rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">직접 추천인수</p>
            </div>
            {loading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground">{directCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">명</p>
              </>
            )}
          </div>

          {/* 총 하위 추천인수 */}
          <div className="rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">총 하위 추천인수</p>
            </div>
            {loading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground">{totalSubCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">명 (전체 하위)</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralDashboard;
