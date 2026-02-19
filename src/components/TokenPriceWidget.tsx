/**
 * TokenPriceWidget
 * Shows NUMI / BBAG real-time prices.
 * - Reads from CoinMarketCap API if the key is configured.
 * - Falls back to the 0.26 USDT mock price when the key is absent.
 * - Auto-refreshes every 5 minutes.
 */
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";
import { getCachedNUMIPrice } from "@/lib/coinmarketcap";
import { Skeleton } from "@/components/ui/skeleton";

interface TokenPrice {
  symbol: string;
  price: number | null;
  change24h?: number;
  logoUrl?: string;
  link?: string;
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function TokenPriceWidget() {
  const [prices, setPrices] = useState<TokenPrice[]>([
    { symbol: "NUMI", price: null, link: "https://www.binance.com/en/trade/NUMI_USDT" },
    { symbol: "BBAG", price: null, link: "https://www.binance.com" },
  ]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const numiPrice = await getCachedNUMIPrice();
      setPrices((prev) =>
        prev.map((p) => (p.symbol === "NUMI" ? { ...p, price: numiPrice } : p))
      );
      setLastUpdated(new Date());
    } catch (err) {
      console.warn("TokenPriceWidget refresh error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <div className="flex items-center gap-3">
      {/* 구분선 */}
      <div className="h-5 w-px bg-border/60" />

      {prices.map((token) => (
        <div key={token.symbol} className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground tracking-wide">
            {token.symbol}
          </span>
          {loading || token.price === null ? (
            <Skeleton className="h-3.5 w-12" />
          ) : (
            <span className="text-[11px] font-bold text-foreground">
              ${token.price.toFixed(4)}
            </span>
          )}
          {token.link && (
            <a
              href={token.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      ))}

      {/* 새로고침 */}
      <button
        onClick={refresh}
        disabled={loading}
        className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        aria-label="Refresh prices"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
      </button>

      {/* 업데이트 시각 */}
      {lastUpdated && (
        <span className="text-[10px] text-muted-foreground hidden xl:block">
          {lastUpdated.toLocaleTimeString()}
        </span>
      )}

      {/* 구분선 */}
      <div className="h-5 w-px bg-border/60" />
    </div>
  );
}
