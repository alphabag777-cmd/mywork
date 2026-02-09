import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useAccount } from "wagmi";
import { parseUnits, formatUnits, isAddress } from "viem";
import { STAKING_VAULT_CONTRACT_ADDRESS, STAKING_VAULT_ABI, ERC20_ABI } from "@/lib/contract";
import { useState, useEffect } from "react";
import { getStakingPlanByPlanId } from "@/lib/stakingPlans";
import { createUserStake, getUserStakes, markStakeWithdrawn } from "@/lib/userStakes";
import { StakingPlan } from "@/lib/stakingPlans";
import { UserStake } from "@/lib/userStakes";

/**
 * Get staking token address (can be extended to support multiple tokens)
 */
export function useStakingToken() {
  // For now, we'll use USDT as default
  // This can be extended to support multiple tokens per plan
  return "0x55d398326f99059fF775485246999027B3197955" as `0x${string}`;
}

/**
 * Get staking token with loading status
 */
export function useStakingTokenWithStatus() {
  return { data: useStakingToken(), isLoading: false, isError: false, error: null };
}

/**
 * Get staking token decimals
 */
export function useStakingTokenDecimals(tokenAddress?: `0x${string}`) {
  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: {
      enabled: !!tokenAddress,
    },
  });

  return decimals ?? 18;
}

/**
 * Get token balance
 */
export function useTokenBalance(tokenAddress?: `0x${string}`) {
  const { address } = useAccount();
  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!tokenAddress && !!address,
    },
  });

  return balance;
}

/**
 * Get token allowance
 */
export function useTokenAllowance(tokenAddress?: `0x${string}`, spenderAddress?: `0x${string}`) {
  const { address } = useAccount();
  const spender = spenderAddress || STAKING_VAULT_CONTRACT_ADDRESS;
  const { data: allowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && tokenAddress ? [address, spender] : undefined,
    query: {
      enabled: !!tokenAddress && !!address,
    },
  });

  return allowance;
}

/**
 * Approve token
 */
export function useApproveToken() {
  const { writeContract, isPending, isSuccess, error } = useWriteContract();

  const approve = (tokenAddress: `0x${string}`, amount: bigint, spender?: `0x${string}`) => {
    const approveAddress = spender || STAKING_VAULT_CONTRACT_ADDRESS;
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [approveAddress, amount],
    } as any);
  };

  return { approve, isPending, isSuccess, error };
}

/**
 * Stake tokens
 */
export function useStake() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const stake = async (
    token: `0x${string}`,
    amount: bigint,
    lockDays: number,
    rateBps: number,
    planId: string
  ) => {
    if (!isAddress(token)) {
      throw new Error("Invalid token address");
    }

    // Call contract stake function
    writeContract({
      address: STAKING_VAULT_CONTRACT_ADDRESS,
      abi: STAKING_VAULT_ABI,
      functionName: "stake",
      args: [token, amount, BigInt(lockDays), BigInt(rateBps)],
    } as any);

    // Wait for transaction and get stakeId from events
    // Note: We'll need to listen for events or query the contract to get the stakeId
    // For now, we'll handle this in the component after transaction success
  };

  return { stake, isPending, isConfirming, isSuccess, error, hash };
}

/**
 * Get stake preview value (current value with rewards)
 */
export function usePreviewValue(userAddress?: `0x${string}`, stakeId?: number) {
  const { address } = useAccount();
  const targetAddress = userAddress || address;

  const { data: previewValue } = useReadContract({
    address: STAKING_VAULT_CONTRACT_ADDRESS,
    abi: STAKING_VAULT_ABI,
    functionName: "previewValue",
    args: targetAddress && stakeId !== undefined ? [targetAddress, BigInt(stakeId)] : undefined,
    query: {
      enabled: !!targetAddress && stakeId !== undefined,
      refetchInterval: 1000, // Refetch every second for live updates
    },
  });

  return previewValue;
}

/**
 * Get time remaining until unlock
 */
export function useTimeRemaining(userAddress?: `0x${string}`, stakeId?: number) {
  const { address } = useAccount();
  const targetAddress = userAddress || address;

  const { data: timeRemaining } = useReadContract({
    address: STAKING_VAULT_CONTRACT_ADDRESS,
    abi: STAKING_VAULT_ABI,
    functionName: "timeRemaining",
    args: targetAddress && stakeId !== undefined ? [targetAddress, BigInt(stakeId)] : undefined,
    query: {
      enabled: !!targetAddress && stakeId !== undefined,
      refetchInterval: 1000, // Refetch every second for live countdown
    },
  });

  return timeRemaining;
}

/**
 * Get stake details from contract
 */
export function useStakeDetails(userAddress?: `0x${string}`, stakeId?: number) {
  const { address } = useAccount();
  const targetAddress = userAddress || address;

  const { data: stakeDetails } = useReadContract({
    address: STAKING_VAULT_CONTRACT_ADDRESS,
    abi: STAKING_VAULT_ABI,
    functionName: "stakes",
    args: targetAddress && stakeId !== undefined ? [targetAddress, BigInt(stakeId)] : undefined,
    query: {
      enabled: !!targetAddress && stakeId !== undefined,
    },
  });

  if (!stakeDetails || !Array.isArray(stakeDetails)) return undefined;
  
  return {
    token: stakeDetails[0] as `0x${string}`,
    principal: stakeDetails[1] as bigint,
    start: stakeDetails[2] as bigint,
    unlock: stakeDetails[3] as bigint,
    rateBps: stakeDetails[4] as bigint,
    withdrawn: stakeDetails[5] as boolean,
  };
}

