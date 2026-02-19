/**
 * TokenPriceWidget
 * - NUMI: GeckoTerminal BSC 풀 실시간 가격 (무료, 키 불필요)
 * - BBAG: 미상장 → "N/A" 표시
 * - 5분 자동 갱신
 * - compact=true : 모바일 헤더 상단 ticker 바
 */
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";
import { getCachedNUMIPrice } from "@/lib/coinmarketcap";
import { Skeleton } from "@/components/ui/skeleton";

/** null = 아직 로딩 중, "n/a" = 가격 없음, number = 실제 가격 */
type PriceVal = number | null | "n/a";

interface TokenPrice {
  symbol: string;
  price: PriceVal;
  link?: string;
}

interface Props {
  compact?: boolean;
}

const REFRESH_MS = 5 * 60 * 1000;

function PriceLabel({ price, loading, compact = false }: { price: PriceVal; loading: boolean; compact?: boolean }) {
  const textCls = compact ? "text-[10px] font-bold" : "text-[11px] font-bold";
  const skelCls = compact ? "h-3 w-10" : "h-3.5 w-12";

  if (loading && price === null) return <Skeleton className={skelCls} />;
  if (price === null || price === "n/a") return <span className={`${textCls} text-muted-foreground`}>N/A</span>;
  return <span className={`${textCls} text-foreground`}>${price.toFixed(4)}</span>;
}

export function TokenPriceWidget({ compact = false }: Props) {
  const [prices, setPrices] = useState<TokenPrice[]>([
    { symbol: "NUMI", price: null, link: "https://www.geckoterminal.com/bsc/pools/0x39d2d7bebd1487ffea308fab8a6fe2d737600e1a" },
    { symbol: "BBAG", price: "n/a",  link: "https://www.binance.com" },
  ]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const numiPrice = await getCachedNUMIPrice();
      setPrices((prev) =>
        prev.map((p) =>
          p.symbol === "NUMI" ? { ...p, price: numiPrice ?? "n/a" } : p
        )
      );
      setLastUpdated(new Date());
    } catch (err) {
      console.warn("TokenPriceWidget refresh error:", err);
      setPrices((prev) =>
        prev.map((p) => (p.symbol === "NUMI" && p.price === null ? { ...p, price: "n/a" } : p))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  /* ── compact (모바일 헤더 상단) ── */
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {prices.map((token) => (
          <div key={token.symbol} className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-muted-foreground">{token.symbol}</span>
            <PriceLabel price={token.price} loading={loading} compact />
            {token.link && (
              <a href={token.link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <ExternalLink className="w-2 h-2" />
              </a>
            )}
          </div>
        ))}
        <button onClick={refresh} disabled={loading} className="text-muted-foreground hover:text-foreground disabled:opacity-40" aria-label="Refresh">
          <RefreshCw className={`w-2.5 h-2.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
    );
  }

  /* ── 일반 (데스크탑 네비 / Sheet) ── */
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="h-5 w-px bg-border/60 hidden lg:block" />

      {prices.map((token) => (
        <div key={token.symbol} className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground tracking-wide">{token.symbol}</span>
          <PriceLabel price={token.price} loading={loading} />
          {token.link && (
            <a href={token.link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      ))}

      <button onClick={refresh} disabled={loading} className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50" aria-label="Refresh prices">
        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
      </button>

      {lastUpdated && (
        <span className="text-[10px] text-muted-foreground hidden xl:block">
          {lastUpdated.toLocaleTimeString()}
        </span>
      )}

      <div className="h-5 w-px bg-border/60 hidden lg:block" />
    </div>
  );
}
