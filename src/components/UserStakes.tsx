import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useUserStakes, useStakingTokenDecimals, useStakingToken, useWithdraw, useUserTotals, usePlanInfo } from "@/hooks/useStaking";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, Wallet, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Plan enum for plan labels
enum Plan {
  ONE_MONTH = 0,
  THREE_MONTHS = 1,
  SIX_MONTHS = 2,
  ONE_YEAR = 3,
  TWO_YEARS = 4,
}

const planLabels: Record<Plan, string> = {
  [Plan.ONE_MONTH]: "1 Month",
  [Plan.THREE_MONTHS]: "3 Months",
  [Plan.SIX_MONTHS]: "6 Months",
  [Plan.ONE_YEAR]: "12 Months",
  [Plan.TWO_YEARS]: "2 Years",
};

const UserStakes = () => {
  const { address, isConnected } = useAccount();
  const stakes = useUserStakes();
  const stakingToken = useStakingToken();
  const decimals = useStakingTokenDecimals();
  const { principal: totalPrincipal, reward: totalReward } = useUserTotals();
  const { withdraw, isPending: isWithdrawing, isConfirming, isSuccess, error } = useWithdraw();
  const { t } = useLanguage();

  useEffect(() => {
    if (isSuccess) {
      toast.success(t.userStakes.claimed);
    }
    if (error) {
      toast.error(`${t.userStakes.claim} failed: ${error.message}`);
    }
  }, [isSuccess, error, t]);

  if (!isConnected || !address) {
    return null;
  }


  const handleClaim = async (stakeId: bigint) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const stake = stakes.find((s) => s.stakeId === stakeId);
    
    if (!stake) return;

    if (stake.claimed) {
      toast.error(t.userStakes.claimed);
      return;
    }

    if (stake.unlockTime > now) {
      toast.error(`${t.userStakes.locked} until ${new Date(Number(stake.unlockTime) * 1000).toLocaleDateString()}`);
      return;
    }

    // Note: withdraw function is a stub in deprecated useStaking hook
    // This functionality may need to be implemented elsewhere
    withdraw();
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  // Helper to get plan info from localStorage (stored when staking)
  const getPlanInfo = (stakeId: bigint | undefined): { label: string | null; planId?: number } => {
    if (!stakeId && stakeId !== 0n) return { label: null };
    
    const stored = localStorage.getItem(`stake_plan_${stakeId}`);
    if (stored) {
      const planId = parseInt(stored, 10);
      return { 
        label: planLabels[planId as Plan] || `Plan ${planId}`, 
        planId 
      };
    }
    return { label: null };
  };

  // Separate active and claimed stakes
  const activeStakes = stakes.filter((s) => !s.claimed);
  const claimedStakes = stakes.filter((s) => s.claimed);
  const totalPrincipalFormatted = formatUnits(totalPrincipal, decimals);
  const totalRewardFormatted = formatUnits(totalReward, decimals);
  
  // Calculate totals for display
  const totalActivePrincipal = activeStakes.reduce((sum, s) => sum + s.principal, 0n);
  const totalActiveReward = activeStakes.reduce((sum, s) => sum + s.reward, 0n);
  const totalClaimedPrincipal = claimedStakes.reduce((sum, s) => sum + s.principal, 0n);
  const totalClaimedReward = claimedStakes.reduce((sum, s) => sum + s.reward, 0n);

  return (
    <div className="py-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">{t.userStakes.yourInvestments}</h2>
        <p className="text-muted-foreground">{t.userStakes.managePositions}</p>
        
        {/* Total Summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-border/50">
            <p className="text-sm text-muted-foreground mb-1">{t.userStakes.totalInvested}</p>
            <p className="text-2xl font-bold text-foreground">{totalPrincipalFormatted}</p>
          </Card>
          <Card className="p-4 border-border/50">
            <p className="text-sm text-muted-foreground mb-1">{t.userStakes.totalRewards}</p>
            <p className="text-2xl font-bold text-primary">{totalRewardFormatted}</p>
          </Card>
          <Card className="p-4 border-border/50">
            <p className="text-sm text-muted-foreground mb-1">{t.userStakes.activeInvestments}</p>
            <p className="text-2xl font-bold text-foreground">{activeStakes.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatUnits(totalActivePrincipal, decimals)} {t.userStakes.invested}
            </p>
          </Card>
          <Card className="p-4 border-border/50">
            <p className="text-sm text-muted-foreground mb-1">{t.userStakes.claimedInvestments}</p>
            <p className="text-2xl font-bold text-foreground">{claimedStakes.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatUnits(totalClaimedPrincipal, decimals)} {t.userStakes.claimed}
            </p>
          </Card>
        </div>
      </div>

      {/* Active Investments Section */}
      {activeStakes.length > 0 && (
        <div className="mb-8">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-foreground mb-2">{t.userStakes.activeStakes} ({activeStakes.length})</h3>
            <p className="text-sm text-muted-foreground">
              {t.userStakes.total}: {formatUnits(totalActivePrincipal, decimals)} {t.userStakes.invested} • {formatUnits(totalActiveReward, decimals)} {t.userStakes.rewards}
            </p>
          </div>
          <div className="grid gap-4">
            {activeStakes.map((stake) => {
          const amountFormatted = formatUnits(stake.principal, decimals);
          const rewardFormatted = formatUnits(stake.reward, decimals);
          const planInfo = getPlanInfo(stake.stakeId);
          const now = BigInt(Math.floor(Date.now() / 1000));
          const isUnlocked = stake.unlockTime <= now;
          const daysRemaining = stake.unlockTime > now 
            ? Math.ceil(Number(stake.unlockTime - now) / 86400)
            : 0;

          return (
            <Card key={stake.stakeId?.toString() || "unknown"} className="p-6 border-border/50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">
                        {t.userStakes.investmentNumber}{stake.stakeId?.toString() || "N/A"}
                      </h3>
                      {planInfo.label && (
                        <p className="text-sm text-muted-foreground">
                          {planInfo.label}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t.userStakes.investedAmount}</p>
                      <p className="font-semibold text-foreground">{amountFormatted}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t.userStakes.pendingRewards}</p>
                      <p className="font-semibold text-primary">{rewardFormatted}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {isUnlocked ? (
                          <span className="flex items-center gap-1 text-green-500">
                            <CheckCircle2 className="w-3 h-3" />
                            {t.userStakes.unlocked}
                          </span>
                        ) : (
                          t.userStakes.unlocksIn
                        )}
                      </p>
                      <p className="font-semibold text-foreground">
                        {isUnlocked ? t.userStakes.ready : `${daysRemaining} ${t.userStakes.days}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t.userStakes.unlockDate}</p>
                      <p className="font-semibold text-foreground text-sm">
                        {formatDate(stake.unlockTime)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={isUnlocked && !stake.claimed ? "gold" : "outline"}
                    onClick={() => handleClaim(stake.stakeId!)}
                    disabled={!isUnlocked || stake.claimed || isWithdrawing || isConfirming || !stake.stakeId}
                    className="min-w-[120px]"
                  >
                    {isWithdrawing || isConfirming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {isConfirming ? t.staking.confirming : t.userStakes.claiming}
                      </>
                    ) : stake.claimed ? (
                      t.userStakes.claimed
                    ) : isUnlocked ? (
                      t.userStakes.claim
                    ) : (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        {t.userStakes.locked}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
          </div>
        </div>
      )}

      {/* Claimed Investments Section */}
      {claimedStakes.length > 0 && (
        <div className="mb-8">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-foreground mb-2">{t.userStakes.claimedStakes} ({claimedStakes.length})</h3>
            <p className="text-sm text-muted-foreground">
              {t.userStakes.total}: {formatUnits(totalClaimedPrincipal, decimals)} {t.userStakes.claimed} • {formatUnits(totalClaimedReward, decimals)} {t.userStakes.rewards} {t.userStakes.claimed}
            </p>
          </div>
          <div className="grid gap-4">
            {claimedStakes.map((stake) => {
              const amountFormatted = formatUnits(stake.principal, decimals);
              const rewardFormatted = formatUnits(stake.reward, decimals);
              const planInfo = getPlanInfo(stake.stakeId);
              const now = BigInt(Math.floor(Date.now() / 1000));
              const isUnlocked = stake.unlockTime <= now;

              return (
                <Card key={stake.stakeId?.toString() || "unknown"} className="p-6 border-border/50 opacity-75">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">
                            {t.userStakes.investmentNumber}{stake.stakeId?.toString() || "N/A"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {planInfo.label ? `${planInfo.label} • ` : ''}{t.userStakes.claimed}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t.userStakes.investedAmount}</p>
                          <p className="font-semibold text-foreground">{amountFormatted}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t.userStakes.rewardsClaimed}</p>
                          <p className="font-semibold text-primary">{rewardFormatted}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t.userStakes.unlockDate}</p>
                          <p className="font-semibold text-foreground text-sm">
                            {formatDate(stake.unlockTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t.userStakes.status}</p>
                          <p className="font-semibold text-green-500">{t.userStakes.claimed}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* No Investments Message */}
      {stakes.length === 0 && (
        <Card className="p-8 text-center border-border/50">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t.userStakes.noInvestments}</h3>
          <p className="text-muted-foreground">{t.userStakes.noInvestmentsDesc}</p>
        </Card>
      )}
    </div>
  );
};

export default UserStakes;