/**
 * Withdraw stake
 */
export function useWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { address } = useAccount();

  const withdraw = async (stakeId: number) => {
    writeContract({
      address: STAKING_VAULT_CONTRACT_ADDRESS,
      abi: STAKING_VAULT_ABI,
      functionName: "withdraw",
      args: [BigInt(stakeId)],
    } as any);

    // After successful withdrawal, update Firestore
    if (isSuccess && address) {
      try {
        await markStakeWithdrawn(address, stakeId);
      } catch (error) {
        console.error("Error updating stake status in Firestore:", error);
      }
    }
  };

  return { withdraw, isPending, isConfirming, isSuccess, error, hash };
}

/**
 * Get user stakes from Firestore
 */
export function useUserStakes() {
  const { address } = useAccount();
  const [stakes, setStakes] = useState<UserStake[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadStakes = async () => {
    if (!address) {
      setStakes([]);
      return;
    }

    setIsLoading(true);
    try {
      const userStakes = await getUserStakes(address);
      console.log("Loaded stakes from Firestore:", userStakes.length);
      setStakes(userStakes);
    } catch (error) {
      console.error("Error loading user stakes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!address) {
      setStakes([]);
      return;
    }

    loadStakes();

    // Listen for stake creation events to refresh the list automatically
    const handleStakeCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.wallet && address) {
        if (customEvent.detail.wallet.toLowerCase() === address.toLowerCase()) {
          console.log("Stake created event received for this wallet, reloading stakes...");
          // Wait a bit for Firestore to be updated
          setTimeout(() => {
            loadStakes();
          }, 1500);
        }
      }
    };

    // Also listen for generic refresh event
    const handleRefreshStakes = () => {
      console.log("Refresh stakes event received, reloading...");
      if (address) {
        setTimeout(() => {
          loadStakes();
        }, 1000);
      }
    };

    window.addEventListener('stakeCreated', handleStakeCreated);
    window.addEventListener('refreshStakes', handleRefreshStakes);
    
    return () => {
      window.removeEventListener('stakeCreated', handleStakeCreated);
      window.removeEventListener('refreshStakes', handleRefreshStakes);
    };
  }, [address]);

  const refreshStakes = () => {
    console.log("Manual refresh triggered");
    if (address) {
      loadStakes();
    }
  };

  return { stakes, isLoading, refreshStakes };
}

/**
 * Get user stake count from contract
 */
export function useUserStakeCount() {
  const { address } = useAccount();
  // Note: The contract doesn't have a direct function to get stake count
  // We'll need to track this via events or Firestore
  // For now, return 0 as placeholder
  return 0n;
}

/**
 * Get user totals (principal and rewards)
 */
export function useUserTotals() {
  const { stakes } = useUserStakes();
  const [totals, setTotals] = useState({ principal: 0n, reward: 0n });

  useEffect(() => {
    const calculateTotals = async () => {
      let totalPrincipal = 0n;
      let totalReward = 0n;

      for (const stake of stakes) {
        if (stake.status === "active") {
          const principal = BigInt(stake.principal);
          totalPrincipal += principal;

          // Get current value from contract
          try {
            // We'll need to call previewValue for each stake
            // For now, we'll estimate based on time elapsed
            const now = Math.floor(Date.now() / 1000);
            const elapsed = now - stake.startTime;
            const daysElapsed = elapsed / 86400;
            const dailyRate = stake.dailyRateBps / 10000; // Convert basis points to decimal
            const estimatedReward = (principal * BigInt(Math.floor(daysElapsed * dailyRate * 10000))) / 10000n;
            totalReward += estimatedReward;
          } catch (error) {
            console.error("Error calculating reward for stake:", error);
          }
        }
      }

      setTotals({ principal: totalPrincipal, reward: totalReward });
    };

    if (stakes.length > 0) {
      calculateTotals();
    } else {
      setTotals({ principal: 0n, reward: 0n });
    }
  }, [stakes]);

  return totals;
}

/**
 * Get plan info (for compatibility with old code)
 */
export function usePlanInfo(planId?: string) {
  const [plan, setPlan] = useState<StakingPlan | null>(null);

  useEffect(() => {
    if (!planId) {
      setPlan(null);
      return;
    }

    const loadPlan = async () => {
      try {
        const stakingPlan = await getStakingPlanByPlanId(planId);
        setPlan(stakingPlan);
      } catch (error) {
        console.error("Error loading plan:", error);
      }
    };

    loadPlan();
  }, [planId]);

  return plan;
}

/**
 * Get APR from plan (for compatibility)
 */
export function useAPR(plan?: StakingPlan | string) {
  if (!plan) return 0;

  const planData = typeof plan === "string" ? null : plan;
  if (planData) {
    // Calculate APR from daily rate
    const dailyRate = planData.dailyRateBps / 10000; // Convert basis points to decimal
    const apr = dailyRate * 365 * 100; // Convert to percentage
    return apr;
  }

  return 0;
}
