import { useState, useEffect, useCallback } from "react";
import { getAllUsers, getUsersCount } from "@/lib/users";
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

// ─── In-memory cache (10-minute TTL) ──────────────────────────────────────────
interface CacheEntry {
  stats: ReturnType<typeof buildEmptyStats>;
  dailyVolume: DailyVolume[];
  topPerformers: Performer[];
  categoryBreakdown: CategoryBreakdown[];
  fetchedAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let _cache: CacheEntry | null = null;

function buildEmptyStats() {
  return {
    totalSales: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalReferrals: 0,
    openTickets: 0,
  };
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export const useAdminAnalytics = () => {
  const [stats, setStats] = useState(buildEmptyStats());
  const [dailyVolume, setDailyVolume] = useState<DailyVolume[]>([]);
  const [topPerformers, setTopPerformers] = useState<Performer[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTickets, setOpenTickets] = useState(0);

  // ── Real-time open ticket count via onSnapshot ─────────────────────────────
  useEffect(() => {
    const unsub = subscribeAllTickets((tickets) => {
      setOpenTickets(tickets.filter(t => t.status === "open").length);
    });
    return () => unsub();
  }, []);

  // ── Fetch heavy analytics (cached) ───────────────────────────────────────
  const fetchData = useCallback(async (force = false) => {
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
      const [users, investments, totalUsers] = await Promise.all([
        getAllUsers(),
        getAllUserInvestments(),
        getUsersCount(),
      ]);

      // ── 1. Basic stats ──────────────────────────────────────────────────
      const totalSales = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const uniqueInvestors = new Set(investments.map((inv) => inv.userId.toLowerCase()));
      const activeUsers = uniqueInvestors.size;
      const totalReferrals = users.filter((u) => u.referrerWallet).length;

      const nextStats = {
        totalSales,
        totalUsers,
        activeUsers,
        totalReferrals,
        openTickets: 0, // will be updated by real-time listener
      };

      // ── 2. Daily volume — last 30 days ──────────────────────────────────
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        return {
          date: format(date, "MM/dd"),
          timestamp: startOfDay(date).getTime(),
          amount: 0,
        };
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
          wallet: u.walletAddress,
          totalInvestment: 0,
          referralCount: 0,
        });
      });

      investments.forEach((inv) => {
        const performer = userMap.get(inv.userId.toLowerCase());
        if (performer) performer.totalInvestment += inv.amount || 0;
      });

      users.forEach((u) => {
        if (u.referrerWallet) {
          const referrer = userMap.get(u.referrerWallet.toLowerCase());
          if (referrer) referrer.referralCount += 1;
        }
      });

      const nextTopPerformers = Array.from(userMap.values())
        .filter((p) => p.totalInvestment > 0) // only investors
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

  /** Force-refresh analytics (bypasses cache) */
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
