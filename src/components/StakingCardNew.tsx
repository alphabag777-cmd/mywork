import { useState, useEffect, useCallback, useRef } from "react";
import { Clock, TrendingUp, Zap, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAccount, useChainId } from "wagmi";
import { bsc } from "wagmi/chains";
import { parseUnits, formatUnits, isAddress } from "viem";
import { StakingPlan } from "@/lib/stakingPlans";
import {
  useStakingToken,
  useStakingTokenDecimals,
  useTokenBalance,
  useTokenAllowance,
  useApproveToken,
  useStake,
} from "@/hooks/useStaking";
import { STAKING_VAULT_CONTRACT_ADDRESS, STAKING_VAULT_ABI } from "@/lib/contract";
import { usePublicClient } from "wagmi";
import { createUserStake } from "@/lib/userStakes";

interface StakingCardNewProps {
  plan: StakingPlan;
  delay?: number;
}

const StakingCardNew = ({ plan, delay = 0 }: StakingCardNewProps) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [amount, setAmount] = useState<string>("");
  
  const stakingToken = plan.token as `0x${string}`;
  const decimals = useStakingTokenDecimals(stakingToken);
  const tokenBalance = useTokenBalance(stakingToken);
  const allowance = useTokenAllowance(stakingToken, STAKING_VAULT_CONTRACT_ADDRESS);
  const { approve, isPending: isApproving, isSuccess: isApproved } = useApproveToken();
  const { stake, isPending: isStaking, isConfirming, isSuccess: isStakeSuccess, error, hash } = useStake();

  // Calculate APR from daily rate
  const dailyRate = plan.dailyRateBps / 10000; // Convert basis points to decimal
  const apr = dailyRate * 365 * 100; // Convert to percentage
  const estimatedRewards = amount ? (parseFloat(amount) * (apr / 100) * (plan.lockDays / 365)).toFixed(2) : "0.00";

  const balanceFormatted = tokenBalance ? formatUnits(tokenBalance, decimals) : "0";
  const stakeAmountWei = amount && !isNaN(parseFloat(amount)) ? parseUnits(amount, decimals) : 0n;
  const needsApproval = allowance ? stakeAmountWei > allowance : true;
  const pendingStakeRef = useRef<{ amount: bigint; plan: StakingPlan } | null>(null);

  // Handle successful staking transaction
  useEffect(() => {
    if (isStakeSuccess && hash && address && publicClient && pendingStakeRef.current) {
      const saveStakeToFirestore = async () => {
        try {
          const { amount: stakeAmount, plan: stakePlan } = pendingStakeRef.current!;
          
          // Wait a bit for the transaction to be indexed
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Get transaction receipt
          const receipt = await publicClient.getTransactionReceipt({ hash });
          
          // Get block number and timestamp
          const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
          const startTime = Number(block.timestamp);
          const unlockTime = startTime + (stakePlan.lockDays * 86400);
          
          // Find the stakeId by querying the contract
          // The contract stores stakes in stakes[user][stakeId]
          // Contract uses 1-based indexing (stakeId starts from 1)
          let stakeId: number | null = null;
          
          // Try to find stakeId by checking stakes starting from 1
          // Contract uses sequential IDs starting from 1, so we'll check up to 1000
          for (let i = 1; i <= 1000; i++) {
            try {
              const stakeData = await publicClient.readContract({
                address: STAKING_VAULT_CONTRACT_ADDRESS,
                abi: STAKING_VAULT_ABI,
                functionName: "stakes",
                args: [address, BigInt(i)],
              } as any);
              
              // Check if this stake matches our transaction
              // Match by: principal amount, token, and start time (within 5 minutes)
              if (stakeData && stakeData[1] === stakeAmount && stakeData[0].toLowerCase() === stakePlan.token.toLowerCase()) {
                const stakeStartTime = Number(stakeData[2]);
                const timeDiff = Math.abs(stakeStartTime - startTime);
                
                // If start time is within 5 minutes, it's likely our stake
                if (timeDiff < 300) {
                  stakeId = i;
                  break;
                }
              }
            } catch (error) {
              // Stake doesn't exist at this ID, continue
              continue;
            }
          }
          
          if (stakeId === null) {
            console.error("Could not find stakeId in contract");
            toast.error("Stake successful but could not find stake ID. Please refresh and check your stakes.");
            return;
          }
          
          console.log("Found stakeId:", stakeId, "for transaction:", hash);
          
          // Save to Firestore with the correct stakeId (starts from 1)
          try {
            await createUserStake({
              wallet: address,
              stakeId,
              planId: stakePlan.planId,
              token: stakePlan.token,
              principal: stakeAmount.toString(),
              lockDays: stakePlan.lockDays,
              dailyRateBps: stakePlan.dailyRateBps,
              startTime,
              unlockTime,
              txHash: hash,
              status: "active",
            });
            
            console.log("Stake saved to Firestore successfully:", { wallet: address, stakeId });
            
            // Wait a moment for Firestore to be fully updated
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            toast.success(`Successfully staked ${amount} tokens for ${stakePlan.title}! Stake ID: ${stakeId}`);
            setAmount("");
            pendingStakeRef.current = null;
            
            // Trigger multiple refresh events to ensure it's caught
            console.log("Dispatching stakeCreated event for wallet:", address);
            const event = new CustomEvent('stakeCreated', { 
              detail: { 
                stakeId, 
                wallet: address.toLowerCase(),
                timestamp: Date.now()
              } 
            });
            
            // Trigger a refresh event for the stakes list
            console.log("Dispatching stakeCreated event for wallet:", address);
            window.dispatchEvent(event);
          } catch (firestoreError) {
            console.error("Error saving to Firestore:", firestoreError);
            toast.error(`Stake successful (ID: ${stakeId}) but failed to save to database. Please contact support.`);
          }
        } catch (error) {
          console.error("Error saving stake to Firestore:", error);
          toast.error("Stake successful but failed to save record. Please contact support.");
        }
      };
      
      saveStakeToFirestore();
    }
  }, [isStakeSuccess, hash, address, publicClient, plan, amount, stakeAmountWei]);

  useEffect(() => {
    if (error) {
      toast.error(`Staking failed: ${error.message}`);
    }
  }, [error]);

  useEffect(() => {
    if (isApproved && pendingStakeRef.current) {
      const { amount, plan } = pendingStakeRef.current;
      stake(stakingToken, amount, plan.lockDays, plan.dailyRateBps, plan.planId);
      pendingStakeRef.current = null;
    }
  }, [isApproved, stake, stakingToken]);

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

    // Validate min/max deposit
    if (stakeAmount < plan.minDeposit) {
      toast.error(`Minimum deposit is ${plan.minDeposit}`);
      return;
    }
    if (stakeAmount > plan.maxDeposit) {
      toast.error(`Maximum deposit is ${plan.maxDeposit}`);
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

    // Check if approval is needed
    if (needsApproval && stakingToken) {
      pendingStakeRef.current = { amount: stakeAmountWei, plan };
      approve(stakingToken, stakeAmountWei, STAKING_VAULT_CONTRACT_ADDRESS);
      return;
    }

    // Proceed with staking - set pending ref BEFORE calling stake
    pendingStakeRef.current = { amount: stakeAmountWei, plan };
    stake(stakingToken, stakeAmountWei, plan.lockDays, plan.dailyRateBps, plan.planId);
  }, [isConnected, amount, tokenBalance, stakingToken, needsApproval, plan, stake, approve, stakeAmountWei]);

  const handleMax = () => {
    if (tokenBalance) {
      const maxBalance = parseFloat(balanceFormatted);
      const maxAllowed = Math.min(maxBalance, plan.maxDeposit);
      setAmount(maxAllowed.toString());
    }
  };

  return (
    <div 
      className={`relative group animate-fade-in`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="card-metallic rounded-2xl p-6 transition-all duration-500 hover:border-primary/50">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-secondary rounded-full px-3 py-1 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">{plan.lockDays} Days</span>
          </div>
          <h3 className="font-display text-xl font-bold text-foreground">{plan.title}</h3>
        </div>

        {/* APY Display */}
        <div className="text-center mb-6">
          <div className="font-display text-4xl font-bold text-gradient-gold mb-1">
            {apr.toFixed(2)}%
          </div>
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span>APR</span>
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
                min={plan.minDeposit}
                max={plan.maxDeposit}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                TOKEN
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Min: {plan.minDeposit}</span>
              <span>Max: {plan.maxDeposit}</span>
            </div>
          </div>

          {/* Estimated Rewards */}
          <div className="bg-secondary/30 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Est. Rewards ({plan.lockDays} days)</span>
              <span className="font-semibold text-primary">{estimatedRewards} TOKEN</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Button 
          variant="gold" 
          className="w-full"
          size="lg"
          onClick={handleStake}
          disabled={!isConnected || !stakingToken || isStaking || isApproving || isConfirming}
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

export default StakingCardNew;
