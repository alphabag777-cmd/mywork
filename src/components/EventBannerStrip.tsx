/**
 * EventBannerStrip – 홈/프로필 최상단 이벤트 배너 (카운트다운 포함)
 * Firebase event_banners 컬렉션에서 활성 배너를 불러와 회전 표시.
 */

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ExternalLink, Clock } from "lucide-react";
import { EventBanner, getActiveEventBanners } from "@/lib/eventBanners";

function useCountdown(endsAt: number) {
  const calc = () => {
    if (!endsAt) return null;
    const diff = endsAt - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    const s = Math.floor(diff / 1000);
    return {
      d: Math.floor(s / 86400),
      h: Math.floor((s % 86400) / 3600),
      m: Math.floor((s % 3600) / 60),
      s: s % 60,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return time;
}

const CountdownChip = ({ endsAt }: { endsAt: number }) => {
  const t = useCountdown(endsAt);
  if (!t) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (t.d === 0 && t.h === 0 && t.m === 0 && t.s === 0)
    return <span className="text-xs font-mono text-red-400">종료됨</span>;
  return (
    <span className="flex items-center gap-1 text-xs font-mono tabular-nums">
      <Clock className="w-3 h-3 shrink-0" />
      {t.d > 0 && <span>{t.d}일 </span>}
      {pad(t.h)}:{pad(t.m)}:{pad(t.s)}
    </span>
  );
};

const BannerSlide = ({
  banner,
  onDismiss,
}: {
  banner: EventBanner;
  onDismiss: () => void;
}) => (
  <div
    className={`relative w-full bg-gradient-to-r ${banner.bgColor || "from-primary/20 to-primary/5"} border-b border-primary/20`}
  >
    <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
      {/* Left: text */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${banner.textColor || "text-foreground"}`}>
            {banner.title}
          </p>
          {banner.subtitle && (
            <p className="text-xs text-muted-foreground truncate">{banner.subtitle}</p>
          )}
        </div>
        {banner.endsAt > 0 && (
          <div className="shrink-0 hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-background/50 border border-border/40">
            <CountdownChip endsAt={banner.endsAt} />
          </div>
        )}
      </div>

      {/* Right: CTA + dismiss */}
      <div className="flex items-center gap-2 shrink-0">
        {banner.endsAt > 0 && (
          <div className="sm:hidden flex items-center gap-1 px-1.5 py-0.5 rounded bg-background/50 border border-border/40">
            <CountdownChip endsAt={banner.endsAt} />
          </div>
        )}
        {banner.ctaText && banner.ctaUrl && (
          <a
            href={banner.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {banner.ctaText}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        <button
          onClick={onDismiss}
          className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="배너 닫기"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  </div>
);

const DISMISSED_KEY = "alphabag_dismissed_banners";

export const EventBannerStrip = () => {
  const [banners, setBanners] = useState<EventBanner[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    getActiveEventBanners().then(setBanners).catch(() => {});
  }, []);

  const visible = banners.filter((b) => !dismissed.has(b.id));

  const dismiss = useCallback(
    (id: string) => {
      setDismissed((prev) => {
        const next = new Set(prev);
        next.add(id);
        try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next])); } catch {}
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (visible.length === 0) return;
    if (visible.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % visible.length), 6000);
    return () => clearInterval(id);
  }, [visible.length]);

  if (visible.length === 0) return null;

  const current = visible[idx % visible.length];

  return (
    <div className="relative">
      <BannerSlide banner={current} onDismiss={() => dismiss(current.id)} />
      {visible.length > 1 && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            onClick={() => setIdx((i) => (i - 1 + visible.length) % visible.length)}
            className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
          >
            <ChevronLeft className="w-3 h-3 text-muted-foreground" />
          </button>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {idx % visible.length + 1}/{visible.length}
          </span>
          <button
            onClick={() => setIdx((i) => (i + 1) % visible.length)}
            className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
          >
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
};

export default EventBannerStrip;
