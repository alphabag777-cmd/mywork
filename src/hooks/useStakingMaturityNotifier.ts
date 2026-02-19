/**
 * useStakingMaturityNotifier
 * Runs once when the user connects; checks active stakes and
 * fires a "staking_reward" notification for any that unlock within
 * the next 24 h or have already unlocked (but not yet notified).
 *
 * De-duplication key: `staking_notified_<wallet>_<stakeId>` in localStorage.
 */
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { getActiveUserStakes } from "@/lib/userStakes";
import { createNotification } from "@/lib/notifications";
import { formatUnits } from "viem";

const NOTIFY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 h

function notifiedKey(wallet: string, stakeId: number) {
  return `staking_notified_${wallet.toLowerCase()}_${stakeId}`;
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
          const key = notifiedKey(address, stake.stakeId);

          // Already notified for this stake?
          if (localStorage.getItem(key)) continue;

          // Only notify if unlocked or unlocking within 24 h
          if (timeLeft > NOTIFY_WINDOW_MS) continue;

          let principal = "0";
          try {
            principal = parseFloat(formatUnits(BigInt(stake.principal), 18)).toFixed(2);
          } catch {/* ignore */}

          const isUnlocked = timeLeft <= 0;
          const title = isUnlocked
            ? "Staking Unlocked 🎉"
            : "Staking Unlocking Soon ⏰";
          const hoursLeft = Math.max(0, Math.floor(timeLeft / 3_600_000));
          const message = isUnlocked
            ? `Your stake of ${principal} USDT (ID #${stake.stakeId}) is now unlocked and ready to claim!`
            : `Your stake of ${principal} USDT (ID #${stake.stakeId}) unlocks in ~${hoursLeft}h. Get ready to claim.`;

          await createNotification(address, "staking_reward", title, message, "/staking");
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
