/**
 * Wallet balance utilities
 * Functions to get wallet balances on BSC chain
 */

import { createPublicClient, http, formatUnits } from "viem";
import { bsc } from "viem/chains";
import { ERC20_ABI } from "./contract";

const BSC_RPC_URL = "https://bsc-dataseed1.binance.org/";

// Create public client for BSC
const publicClient = createPublicClient({
  chain: bsc,
  transport: http(BSC_RPC_URL),
});

/**
 * Get USDT balance for a wallet address on BSC
 */
export async function getUSDTBalance(walletAddress: string): Promise<string> {
  try {
    const USDT_CONTRACT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // USDT on BSC
    
    const balance = await publicClient.readContract({
      address: USDT_CONTRACT_ADDRESS as `0x${string}`,
      abi: ERC20_ABI as any,
      functionName: "balanceOf",
      args: [walletAddress as `0x${string}`],
    } as any);

    // USDT has 18 decimals on BSC
    return formatUnits(balance as bigint, 18);
  } catch (error) {
    console.error(`Error getting USDT balance for ${walletAddress}:`, error);
    return "0";
  }
}

/**
 * Get BNB balance for a wallet address on BSC
 */
export async function getBNBBalance(walletAddress: string): Promise<string> {
  try {
    const balance = await publicClient.getBalance({
      address: walletAddress as `0x${string}`,
    });

    return formatUnits(balance, 18);
  } catch (error) {
    console.error(`Error getting BNB balance for ${walletAddress}:`, error);
    return "0";
  }
}

/**
 * Get balances for multiple wallets
 */
export async function getWalletBalances(walletAddresses: string[]) {
  const balances = await Promise.all(
    walletAddresses.map(async (address) => {
      const [usdtBalance, bnbBalance] = await Promise.all([
        getUSDTBalance(address),
        getBNBBalance(address),
      ]);

      return {
        address,
        usdtBalance: parseFloat(usdtBalance).toFixed(2),
        bnbBalance: parseFloat(bnbBalance).toFixed(4),
      };
    })
  );

  return balances;
}

