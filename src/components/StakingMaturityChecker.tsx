import { useStakingMaturityNotifier } from "@/hooks/useStakingMaturityNotifier";

/**
 * Side-effect only component: checks staking maturity on mount.
 * Mount once in App.tsx (inside WalletProvider scope).
 */
export const StakingMaturityChecker = () => {
  useStakingMaturityNotifier();
  return null;
};
