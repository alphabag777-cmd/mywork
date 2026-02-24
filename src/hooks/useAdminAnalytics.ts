import { useState, useEffect, useCallback, useRef } from "react";
import { getAllUsers } from "@/lib/users";
import { getAllUserInvestments } from "@/lib/userInvestments";
import { subscribeAllTickets } from "@/lib/support";
import { format, subDays, startOfDay, isSameDay } from "date-fns";

export interface DailyVolume {
  date: string;
  amount: number;
}

export interface Performer {
  wallet: string;
  totalInvestment: number;
  referralCount: number;
}

export interface CategoryBreakdown {
  name: string;
  value: number;
}

// ─── Module-level cache (페이지 이동해도 유지, 10분 TTL) ─────────────────────
interface CacheEntry {
  stats: ReturnType<typeof buildEmptyStats>;
  dailyVolume: DailyVolume[];
  topPerformers: Performer[];
  categoryBreakdown: CategoryBreakdown[];
  fetchedAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10분
let _cache: CacheEntry | null = null;

function buildEmptyStats() {
  return {
    totalSales:    0,
    totalUsers:    0,
    activeUsers:   0,
    totalReferrals: 0,
    openTickets:   0,
  };
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export const useAdminAnalytics = () => {
  // 캐시가 있으면 초기 상태를 캐시로 설정 → 화면이 즉시 렌더됨
  const hasFreshCache = _cache && Date.now() - _cache.fetchedAt < CACHE_TTL_MS;

  const [stats, setStats]                     = useState(hasFreshCache ? _cache!.stats : buildEmptyStats());
  const [dailyVolume, setDailyVolume]         = useState<DailyVolume[]>(hasFreshCache ? _cache!.dailyVolume : []);
  const [topPerformers, setTopPerformers]     = useState<Performer[]>(hasFreshCache ? _cache!.topPerformers : []);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>(hasFreshCache ? _cache!.categoryBreakdown : []);
  // 캐시 있으면 loading=false → "Loading Analytics..." 스피너 안 보임
  const [loading, setLoading]                 = useState(!hasFreshCache);
  const [openTickets, setOpenTickets]         = useState(0);

  // ── Real-time open ticket count (onSnapshot) ───────────────────────────────
  useEffect(() => {
    const unsub = subscribeAllTickets((tickets) => {
      setOpenTickets(tickets.filter(t => t.status === "open").length);
    });
    return () => unsub();
  }, []);

  // ── Fetch heavy analytics (캐시 우선) ─────────────────────────────────────
  const fetchData = useCallback(async (force = false) => {
    // 신선한 캐시가 있으면 즉시 반환
    if (!force && _cache && Date.now() - _cache.fetchedAt < CACHE_TTL_MS) {
      setStats(_cache.stats);
      setDailyVolume(_cache.dailyVolume);
      setTopPerformers(_cache.topPerformers);
      setCategoryBreakdown(_cache.categoryBreakdown);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // getAllUsers 한 번으로 users + count 모두 해결 (중복 getDocs 제거)
      const [users, investments] = await Promise.all([
        getAllUsers(),
        getAllUserInvestments(),
      ]);

      const totalUsers   = users.length;

      // ── 1. Basic stats ──────────────────────────────────────────────────
      const totalSales      = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const uniqueInvestors = new Set(investments.map((inv) => inv.userId.toLowerCase()));
      const activeUsers     = uniqueInvestors.size;
      const totalReferrals  = users.filter((u) => u.referrerWallet).length;

      const nextStats = { totalSales, totalUsers, activeUsers, totalReferrals, openTickets: 0 };

      // ── 2. Daily volume — last 30 days ──────────────────────────────────
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        return { date: format(date, "MM/dd"), timestamp: startOfDay(date).getTime(), amount: 0 };
      });

      investments.forEach((inv) => {
        if (!inv.investedAt) return;
        const invDate = startOfDay(inv.investedAt);
        const dayStat = last30Days.find((d) => isSameDay(d.timestamp, invDate));
        if (dayStat) dayStat.amount += inv.amount || 0;
      });

      const nextDailyVolume = last30Days.map(({ date, amount }) => ({ date, amount }));

      // ── 3. Top performers ────────────────────────────────────────────────
      const userMap = new Map<string, Performer>();
      users.forEach((u) => {
        userMap.set(u.walletAddress.toLowerCase(), {
          wallet: u.walletAddress, totalInvestment: 0, referralCount: 0,
        });
      });
      investments.forEach((inv) => {
        const p = userMap.get(inv.userId.toLowerCase());
        if (p) p.totalInvestment += inv.amount || 0;
      });
      users.forEach((u) => {
        if (u.referrerWallet) {
          const ref = userMap.get(u.referrerWallet.toLowerCase());
          if (ref) ref.referralCount += 1;
        }
      });
      const nextTopPerformers = Array.from(userMap.values())
        .filter((p) => p.totalInvestment > 0)
        .sort((a, b) => b.totalInvestment - a.totalInvestment)
        .slice(0, 5);

      // ── 4. Category breakdown ─────────────────────────────────────────────
      const catMap = new Map<string, number>();
      investments.forEach((inv) => {
        const cat = (inv.category || "Other").trim();
        catMap.set(cat, (catMap.get(cat) || 0) + (inv.amount || 0));
      });
      const nextCategoryBreakdown: CategoryBreakdown[] = Array.from(catMap.entries())
        .map(([name, value]) => ({ name, value: Math.round(value) }))
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value);

      // ── 5. Update state + cache ──────────────────────────────────────────
      setStats(nextStats);
      setDailyVolume(nextDailyVolume);
      setTopPerformers(nextTopPerformers);
      setCategoryBreakdown(nextCategoryBreakdown);

      _cache = {
        stats: nextStats,
        dailyVolume: nextDailyVolume,
        topPerformers: nextTopPerformers,
        categoryBreakdown: nextCategoryBreakdown,
        fetchedAt: Date.now(),
      };
    } catch (error) {
      console.error("Failed to fetch admin analytics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    _cache = null;
    fetchData(true);
  }, [fetchData]);

  return {
    stats: { ...stats, openTickets },
    dailyVolume,
    topPerformers,
    categoryBreakdown,
    loading,
    openTickets,
    refresh,
  };
};
