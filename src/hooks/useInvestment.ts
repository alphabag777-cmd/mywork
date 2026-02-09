import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useChainId } from "wagmi";
import { parseUnits, parseAbiItem, decodeEventLog, isAddress } from "viem";
import { INVESTMENT_CONTRACT_ADDRESS, USDT_CONTRACT_ADDRESS, INVESTMENT_ABI, ERC20_ABI, SEPARATE_INVESTMENT_CONTRACT_ADDRESS, SEPARATE_INVESTMENT_ABI, NEW_INVESTMENT_CONTRACT_ADDRESS, NEW_INVESTMENT_ABI } from "@/lib/contract";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";

// Get USDT token address from contract or use default
export function useUSDTToken() {
  const { data: tokenAddress } = useReadContract({
    address: INVESTMENT_CONTRACT_ADDRESS,
    abi: INVESTMENT_ABI,
    functionName: "USDT",
  });

  return (tokenAddress || USDT_CONTRACT_ADDRESS) as `0x${string}`;
}

export function useUSDTDecimals(tokenAddress?: `0x${string}`) {
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

export function useTokenAllowance(tokenAddress?: `0x${string}`, spenderAddress?: `0x${string}`) {
  const { address } = useAccount();
  const spender = spenderAddress || INVESTMENT_CONTRACT_ADDRESS;
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

// Approve USDT tokens
export function useApproveToken() {
  const { writeContract, isPending, isSuccess, error } = useWriteContract();

  const approve = (tokenAddress: `0x${string}`, amount: bigint, spender?: `0x${string}`) => {
    const approveAddress = spender || NEW_INVESTMENT_CONTRACT_ADDRESS;
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [approveAddress, amount],
    } as any);
  };

  return { approve, isPending, isSuccess, error };
}

// Invest function (legacy - kept for backward compatibility)
export function useInvest() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const invest = (amount: bigint) => {
    writeContract({
      address: INVESTMENT_CONTRACT_ADDRESS,
      abi: INVESTMENT_ABI,
      functionName: "invest",
      args: [amount],
    } as any);
  };

  return { invest, isPending, isConfirming, isSuccess, error, hash };
}

// Buy Node function - uses new contract buyNode with wallet address
export function useBuyNode() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const buyNode = (nodeId: number, amount: bigint, payWallet: `0x${string}`) => {
    if (!isAddress(payWallet)) {
      throw new Error("Invalid wallet address");
    }
    writeContract({
      address: NEW_INVESTMENT_CONTRACT_ADDRESS,
      abi: NEW_INVESTMENT_ABI,
      functionName: "buyNode",
      args: [nodeId, amount, payWallet],
    } as any);
  };

  return { buyNode, isPending, isConfirming, isSuccess, error, hash };
}

// Invest Split function - uses new contract investSplit with three wallets and percentages
export function useInvestSplit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const investSplit = (
    amount: bigint,
    walletA: `0x${string}`,
    walletB: `0x${string}`,
    walletC: `0x${string}`,
    pA: number,
    pB: number,
    pC: number
  ) => {
    console.log("investSplit function called with:", {
      amount: amount.toString(),
      walletA,
      walletB,
      walletC,
      pA,
      pB,
      pC,
    });
    
    if (!isAddress(walletA) || !isAddress(walletB) || !isAddress(walletC)) {
      console.error("Invalid wallet addresses:", { walletA, walletB, walletC });
      throw new Error("Invalid wallet address");
    }
    
    // Convert percentages to basis points (multiply by 100)
    const pABP = BigInt(Math.floor(pA * 10));
    const pBBP = BigInt(Math.floor(pB * 10));
    const pCBP = BigInt(Math.floor(pC * 10));
    
    console.log("investSplit - calling writeContract with:", {
      address: NEW_INVESTMENT_CONTRACT_ADDRESS,
      amount: amount.toString(),
      walletA,
      walletB,
      walletC,
      pABP: pABP.toString(),
      pBBP: pBBP.toString(),
      pCBP: pCBP.toString(),
    });
    
    writeContract({
      address: NEW_INVESTMENT_CONTRACT_ADDRESS,
      abi: NEW_INVESTMENT_ABI,
      functionName: "investSplit",
      args: [amount, walletA, walletB, walletC, pABP, pBBP, pCBP],
    } as any);
  };

  return { investSplit, isPending, isConfirming, isSuccess, error, hash };
}

// Get user's node
export function useMyNode() {
  const { address } = useAccount();
  const { data: nodeData } = useReadContract({
    address: INVESTMENT_CONTRACT_ADDRESS,
    abi: INVESTMENT_ABI,
    functionName: "myNode",
    query: {
      enabled: !!address,
    },
  });

  return nodeData;
}

