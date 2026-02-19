/**
 * TokenPriceWidget
 * Shows NUMI / BBAG real-time prices.
 * - Reads from CoinMarketCap API if the key is configured.
 * - Falls back to the 0.26 USDT mock price when the key is absent.
 * - Auto-refreshes every 5 minutes.
 */
import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, RefreshCw, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="flex items-center gap-2 flex-wrap">
      {prices.map((token) => (
        <Card key={token.symbol} className="border-border/50 bg-card/60 backdrop-blur">
          <CardContent className="py-1.5 px-3 flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground font-mono">{token.symbol}</span>
            {loading || token.price === null ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              <span className="text-xs font-bold text-foreground">
                ${token.price.toFixed(4)}
              </span>
            )}
            {token.link && (
              <a href={token.link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </CardContent>
        </Card>
      ))}
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refresh} disabled={loading}>
        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
      </Button>
      {lastUpdated && (
        <span className="text-xs text-muted-foreground hidden sm:block">
          {lastUpdated.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
