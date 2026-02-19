/**
 * TokenPriceWidget
 * - NUMI 실시간 가격만 표시 (GeckoTerminal BSC 풀)
 * - 5분 자동 갱신
 * - compact=true : 모바일 헤더 상단 ticker 바
 */
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";
import { getCachedNUMIPrice } from "@/lib/coinmarketcap";
import { Skeleton } from "@/components/ui/skeleton";

type PriceVal = number | null | "n/a";

interface Props {
  compact?: boolean;
}

const REFRESH_MS = 5 * 60 * 1000;
const NUMI_LINK = "https://www.geckoterminal.com/bsc/pools/0x39d2d7bebd1487ffea308fab8a6fe2d737600e1a";

export function TokenPriceWidget({ compact = false }: Props) {
  const [price, setPrice] = useState<PriceVal>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getCachedNUMIPrice();
      setPrice(p ?? "n/a");
    } catch {
      setPrice((prev) => (prev === null ? "n/a" : prev));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const priceNode =
    loading && price === null ? (
      <Skeleton className={compact ? "h-3 w-10" : "h-3.5 w-12"} />
    ) : price === null || price === "n/a" ? (
      <span className={`${compact ? "text-[10px]" : "text-[11px]"} font-bold text-muted-foreground`}>N/A</span>
    ) : (
      <span className={`${compact ? "text-[10px]" : "text-[11px]"} font-bold text-foreground`}>
        ${price.toFixed(4)}
      </span>
    );

  /* ── compact (모바일 헤더 상단) ── */
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-semibold text-muted-foreground">NUMI</span>
        {priceNode}
        <a href={NUMI_LINK} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
          <ExternalLink className="w-2 h-2" />
        </a>
        <button onClick={refresh} disabled={loading} className="text-muted-foreground hover:text-foreground disabled:opacity-40 ml-1" aria-label="Refresh">
          <RefreshCw className={`w-2.5 h-2.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
    );
  }

  /* ── 일반 (데스크탑 네비 / Sheet) ── */
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-5 w-px bg-border/60 hidden lg:block mr-1" />
      <span className="text-[11px] font-semibold text-muted-foreground tracking-wide">NUMI</span>
      {priceNode}
      <a href={NUMI_LINK} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
        <ExternalLink className="w-2.5 h-2.5" />
      </a>
      <button onClick={refresh} disabled={loading} className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50" aria-label="Refresh prices">
        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
      </button>
      <div className="h-5 w-px bg-border/60 hidden lg:block ml-1" />
    </div>
  );
}
