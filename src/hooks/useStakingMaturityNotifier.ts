/**
 * useStakingMaturityNotifier
 * Runs once when the user connects; checks active stakes and
 * fires a "staking_maturity" notification for any that unlock within
 * 3 days, 1 day, or have already unlocked (but not yet notified).
 *
 * De-duplication: localStorage key per stake+phase.
 */
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { getActiveUserStakes } from "@/lib/userStakes";
import { createNotification } from "@/lib/notifications";
import { formatUnits } from "viem";

const DAY_MS = 24 * 60 * 60 * 1000;

function notifiedKey(wallet: string, stakeId: number, phase: string) {
  return `staking_notified_${wallet.toLowerCase()}_${stakeId}_${phase}`;
}

export function useStakingMaturityNotifier() {
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (!isConnected || !address) return;

    let cancelled = false;

    const run = async () => {
      try {
        const stakes = await getActiveUserStakes(address);
        const now = Date.now();

        for (const stake of stakes) {
          if (cancelled) break;
          const unlockMs = stake.unlockTime * 1000;
          const timeLeft = unlockMs - now;
          const daysLeft = Math.ceil(timeLeft / DAY_MS);

          // Determine notification phase
          let phase: string | null = null;
          if (timeLeft <= 0) phase = "matured";
          else if (daysLeft <= 1) phase = "1d";
          else if (daysLeft <= 3) phase = "3d";

          if (!phase) continue;

          const key = notifiedKey(address, stake.stakeId, phase);
          if (localStorage.getItem(key)) continue;

          let principal = "0";
          try {
            principal = parseFloat(formatUnits(BigInt(stake.principal), 18)).toFixed(2);
          } catch {/* ignore */}

          let title: string;
          let message: string;

          if (phase === "matured") {
            title = "스테이킹 만기 도래 🎉";
            message = `${principal} USDT 스테이킹(#${stake.stakeId})이 만기되었습니다. 지금 인출하실 수 있습니다.`;
          } else if (phase === "1d") {
            title = "스테이킹 만기 1일 전 ⏰";
            message = `${principal} USDT 스테이킹(#${stake.stakeId})이 내일 만기됩니다.`;
          } else {
            title = "스테이킹 만기 3일 전 📅";
            message = `${principal} USDT 스테이킹(#${stake.stakeId})이 3일 후 만기됩니다.`;
          }

          await createNotification(address, "staking_maturity", title, message, "/staking");
          localStorage.setItem(key, "1");
        }
      } catch (err) {
        console.warn("StakingMaturityNotifier error:", err);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [isConnected, address]);
}
