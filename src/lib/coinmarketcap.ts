/**
 * CoinMarketCap API integration for fetching NUMI token price
 */

const COINMARKETCAP_API_BASE = "https://pro-api.coinmarketcap.com/v1";
const NUMI_SYMBOL = "NUMI"; // Update this if NUMI has a different symbol on CoinMarketCap

// CoinMarketCap API Key (loaded from env so it is not committed)
// Define VITE_COINMARKETCAP_API_KEY in your `.env.local` file.
const COINMARKETCAP_API_KEY = import.meta.env.VITE_COINMARKETCAP_API_KEY || "";

export interface CoinMarketCapPrice {
  symbol: string;
  price: number;
  priceChange24h?: number;
  priceChangePercent24h?: number;
  lastUpdated: number;
}

/**
 * Fetch NUMI price from CoinMarketCap API
 * Returns price in USDT
 */
export async function fetchNUMIPrice(): Promise<number | null> {
  try {
    if (!COINMARKETCAP_API_KEY) {
      console.warn("CoinMarketCap API key not configured. Using fallback price.");
      // Fallback: Return a mock price for development
      // In production, this should throw an error or use a different price source
      return 0.26; // Mock price
    }

    // CoinMarketCap API endpoint for cryptocurrency quotes
    const url = `${COINMARKETCAP_API_BASE}/cryptocurrency/quotes/latest`;
    const params = new URLSearchParams({
      symbol: NUMI_SYMBOL,
      convert: "USDT",
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract price from CoinMarketCap response
    if (data.data && data.data[NUMI_SYMBOL] && data.data[NUMI_SYMBOL][0]) {
      const quote = data.data[NUMI_SYMBOL][0].quote?.USDT;
      if (quote && quote.price) {
        return quote.price;
      }
    }

    throw new Error("NUMI price not found in CoinMarketCap response");
  } catch (error) {
    console.error("Error fetching NUMI price from CoinMarketCap:", error);
    
    // Fallback: Return a mock price for development/testing
    // In production, you might want to return null or throw
    console.warn("Using fallback NUMI price");
    return 0.26; // Mock price - replace with actual fallback logic
  }
}

/**
 * Fetch multiple cryptocurrency prices
 */
export async function fetchPrices(symbols: string[]): Promise<Record<string, number>> {
  try {
    if (!COINMARKETCAP_API_KEY) {
      console.warn("CoinMarketCap API key not configured.");
      return {};
    }

    const url = `${COINMARKETCAP_API_BASE}/cryptocurrency/quotes/latest`;
    const params = new URLSearchParams({
      symbol: symbols.join(","),
      convert: "USDT",
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const data = await response.json();
    const prices: Record<string, number> = {};

    symbols.forEach((symbol) => {
      if (data.data && data.data[symbol] && data.data[symbol][0]) {
        const quote = data.data[symbol][0].quote?.USDT;
        if (quote && quote.price) {
          prices[symbol] = quote.price;
        }
      }
    });

    return prices;
  } catch (error) {
    console.error("Error fetching prices from CoinMarketCap:", error);
    return {};
  }
}

/**
 * Get NUMI price with caching (5 minute cache)
 */
let cachedPrice: { price: number; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedNUMIPrice(): Promise<number | null> {
  const now = Date.now();
  
  // Return cached price if still valid
  if (cachedPrice && (now - cachedPrice.timestamp) < CACHE_DURATION) {
    return cachedPrice.price;
  }

  // Fetch new price
  const price = await fetchNUMIPrice();
  
  if (price !== null) {
    cachedPrice = {
      price,
      timestamp: now,
    };
  }

  return price;
}
