/**
 * Token price fetching – uses Binance public API (no key required).
 * Falls back to CoinMarketCap if VITE_COINMARKETCAP_API_KEY is set.
 *
 * Binance ticker endpoint:
 *   GET https://api.binance.com/api/v3/ticker/price?symbol=NUMIUSDT
 */

/* ─── Binance ────────────────────────────────────────────────────────── */
const BINANCE_TICKER = "https://api.binance.com/api/v3/ticker/price";

async function fetchPriceFromBinance(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`${BINANCE_TICKER}?symbol=${symbol}USDT`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Binance ${res.status}`);
    const data = await res.json();
    const price = parseFloat(data.price);
    return isNaN(price) ? null : price;
  } catch (err) {
    console.warn(`Binance price fetch failed for ${symbol}:`, err);
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
 * Order: Binance → CoinMarketCap → null (no mock fallback).
 */
export async function fetchNUMIPrice(): Promise<number | null> {
  // 1. Try Binance (free, no key)
  const binancePrice = await fetchPriceFromBinance("NUMI");
  if (binancePrice !== null) return binancePrice;

  // 2. Try CoinMarketCap (needs API key)
  const cmcPrice = await fetchPriceFromCMC("NUMI");
  if (cmcPrice !== null) return cmcPrice;

  // 3. No price available
  console.warn("NUMI price unavailable from all sources.");
  return null;
}

/**
 * Fetch prices for multiple symbols.
 * Uses Binance for each symbol; falls back to CMC if available.
 */
export async function fetchPrices(
  symbols: string[]
): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  await Promise.all(
    symbols.map(async (sym) => {
      const price =
        (await fetchPriceFromBinance(sym)) ?? (await fetchPriceFromCMC(sym));
      if (price !== null) results[sym] = price;
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
