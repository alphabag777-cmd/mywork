/**
 * Wallet Transfer utilities
 * Functions to get USDT transfers from user wallet to specific wallet addresses using Moralis API
 */

const USDT_CONTRACT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955" as const;
const MORALIS_API_BASE = "https://deep-index.moralis.io/api/v2.2";
// Moralis API key is read from Vite env so it is not committed.
// Define VITE_MORALIS_API_KEY in your `.env.local` file.
const MORALIS_API_KEY = import.meta.env.VITE_MORALIS_API_KEY || "";

export interface USDTTransfer {
  transactionHash: string;
  amount: string; // Formatted amount in USDT
  amountRaw: string; // Raw amount in wei
  blockNumber: string;
  timestamp: number;
  fromAddress: string;
  toAddress: string;
}

interface MoralisTransferResponse {
  token_name: string;
  token_symbol: string;
  token_logo: string;
  token_decimals: string;
  from_address_entity: string | null;
  from_address_entity_logo: string | null;
  from_address: string;
  from_address_label: string | null;
  to_address_entity: string | null;
  to_address_entity_logo: string | null;
  to_address: string;
  to_address_label: string | null;
  address: string;
  block_hash: string;
  block_number: string;
  block_timestamp: string;
  transaction_hash: string;
  transaction_index: number;
  log_index: number;
  value: string;
  possible_spam: boolean;
  value_decimal: string;
  verified_contract: boolean;
  security_score: number;
}

interface MoralisApiResponse {
  total: number;
  page: number;
  page_size: number;
  cursor: string | null;
  result: MoralisTransferResponse[];
}

/**
 * Get all USDT transfers to a specific wallet address from Moralis API
 * Then filter by user's wallet address
 */
export async function getUSDTTransfers(
  userWallet: string,
  targetWallet: string
): Promise<USDTTransfer[]> {
  try {
    const normalizedUserWallet = userWallet.toLowerCase();
    const normalizedTargetWallet = targetWallet.toLowerCase();
    const transfers: USDTTransfer[] = [];

    // Call Moralis API to get all USDT transfers TO the target wallet
    const url = `${MORALIS_API_BASE}/${normalizedTargetWallet}/erc20/transfers?chain=bsc&contract_addresses=${USDT_CONTRACT_ADDRESS}`;
    
    console.log(`Fetching USDT transfers to wallet ${normalizedTargetWallet} from Moralis API...`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${MORALIS_API_KEY}`,
        'X-API-Key': MORALIS_API_KEY,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Moralis API error: ${response.status} ${response.statusText}`);
    }

    const data: MoralisApiResponse = await response.json();
    
    // Filter transfers where from_address matches user's wallet
    const userTransfers = data.result.filter(
      (transfer) => transfer.from_address.toLowerCase() === normalizedUserWallet
    );

    console.log(`Found ${userTransfers.length} USDT transfers from user wallet to target wallet`);

    // Convert Moralis response to our format
    for (const transfer of userTransfers) {
      const timestamp = new Date(transfer.block_timestamp).getTime();
      
      transfers.push({
        transactionHash: transfer.transaction_hash,
        amount: transfer.value_decimal, // Already formatted decimal value
        amountRaw: transfer.value, // Raw value in wei
        blockNumber: transfer.block_number,
        timestamp,
        fromAddress: transfer.from_address,
        toAddress: transfer.to_address,
      });
    }

    // Sort by timestamp (newest first)
    transfers.sort((a, b) => b.timestamp - a.timestamp);

    return transfers;
  } catch (error) {
    console.error(`Error getting USDT transfers for ${userWallet} to ${targetWallet}:`, error);
    return [];
  }
}

/**
 * Get total USDT amount sent to a specific wallet
 */
export async function getTotalInvestment(
  userWallet: string,
  targetWallet: string
): Promise<number> {
  try {
    const transfers = await getUSDTTransfers(userWallet, targetWallet);
    const total = transfers.reduce((sum, transfer) => {
      return sum + Number(transfer.amount);
    }, 0);
    return total;
  } catch (error) {
    console.error(`Error calculating total investment for ${userWallet} to ${targetWallet}:`, error);
    return 0;
  }
}
