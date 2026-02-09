import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, Wallet, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useUserStakes, useWithdraw } from "@/hooks/useStaking";
import { getStakingPlanByPlanId } from "@/lib/stakingPlans";
import { StakingPlan } from "@/lib/stakingPlans";
import { markStakeWithdrawn } from "@/lib/userStakes";
import { syncAllUserStakes } from "@/lib/syncStakes";
import StakeCard from "./StakeCard";

const UserStakesNew = () => {
  const { address, isConnected } = useAccount();
  const { stakes, isLoading: stakesLoading, refreshStakes } = useUserStakes();
  const { withdraw, isPending: isWithdrawing, isConfirming, isSuccess, error } = useWithdraw();
  const [planCache, setPlanCache] = useState<Record<string, StakingPlan>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const { t } = useLanguage();

  // Listen for stake creation events to automatically refresh after staking
  useEffect(() => {
    if (!address || !refreshStakes) return;

    const handleStakeCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.wallet) {
        if (customEvent.detail.wallet.toLowerCase() === address.toLowerCase()) {
          console.log("Stake created event received, auto-refreshing stakes...");
          // Wait for Firestore to be updated, then refresh
          setTimeout(() => {
            refreshStakes();
          }, 2000);
        }
      }
    };

    window.addEventListener('stakeCreated', handleStakeCreated);

    return () => {
      window.removeEventListener('stakeCreated', handleStakeCreated);
    };
  }, [address, refreshStakes]);

  // Load plan details for all stakes
  useEffect(() => {
    const loadPlans = async () => {
      const plans: Record<string, StakingPlan> = {};
      for (const stake of stakes) {
        if (!planCache[stake.planId]) {
          try {
            const plan = await getStakingPlanByPlanId(stake.planId);
            if (plan) {
              plans[stake.planId] = plan;
            }
          } catch (error) {
            console.error("Error loading plan:", error);
          }
        }
      }
      if (Object.keys(plans).length > 0) {
        setPlanCache((prev) => ({ ...prev, ...plans }));
      }
    };

    if (stakes.length > 0) {
      loadPlans();
    }
  }, [stakes]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Successfully withdrawn!");
    }
    if (error) {
      toast.error(`Withdrawal failed: ${error.message}`);
    }
  }, [isSuccess, error]);

  if (!isConnected || !address) {
    return (
      <div className="py-12">
        <Card className="p-8 text-center border-border/50">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground">Please connect your wallet to view your stakes</p>
        </Card>
      </div>
    );
  }

  const handleWithdraw = async (stakeId: number) => {
    if (!address) return;

    try {
      await withdraw(stakeId);
      // Mark as withdrawn in Firestore
      await markStakeWithdrawn(address, stakeId);
    } catch (error) {
      console.error("Error withdrawing:", error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  // Separate active and withdrawn stakes
  const activeStakes = stakes.filter((s) => s.status === "active");
  const withdrawnStakes = stakes.filter((s) => s.status === "withdrawn");

  // Calculate totals
  const totalPrincipal = activeStakes.reduce((sum, s) => sum + BigInt(s.principal), 0n);
  const totalWithdrawnPrincipal = withdrawnStakes.reduce((sum, s) => sum + BigInt(s.principal), 0n);

  if (stakesLoading) {
    return (
      <div className="py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const handleSyncStakes = async () => {
    if (!address) return;
    
    setIsSyncing(true);
    try {
      console.log("Starting manual sync from contract...");
      const count = await syncAllUserStakes(address);
      if (count > 0) {
        toast.success(`Synced ${count} stake(s) from contract!`);
        // Refresh stakes after sync
        setTimeout(() => {
          if (refreshStakes) {
            refreshStakes();
          }
        }, 1000);
      } else {
        toast.info("No new stakes found to sync");
      }
    } catch (error) {
      console.error("Error syncing stakes:", error);
      toast.error("Failed to sync stakes from contract. Please check console for details.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="py-12">
      <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Your Stakes</h2>
              <p className="text-muted-foreground">Manage your staking positions</p>
            </div>
            {address && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncStakes}
                disabled={isSyncing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync from Contract"}
              </Button>
            )}
          </div>
        
        {/* Total Summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-border/50">
            <p className="text-sm text-muted-foreground mb-1">Total Staked</p>
            <p className="text-2xl font-bold text-foreground">
              {formatUnits(totalPrincipal, 18)}
            </p>
          </Card>
          <Card className="p-4 border-border/50">
            <p className="text-sm text-muted-foreground mb-1">Active Stakes</p>
            <p className="text-2xl font-bold text-foreground">{activeStakes.length}</p>
          </Card>
          <Card className="p-4 border-border/50">
            <p className="text-sm text-muted-foreground mb-1">Withdrawn Stakes</p>
            <p className="text-2xl font-bold text-foreground">{withdrawnStakes.length}</p>
          </Card>
          <Card className="p-4 border-border/50">
            <p className="text-sm text-muted-foreground mb-1">Total Withdrawn</p>
            <p className="text-2xl font-bold text-foreground">
              {formatUnits(totalWithdrawnPrincipal, 18)}
            </p>
          </Card>
        </div>
      </div>

      {/* Active Stakes Section */}
      {activeStakes.length > 0 && (
        <div className="mb-8">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-foreground mb-2">Active Stakes ({activeStakes.length})</h3>
          </div>
          <div className="grid gap-4">
            {activeStakes.map((stake) => (
              <StakeCard
                key={stake.id}
                stake={stake}
                plan={planCache[stake.planId]}
                address={address!}
                onWithdraw={handleWithdraw}
                isWithdrawing={isWithdrawing}
                isConfirming={isConfirming}
                formatTime={formatTime}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Withdrawn Stakes Section */}
      {withdrawnStakes.length > 0 && (
        <div className="mb-8">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-foreground mb-2">Withdrawn Stakes ({withdrawnStakes.length})</h3>
          </div>
          <div className="grid gap-4">
            {withdrawnStakes.map((stake) => {
              const plan = planCache[stake.planId];
              const decimals = 18;
              const principalFormatted = formatUnits(BigInt(stake.principal), decimals);

              return (
                <Card key={stake.id} className="p-6 border-border/50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">
                            Stake #{stake.stakeId}
                          </h3>
                          {plan && (
                            <p className="text-sm text-muted-foreground">{plan.title}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Principal</p>
                          <p className="font-semibold text-foreground">{principalFormatted}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Unlock Date</p>
                          <p className="font-semibold text-foreground text-sm">
                            {formatDate(stake.unlockTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <p className="font-semibold text-green-500">Withdrawn</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Transaction</p>
                          <p className="font-mono text-xs text-foreground">
                            {stake.txHash.slice(0, 10)}...
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                          <p className="font-semibold text-foreground">{formatDate(stake.startTime)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Plan</p>
                          <p className="font-semibold text-foreground">{plan ? plan.title : stake.planId}</p>
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

      {/* Withdrawn Stakes Section */}
      {withdrawnStakes.length > 0 && (
        <div className="mb-8">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-foreground mb-2">Withdrawn Stakes ({withdrawnStakes.length})</h3>
          </div>
          <div className="grid gap-4">
            {withdrawnStakes.map((stake) => {
              const plan = planCache[stake.planId];
              const decimals = 18;
              const principalFormatted = formatUnits(BigInt(stake.principal), decimals);

              return (
                <Card key={stake.id} className="p-6 border-border/50 opacity-75">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">
                            Stake #{stake.stakeId}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {plan ? plan.title : stake.planId} • Withdrawn
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Principal</p>
                          <p className="font-semibold text-foreground">{principalFormatted}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Unlock Date</p>
                          <p className="font-semibold text-foreground text-sm">
                            {formatDate(stake.unlockTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <p className="font-semibold text-green-500">Withdrawn</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Transaction</p>
                          <p className="font-mono text-xs text-foreground">
                            {stake.txHash.slice(0, 10)}...
                          </p>
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

      {/* No Stakes Message */}
      {stakes.length === 0 && (
        <Card className="p-8 text-center border-border/50">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Stakes Found</h3>
          <p className="text-muted-foreground">Start staking to see your positions here</p>
        </Card>
      )}
    </div>
  );
};

export default UserStakesNew;
