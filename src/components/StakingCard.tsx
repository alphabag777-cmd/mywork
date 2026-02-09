import { useState, useEffect, useCallback, useRef } from "react";
import { Clock, TrendingUp, Zap, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAccount, useChainId } from "wagmi";
import { bsc } from "wagmi/chains";
import { parseUnits, formatUnits, isAddress } from "viem";
import { Plan } from "@/lib/contract";
import { getReferrerWallet } from "@/lib/referral";
import {
  useStakingToken,
  useStakingTokenWithStatus,
  useStakingTokenDecimals,
  useTokenBalance,
  useTokenAllowance,
  useAPR,
  useApproveToken,
  useStake,
} from "@/hooks/useStaking";

interface StakingCardProps {
  period: string;
  duration: string;
  apy: number;
  minStake: number;
  plan: Plan;
  popular?: boolean;
  delay?: number;
}

const StakingCard = ({ period, duration, apy, minStake, plan, popular = false, delay = 0 }: StakingCardProps) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [amount, setAmount] = useState<string>("");
  
  const stakingToken = useStakingToken();
  const { isLoading: isStakingTokenLoading } = useStakingTokenWithStatus();
  const decimals = useStakingTokenDecimals(stakingToken);
  const tokenBalance = useTokenBalance(stakingToken);
  const allowance = useTokenAllowance(stakingToken);
  const contractAPR = useAPR(plan);
  const { approve, isPending: isApproving, isSuccess: isApproved } = useApproveToken();
  const { stake, isPending: isStaking, isConfirming, isSuccess: isStakeSuccess, error } = useStake();

  const finalAPR = contractAPR > 0 ? contractAPR : apy;
  const estimatedRewards = amount ? (parseFloat(amount) * (finalAPR / 100)).toFixed(2) : "0.00";

  const balanceFormatted = tokenBalance ? formatUnits(tokenBalance, decimals) : "0";
  const stakeAmountWei = amount && !isNaN(parseFloat(amount)) ? parseUnits(amount, decimals) : 0n;
  const needsApproval = allowance ? stakeAmountWei > allowance : true;
  const pendingStakeRef = useRef<{ planId: number; amount: bigint; referrer: `0x${string}` } | null>(null);

  useEffect(() => {
    if (isStakeSuccess) {
      toast.success(`Successfully staked ${amount} tokens for ${period}!`);
      setAmount("");
      
      // Store plan info for this stake (will be used when displaying stakes)
      // Note: We'll need to get the actual stakeId from the transaction receipt
      // For now, we store it with a timestamp to match later
      const stakeTimestamp = Date.now();
      localStorage.setItem(`stake_plan_${stakeTimestamp}`, plan.toString());
      
      pendingStakeRef.current = null;
    }
    if (error) {
      toast.error(`Staking failed: ${error.message}`);
    }
  }, [isStakeSuccess, error, amount, period, plan]);

  useEffect(() => {
    if (isApproved && pendingStakeRef.current) {
      const { planId, amount, referrer } = pendingStakeRef.current;
      stake(planId, amount, referrer);
      pendingStakeRef.current = null;
    }
  }, [isApproved, stake]);

  const handleStake = useCallback(async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    const stakeAmount = parseFloat(amount);
    if (!amount || isNaN(stakeAmount) || stakeAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (tokenBalance && stakeAmountWei > tokenBalance) {
      toast.error("Insufficient balance");
      return;
    }
    if (!stakingToken) {
      toast.error("Staking token not loaded. Please wait...");
      return;
    }
    if (!isAddress(stakingToken)) {
      toast.error("Invalid staking token address");
      return;
    }

    // Convert plan enum to planId number (uint8) to match ABI
    const planId = Number(plan);
    
    // Get referrer address from referral link (wallet parameter) or zero address
    const referrerWallet = getReferrerWallet();
    const referrer = (referrerWallet && isAddress(referrerWallet)) 
      ? (referrerWallet as `0x${string}`)
      : ("0x0000000000000000000000000000000000000000" as `0x${string}`);
    
    // Check if approval is needed
    if (needsApproval && stakingToken) {
      pendingStakeRef.current = { planId, amount: stakeAmountWei, referrer };
      approve(stakingToken, stakeAmountWei);
      return;
    }

    // Proceed with staking - call according to ABI: (planId, amount, referrer)
    stake(planId, stakeAmountWei, referrer);
  }, [isConnected, amount, tokenBalance, stakingToken, needsApproval, plan, stake, approve, stakeAmountWei]);

  const handleMax = () => {
    if (tokenBalance) {
      setAmount(balanceFormatted);
    }
  };

  return (
    <div 
      className={`relative group animate-fade-in`}
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Popular badge */}
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-gold-gradient text-primary-foreground text-xs font-display font-bold px-4 py-1 rounded-full uppercase tracking-wider glow-gold-sm">
            Most Popular
          </div>
        </div>
      )}

      <div className={`card-metallic rounded-2xl p-6 transition-all duration-500 hover:border-primary/50 ${popular ? 'border-primary/30 glow-gold-sm' : ''}`}>
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-secondary rounded-full px-3 py-1 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">{duration}</span>
          </div>
          <h3 className="font-display text-xl font-bold text-foreground">{period}</h3>
        </div>

        {/* APY Display */}
        <div className="text-center mb-6">
          <div className="font-display text-4xl font-bold text-gradient-gold mb-1">
            {finalAPR.toFixed(1)}%
          </div>
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span>APY</span>
          </div>
        </div>

        {/* Staking Input */}
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted-foreground">Amount to Stake</label>
              {isConnected && (
                <button
                  onClick={handleMax}
                  className="text-xs text-primary hover:underline"
                  type="button"
                >
                  Max: {balanceFormatted}
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-secondary/50 border-border focus:border-primary pr-14 font-body"
                disabled={!isConnected || isStaking || isApproving}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                TOKEN
              </span>
            </div>
          </div>

          {/* Estimated Rewards */}
          <div className="bg-secondary/30 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Est. Rewards</span>
              <span className="font-semibold text-primary">{estimatedRewards} TOKEN</span>
            </div>
          </div>
        </div>


        {/* CTA Button */}
        <Button 
          variant={popular ? "gold" : "gold-outline"} 
          className="w-full"
          size="lg"
          onClick={handleStake}
          disabled={!isConnected || isStakingTokenLoading || !stakingToken || isStaking || isApproving || isConfirming}
        >
          {isApproving || isConfirming ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isApproving ? "Approving..." : "Confirming..."}
            </>
          ) : isStaking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Staking...
            </>
          ) : !isConnected ? (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </>
          ) : chainId !== bsc.id ? (
            "Switch to BSC Mainnet"
          ) : !stakingToken ? (
            "Token Not Available"
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Stake
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StakingCard;
