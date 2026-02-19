/**
 * Token price fetching
 *
 * NUMI는 BSC DEX 전용 토큰으로 Binance/CoinGecko 메인 API에 미등록.
 * GeckoTerminal Public API (무료, 키 불필요) 로 PancakeSwap V3 풀을 직접 조회.
 *
 * 우선순위:
 *   1. GeckoTerminal  – BSC PancakeSwap V3 NUMI/USDT 풀
 *   2. CoinMarketCap  – VITE_COINMARKETCAP_API_KEY 설정 시만 사용
 *
 * Pool:    0x39d2d7bebd1487ffea308fab8a6fe2d737600e1a
 * Network: bsc
 */

/* ─── GeckoTerminal ──────────────────────────────────────────────────── */
const GT_BASE = "https://api.geckoterminal.com/api/v2";
const NUMI_NETWORK = "bsc";
const NUMI_POOL = "0x39d2d7bebd1487ffea308fab8a6fe2d737600e1a";

async function fetchPriceFromGeckoTerminal(): Promise<number | null> {
  try {
    const url = `${GT_BASE}/networks/${NUMI_NETWORK}/pools/${NUMI_POOL}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`GeckoTerminal ${res.status}`);
    const data = await res.json();
    const price = parseFloat(data?.data?.attributes?.base_token_price_usd ?? "");
    if (!isNaN(price) && price > 0) {
      console.info(`[TokenPrice] GeckoTerminal NUMI: $${price}`);
      return price;
    }
    throw new Error("GeckoTerminal: price field missing");
  } catch (err) {
    console.warn("GeckoTerminal price fetch failed:", err);
    return null;
  }
}

/* ─── CoinMarketCap (optional fallback) ─────────────────────────────── */
const CMC_BASE = "https://pro-api.coinmarketcap.com/v1";
const CMC_KEY = import.meta.env.VITE_COINMARKETCAP_API_KEY || "";

async function fetchPriceFromCMC(symbol: string): Promise<number | null> {
  if (!CMC_KEY) return null;
  try {
    const url = `${CMC_BASE}/cryptocurrency/quotes/latest?symbol=${symbol}&convert=USDT`;
    const res = await fetch(url, {
      headers: { "X-CMC_PRO_API_KEY": CMC_KEY, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`CMC ${res.status}`);
    const data = await res.json();
    const quote = data?.data?.[symbol]?.[0]?.quote?.USDT;
    return quote?.price ?? null;
  } catch (err) {
    console.warn(`CMC price fetch failed for ${symbol}:`, err);
    return null;
  }
}

/* ─── Public interface ───────────────────────────────────────────────── */
export interface CoinMarketCapPrice {
  symbol: string;
  price: number;
  priceChange24h?: number;
  priceChangePercent24h?: number;
  lastUpdated: number;
}

/**
 * Fetch NUMI price.
 * Order: GeckoTerminal (BSC pool) → CoinMarketCap → null
 */
export async function fetchNUMIPrice(): Promise<number | null> {
  // 1. GeckoTerminal – BSC PancakeSwap V3 풀 직접 조회 (무료, 키 불필요)
  const gtPrice = await fetchPriceFromGeckoTerminal();
  if (gtPrice !== null) return gtPrice;

  // 2. CoinMarketCap fallback (API 키 설정 시만)
  const cmcPrice = await fetchPriceFromCMC("NUMI");
  if (cmcPrice !== null) return cmcPrice;

  console.warn("NUMI price unavailable from all sources.");
  return null;
}

/**
 * Fetch prices for multiple symbols.
 * NUMI → GeckoTerminal, others → CMC.
 */
export async function fetchPrices(
  symbols: string[]
): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  await Promise.all(
    symbols.map(async (sym) => {
      const price =
        sym.toUpperCase() === "NUMI"
          ? ((await fetchPriceFromGeckoTerminal()) ?? (await fetchPriceFromCMC(sym)))
          : (await fetchPriceFromCMC(sym));
      if (price !== null) results[sym.toUpperCase()] = price;
    })
  );
  return results;
}

/* ─── Cache (5 min TTL) ──────────────────────────────────────────────── */
let cachedPrice: { price: number; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

export async function getCachedNUMIPrice(): Promise<number | null> {
  const now = Date.now();
  if (cachedPrice && now - cachedPrice.timestamp < CACHE_DURATION) {
    return cachedPrice.price;
  }
  const price = await fetchNUMIPrice();
  if (price !== null) cachedPrice = { price, timestamp: now };
  return price;
}

export function clearNUMIPriceCache(): void {
  cachedPrice = null;
}
