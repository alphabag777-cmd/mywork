import { useState, useEffect } from "react";
import { getAllUsers, getUsersCount } from "@/lib/users";
import { getAllUserInvestments } from "@/lib/userInvestments";
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

// ─── In-memory cache (5-minute TTL) ───────────────────────────────────────────
interface CacheEntry {
  stats: ReturnType<typeof buildEmptyStats>;
  dailyVolume: DailyVolume[];
  topPerformers: Performer[];
  fetchedAt: number; // epoch ms
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let _cache: CacheEntry | null = null;

function buildEmptyStats() {
  return { totalSales: 0, totalUsers: 0, activeUsers: 0, totalReferrals: 0 };
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export const useAdminAnalytics = () => {
  const [stats, setStats] = useState(buildEmptyStats());
  const [dailyVolume, setDailyVolume] = useState<DailyVolume[]>([]);
  const [topPerformers, setTopPerformers] = useState<Performer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Serve from cache if fresh
      if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL_MS) {
        setStats(_cache.stats);
        setDailyVolume(_cache.dailyVolume);
        setTopPerformers(_cache.topPerformers);
        setLoading(false);
        return;
      }

      try {
        // Fetch users + investments in parallel.
        // getUsersCount uses a lightweight Firestore COUNT query (single read).
        // getAllUsers is still needed for referral counting and top-performer mapping.
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

        const nextStats = { totalSales, totalUsers, activeUsers, totalReferrals };

        // ── 2. Daily volume — last 30 days ────────────────────────────────
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

        // ── 3. Top performers ─────────────────────────────────────────────
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
          .sort((a, b) => b.totalInvestment - a.totalInvestment)
          .slice(0, 5);

        // ── 4. Update state + cache ───────────────────────────────────────
        setStats(nextStats);
        setDailyVolume(nextDailyVolume);
        setTopPerformers(nextTopPerformers);

        _cache = {
          stats: nextStats,
          dailyVolume: nextDailyVolume,
          topPerformers: nextTopPerformers,
          fetchedAt: Date.now(),
        };
      } catch (error) {
        console.error("Failed to fetch admin analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { stats, dailyVolume, topPerformers, loading };
};