// Get node info
export function useNodeInfo(nodeId: number) {
  const { data: nodeInfo } = useReadContract({
    address: INVESTMENT_CONTRACT_ADDRESS,
    abi: INVESTMENT_ABI,
    functionName: "nodes",
    args: [nodeId],
  });

  return nodeInfo;
}

// Get user's node by address
export function useUserNode(userAddress?: `0x${string}`) {
  const { address } = useAccount();
  const targetAddress = userAddress || address;
  
  const { data: userNode } = useReadContract({
    address: INVESTMENT_CONTRACT_ADDRESS,
    abi: INVESTMENT_ABI,
    functionName: "getUserNode",
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress,
    },
  });

  return userNode;
}

// Get user's total investment by address
export function useUserInvestment(userAddress?: `0x${string}`) {
  const { address } = useAccount();
  const targetAddress = userAddress || address;
  const usdtToken = useUSDTToken();
  const decimals = useUSDTDecimals(usdtToken);
  
  const { data: investment } = useReadContract({
    address: INVESTMENT_CONTRACT_ADDRESS,
    abi: INVESTMENT_ABI,
    functionName: "getUserInvestment",
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress,
    },
  });

  return { investment, decimals };
}

// Get user's volume from NEW_INVESTMENT_CONTRACT
export function useUserVolume(userAddress?: `0x${string}`) {
  const { address } = useAccount();
  const targetAddress = userAddress || address;
  const usdtToken = useUSDTToken();
  const decimals = useUSDTDecimals(usdtToken);
  
  const { data: volume } = useReadContract({
    address: NEW_INVESTMENT_CONTRACT_ADDRESS,
    abi: NEW_INVESTMENT_ABI,
    functionName: "userVolume",
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress,
    },
  });

  return { volume, decimals };
}

