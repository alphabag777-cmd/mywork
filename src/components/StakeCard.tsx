import { formatUnits } from "viem";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, CheckCircle2, Loader2 } from "lucide-react";
import { usePreviewValue, useTimeRemaining } from "@/hooks/useStaking";
import { UserStake } from "@/lib/userStakes";
import { StakingPlan } from "@/lib/stakingPlans";

interface StakeCardProps {
  stake: UserStake;
  plan: StakingPlan | undefined;
  address: string;
  onWithdraw: (stakeId: number) => void;
  isWithdrawing: boolean;
  isConfirming: boolean;
  formatTime: (seconds: number) => string;
  formatDate: (timestamp: number) => string;
}

const StakeCard = ({
  stake,
  plan,
  address,
  onWithdraw,
  isWithdrawing,
  isConfirming,
  formatTime,
  formatDate,
}: StakeCardProps) => {
  const decimals = 18; // Default to 18, can be fetched from token
  
  // Helper function to format numbers with reasonable decimal places
  const formatNumber = (value: string | number): string => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "0";
    
    // For very small numbers (< 0.000001), show up to 8 decimal places
    if (num > 0 && num < 0.000001) {
      return num.toFixed(8).replace(/\.?0+$/, "");
    }
    
    // For normal numbers, format to 6 decimal places and remove trailing zeros
    const formatted = num.toFixed(6);
    // Remove trailing zeros after decimal point
    return formatted.replace(/\.?0+$/, "");
  };
  
  const principalFormatted = formatNumber(formatUnits(BigInt(stake.principal), decimals));
  const previewValue = usePreviewValue(address as `0x${string}`, stake.stakeId);
  const timeRemaining = useTimeRemaining(address as `0x${string}`, stake.stakeId);
  const currentValue = previewValue ? formatNumber(formatUnits(previewValue, decimals)) : principalFormatted;
  const reward = previewValue ? formatNumber(formatUnits(previewValue - BigInt(stake.principal), decimals)) : "0";
  const isUnlocked = timeRemaining === 0n || (timeRemaining && timeRemaining <= 0n);
  const timeRemainingFormatted = timeRemaining ? formatTime(Number(timeRemaining)) : "0s";

  return (
    <Card className="p-6 border-border/50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">Stake #{stake.stakeId}</h3>
              {plan && <p className="text-sm text-muted-foreground">{plan.title}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Principal</p>
              <p className="font-semibold text-foreground">{principalFormatted}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Current Value</p>
              <p className="font-semibold text-primary">{currentValue}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Rewards</p>
              <p className="font-semibold text-primary">{reward}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {isUnlocked ? (
                  <span className="flex items-center gap-1 text-green-500">
                    <CheckCircle2 className="w-3 h-3" />
                    Unlocked
                  </span>
                ) : (
                  "Time Remaining"
                )}
              </p>
              <p className="font-semibold text-foreground">{isUnlocked ? "Ready" : timeRemainingFormatted}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Start Date</p>
              <p className="font-semibold text-foreground">{formatDate(stake.startTime)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Unlock Date</p>
              <p className="font-semibold text-foreground">{formatDate(stake.unlockTime)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isUnlocked ? "gold" : "outline"}
            onClick={() => onWithdraw(stake.stakeId)}
            disabled={!isUnlocked || isWithdrawing || isConfirming}
            className="min-w-[120px]"
          >
            {isWithdrawing || isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {isConfirming ? "Confirming..." : "Withdrawing..."}
              </>
            ) : isUnlocked ? (
              "Withdraw"
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Locked
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default StakeCard;
