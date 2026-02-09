/**
 * Utility to sync stakes from contract to Firestore
 * This can be used to manually sync existing stakes that weren't saved during staking
 */

import { createPublicClient, http } from "viem";
import { bsc } from "viem/chains";
import { STAKING_VAULT_CONTRACT_ADDRESS, STAKING_VAULT_ABI } from "./contract";
import { createUserStake, getUserStake } from "./userStakes";
import { getStakingPlanByPlanId } from "./stakingPlans";

// Use BSC public RPC endpoint that doesn't have CORS issues
const BSC_RPC_URL = "https://bsc-dataseed1.binance.org/";

const publicClient = createPublicClient({
  chain: bsc,
  transport: http(BSC_RPC_URL),
});

/**
 * Sync a specific stake from contract to Firestore
 */
export async function syncStakeFromContract(
  wallet: string,
  stakeId: number,
  planId?: string
): Promise<boolean> {
  try {
    // Check if already exists in Firestore
    const existing = await getUserStake(wallet, stakeId);
    if (existing) {
      console.log(`Stake ${stakeId} already exists in Firestore`);
      return true;
    }

    // Query contract for stake data
    const stakeData = await publicClient.readContract({
      address: STAKING_VAULT_CONTRACT_ADDRESS,
      abi: STAKING_VAULT_ABI,
      functionName: "stakes",
      args: [wallet as `0x${string}`, BigInt(stakeId)],
    } as any);

    if (!stakeData || stakeData[5] === true) {
      // Stake doesn't exist or is withdrawn
      console.log(`Stake ${stakeId} not found or already withdrawn`);
      return false;
    }

    // Extract stake data
    const token = stakeData[0] as `0x${string}`;
    const principal = stakeData[1] as bigint;
    const startTime = Number(stakeData[2] as bigint);
    const unlockTime = Number(stakeData[3] as bigint);
    const rateBps = Number(stakeData[4] as bigint);
    const withdrawn = stakeData[5] as boolean;

    // Try to find planId if not provided
    let finalPlanId = planId;
    if (!finalPlanId) {
      // Try to match by token and rateBps
      // This is a fallback - ideally planId should be provided
      const allPlans = await import("./stakingPlans").then(m => m.getAllStakingPlans());
      const matchingPlan = allPlans.find(
        p => p.token.toLowerCase() === token.toLowerCase() && p.dailyRateBps === rateBps
      );
      if (matchingPlan) {
        finalPlanId = matchingPlan.planId;
      } else {
        finalPlanId = `unknown_${token.slice(0, 6)}`;
      }
    }

    // Calculate lockDays from start and unlock time
    const lockDays = Math.floor((unlockTime - startTime) / 86400);

    // Save to Firestore
    await createUserStake({
      wallet,
      stakeId,
      planId: finalPlanId,
      token,
      principal: principal.toString(),
      lockDays,
      dailyRateBps: rateBps,
      startTime,
      unlockTime,
      txHash: "synced", // Mark as synced
      status: withdrawn ? "withdrawn" : "active",
    });

    console.log(`Successfully synced stake ${stakeId} to Firestore`);
    return true;
  } catch (error) {
    console.error(`Error syncing stake ${stakeId}:`, error);
    return false;
  }
}

/**
 * Sync all stakes for a user from contract to Firestore
 */
export async function syncAllUserStakes(wallet: string): Promise<number> {
  let syncedCount = 0;
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 10; // Stop after 10 consecutive errors (likely no more stakes)
  
  // Check stakes starting from ID 1
  for (let i = 1; i <= 1000; i++) {
    try {
      const stakeData = await publicClient.readContract({
        address: STAKING_VAULT_CONTRACT_ADDRESS,
        abi: STAKING_VAULT_ABI,
        functionName: "stakes",
        args: [wallet as `0x${string}`, BigInt(i)],
      } as any);

      if (stakeData && stakeData[1] > 0n) {
        // Stake exists, sync it
        consecutiveErrors = 0; // Reset error counter
        const success = await syncStakeFromContract(wallet, i);
        if (success) {
          syncedCount++;
        }
      } else {
        // No stake at this ID, increment error counter
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          // Likely no more stakes, stop checking
          console.log(`Stopped syncing after ${i} checks (${consecutiveErrors} consecutive empty stakes)`);
          break;
        }
      }
    } catch (error) {
      consecutiveErrors++;
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.log(`Stopped syncing due to ${consecutiveErrors} consecutive errors`);
        break;
      }
      // Continue to next stake ID
      continue;
    }
  }

  return syncedCount;
}