// Check if user has invested in the separate investment contract
export function useSeparateInvestment(userAddress?: `0x${string}`) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const targetAddress = userAddress || address;
  const [hasInvested, setHasInvested] = useState(false);
  const [investments, setInvestments] = useState<Array<{
    investId: bigint;
    tokenAddress: string;
    amount: bigint;
    transactionHash?: string;
    blockNumber?: bigint;
    timestamp?: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!targetAddress || !publicClient) {
      setHasInvested(false);
      setInvestments([]);
      return;
    }

    const checkInvestments = async () => {
      setIsLoading(true);
      try {
        const currentBlock = await publicClient.getBlockNumber();
        // Read from contract deployment (block 0) to get ALL historical transactions
        // For NEW_INVESTMENT_CONTRACT, we'll read from block 0
        // For SEPARATE_INVESTMENT_CONTRACT, we'll also try from block 0, but may need to limit if too slow
        const fromBlock = 0n; // Read from contract deployment to get all transactions
        
        const allInvestments: Array<{
          investId: bigint;
          tokenAddress: string;
          amount: bigint;
          transactionHash?: string;
          blockNumber?: bigint;
          timestamp?: number;
        }> = [];

        // 1. Get UserInvest events from SEPARATE_INVESTMENT_CONTRACT
        try {
          const separateLogs = await publicClient.getLogs({
            address: SEPARATE_INVESTMENT_CONTRACT_ADDRESS,
            event: parseAbiItem("event UserInvest(address userAddress, uint256 investId, address tokenAddress, uint256 amount)"),
            fromBlock,
            toBlock: currentBlock,
          });

          // Process SEPARATE_INVESTMENT_CONTRACT logs
          for (const log of separateLogs) {
            try {
              let userAddress: string | undefined;
              let investId: bigint | undefined;
              let tokenAddress: string | undefined;
              let amount: bigint | undefined;

              if ((log as any).args && (log as any).args.userAddress) {
                userAddress = (log as any).args.userAddress;
                investId = (log as any).args.investId;
                tokenAddress = (log as any).args.tokenAddress;
                amount = (log as any).args.amount;
              } else {
                const rawLog = log as any;
                if (rawLog.data && rawLog.topics) {
                  const decoded: any = decodeEventLog({
                    abi: SEPARATE_INVESTMENT_ABI,
                    data: rawLog.data,
                    topics: rawLog.topics,
                  } as any);
                  const decodedArgs = decoded?.args;
                  if (decodedArgs) {
                    userAddress = decodedArgs.userAddress;
                    investId = decodedArgs.investId;
                    tokenAddress = decodedArgs.tokenAddress;
                    amount = decodedArgs.amount;
                  }
                }
              }

              if (userAddress?.toLowerCase() === targetAddress.toLowerCase()) {
                // Get block timestamp
                let timestamp: number | undefined;
                try {
                  const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
                  timestamp = Number(block.timestamp) * 1000; // Convert to milliseconds
                } catch (e) {
                  console.warn("Failed to get block timestamp:", e);
                }

                allInvestments.push({
                  investId: investId || 0n,
                  tokenAddress: tokenAddress || "",
                  amount: amount || 0n,
                  transactionHash: log.transactionHash,
                  blockNumber: log.blockNumber,
                  timestamp,
                });
              }
            } catch (e) {
              continue;
            }
          }
        } catch (error) {
          console.warn("Error reading SEPARATE_INVESTMENT_CONTRACT events:", error);
        }

        // 2. Get SplitInvested events from NEW_INVESTMENT_CONTRACT (0xAA01B013E7dB427dF2d00AEAa49a9F7417e3BA97)
        // This is the main contract for investSplit function
        try {
          // Try to get logs with indexed user filter first (more efficient)
          let splitLogs: any[] = [];
          try {
            splitLogs = await publicClient.getLogs({
              address: NEW_INVESTMENT_CONTRACT_ADDRESS,
              event: parseAbiItem("event SplitInvested(address indexed user, uint256 amount, address walletA, address walletB, address walletC, uint256 shareA, uint256 shareB, uint256 shareC)"),
              fromBlock: 0n, // Read from contract deployment
              toBlock: currentBlock,
              args: {
                user: targetAddress as `0x${string}`,
              },
            });
          } catch (indexedError) {
            // If indexed filter fails, get all logs and filter client-side
            console.warn("Indexed filter failed, fetching all SplitInvested events:", indexedError);
            const allSplitLogs = await publicClient.getLogs({
              address: NEW_INVESTMENT_CONTRACT_ADDRESS,
              event: parseAbiItem("event SplitInvested(address indexed user, uint256 amount, address walletA, address walletB, address walletC, uint256 shareA, uint256 shareB, uint256 shareC)"),
              fromBlock: 0n, // Read from contract deployment
              toBlock: currentBlock,
            });
            
            // Filter by user address
            splitLogs = allSplitLogs.filter((log: any) => {
              const user = log.args?.user;
              return user && user.toLowerCase() === targetAddress.toLowerCase();
            });
          }

          // Process SplitInvested logs
          for (const log of splitLogs) {
            try {
              let userAddress: string | undefined;
              let amount: bigint | undefined;

              if ((log as any).args && (log as any).args.user) {
                userAddress = (log as any).args.user;
                amount = (log as any).args.amount;
              } else {
                const rawLog = log as any;
                if (rawLog.data && rawLog.topics) {
                  const decoded: any = decodeEventLog({
                    abi: NEW_INVESTMENT_ABI,
                    data: rawLog.data,
                    topics: rawLog.topics,
                  } as any);
                  const decodedArgs = decoded?.args;
                  if (decodedArgs) {
                    userAddress = decodedArgs.user;
                    amount = decodedArgs.amount;
                  }
                }
              }

              if (userAddress?.toLowerCase() === targetAddress.toLowerCase() && amount) {
                // Get block timestamp
                let timestamp: number | undefined;
                try {
                  const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
                  timestamp = Number(block.timestamp) * 1000;
                } catch (e) {
                  console.warn("Failed to get block timestamp:", e);
                }

                // Create a unique investId from transaction hash
                const investId = BigInt(`0x${log.transactionHash.slice(2, 10)}`);

                allInvestments.push({
                  investId,
                  tokenAddress: USDT_CONTRACT_ADDRESS, // SplitInvested uses USDT
                  amount,
                  transactionHash: log.transactionHash,
                  blockNumber: log.blockNumber,
                  timestamp,
                });
              }
            } catch (e) {
              continue;
            }
          }
        } catch (error) {
          console.warn("Error reading NEW_INVESTMENT_CONTRACT SplitInvested events:", error);
        }

        // Sort by block number (oldest first) or timestamp
        allInvestments.sort((a, b) => {
          if (a.timestamp && b.timestamp) {
            return a.timestamp - b.timestamp;
          }
          if (a.blockNumber && b.blockNumber) {
            return Number(a.blockNumber - b.blockNumber);
          }
          return 0;
        });

        if (allInvestments.length > 0) {
          setHasInvested(true);
          setInvestments(allInvestments.filter(inv => inv.amount && inv.amount > 0n));
        } else {
          setHasInvested(false);
          setInvestments([]);
        }
      } catch (error) {
        console.error("Error checking separate investments:", error);
        setHasInvested(false);
        setInvestments([]);
      } finally {
        setIsLoading(false);
      }
    };

    checkInvestments();
  }, [targetAddress, publicClient, chainId]);

  return { hasInvested, investments, isLoading };
}

