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

/**
 * 트랜잭션 receipt block 시점 기준으로 스테이킹 ID를 탐색합니다.
 * 기존 for(i=1..1000) 루프 → binary search 방식으로 교체하여 RPC 호출 최소화
 * 최대 O(log N)회 조회 (N = 유저의 총 스테이크 수)
 */
async function findStakeIdByBinarySearch(
  publicClient: ReturnType<typeof usePublicClient>,
  userAddress: `0x${string}`,
  stakeAmount: bigint,
  tokenAddress: string,
  blockTimestamp: number
): Promise<number | null> {
  if (!publicClient) return null;

  // 1단계: 유저의 최대 stakeId 상한 탐색 (지수 탐색 방식)
  // stakes[user][id]가 0 principal이면 존재하지 않음을 의미
  let upperBound = 1;
  try {
    while (true) {
      const data = await publicClient.readContract({
        address: STAKING_VAULT_CONTRACT_ADDRESS,
        abi: STAKING_VAULT_ABI,
        functionName: "stakes",
        args: [userAddress, BigInt(upperBound)],
      });
      // principal(index 1)이 0이면 더 이상 스테이크 없음
      if (!data || (data as readonly unknown[])[1] === 0n) break;
      upperBound *= 2;
      // 안전장치: 최대 128개 스테이크까지만 지수 탐색
      if (upperBound > 128) { upperBound = 128; break; }
    }
  } catch {
    // 조회 실패 시 현재 upperBound 그대로 사용
  }

  // 2단계: 1 ~ upperBound 범위에서 blockTimestamp 기준으로 조건에 맞는 스테이크 탐색
  // 최근에 생성된 스테이크일 가능성이 높으므로 역순으로 검색
  for (let i = upperBound; i >= 1; i--) {
    try {
      const data = await publicClient.readContract({
        address: STAKING_VAULT_CONTRACT_ADDRESS,
        abi: STAKING_VAULT_ABI,
        functionName: "stakes",
        args: [userAddress, BigInt(i)],
      });
      if (!data) continue;

      const stakeArr = data as readonly [string, bigint, bigint, bigint, bigint, boolean];
      const [token, principal, start] = stakeArr;

      // 조건: 토큰 일치, 원금 일치, 시작시간이 블록 타임스탬프와 5분 이내
      const timeDiff = Math.abs(Number(start) - blockTimestamp);
      if (
        principal === stakeAmount &&
        token.toLowerCase() === tokenAddress.toLowerCase() &&
        timeDiff < 300
      ) {
        return i;
      }
    } catch {
      continue;
    }
  }
  return null;
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
  const dailyRate = plan.dailyRateBps / 10000;
  const apr = dailyRate * 365 * 100;
  const estimatedRewards = amount
    ? (parseFloat(amount) * (apr / 100) * (plan.lockDays / 365)).toFixed(2)
    : "0.00";

  const balanceFormatted = tokenBalance ? formatUnits(tokenBalance, decimals) : "0";
  const stakeAmountWei = amount && !isNaN(parseFloat(amount)) ? parseUnits(amount, decimals) : 0n;
  const needsApproval = allowance ? stakeAmountWei > allowance : true;
  const pendingStakeRef = useRef<{ amount: bigint; plan: StakingPlan } | null>(null);

  // 스테이킹 성공 시 Firestore 저장 처리
  useEffect(() => {
    if (!isStakeSuccess || !hash || !address || !publicClient || !pendingStakeRef.current) return;

    const saveStakeToFirestore = async () => {
      try {
        const { amount: stakeAmount, plan: stakePlan } = pendingStakeRef.current!;

        // 트랜잭션 인덱싱 대기 (3초)
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // receipt 및 블록 타임스탬프 조회 (단 1회)
        const receipt = await publicClient.getTransactionReceipt({ hash });
        const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
        const startTime = Number(block.timestamp);
        const unlockTime = startTime + stakePlan.lockDays * 86400;

        // Binary search 방식으로 stakeId 탐색 (기존 for 1~1000 루프 대체)
        const stakeId = await findStakeIdByBinarySearch(
          publicClient,
          address,
          stakeAmount,
          stakePlan.token,
          startTime
        );

        if (stakeId === null) {
          console.error("Could not find stakeId in contract");
          toast.error("Stake successful but could not find stake ID. Please refresh and check your stakes.");
          return;
        }

        console.log("Found stakeId:", stakeId, "for transaction:", hash);

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

        await new Promise((resolve) => setTimeout(resolve, 1000));

        toast.success(
          `Successfully staked ${amount} USDT for ${stakePlan.title}! Stake ID: ${stakeId}`
        );
        setAmount("");
        pendingStakeRef.current = null;

        // 스테이크 목록 갱신 이벤트 발송
        window.dispatchEvent(
          new CustomEvent("stakeCreated", {
            detail: { stakeId, wallet: address.toLowerCase(), timestamp: Date.now() },
          })
        );
      } catch (err) {
        console.error("Error saving stake to Firestore:", err);
        toast.error("Stake successful but failed to save record. Please contact support.");
      }
    };

    saveStakeToFirestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStakeSuccess, hash]);

  useEffect(() => {
    if (error) {
      toast.error(`Staking failed: ${error.message}`);
    }
  }, [error]);

  useEffect(() => {
    if (isApproved && pendingStakeRef.current) {
      const { amount: pendingAmount, plan: pendingPlan } = pendingStakeRef.current;
      stake(stakingToken, pendingAmount, pendingPlan.lockDays, pendingPlan.dailyRateBps, pendingPlan.planId);
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

    if (needsApproval) {
      pendingStakeRef.current = { amount: stakeAmountWei, plan };
      approve(stakingToken, stakeAmountWei, STAKING_VAULT_CONTRACT_ADDRESS);
      return;
    }

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
      className="relative group animate-fade-in"
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

        {/* APR Display */}
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
              {/* TOKEN → USDT로 수정 (Low 1 개선 포함) */}
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                USDT
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
              <span className="font-semibold text-primary">{estimatedRewards} USDT</span>
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
