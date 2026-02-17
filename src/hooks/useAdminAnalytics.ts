import { useState, useEffect } from "react";
import { getAllUsers, User } from "@/lib/users";
import { getAllUserInvestments, UserInvestment } from "@/lib/userInvestments";
import { format, subDays, startOfDay, isSameDay } from "date-fns";

export interface DailyVolume {
  date: string;
  amount: number;
}

export interface Performer {
  wallet: string;
  totalInvestment: number;
  referralCount: number; // Directs
}

export const useAdminAnalytics = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalReferrals: 0,
  });
  const [dailyVolume, setDailyVolume] = useState<DailyVolume[]>([]);
  const [topPerformers, setTopPerformers] = useState<Performer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, investments] = await Promise.all([
          getAllUsers(),
          getAllUserInvestments(),
        ]);

        // 1. Calculate Basic Stats
        const totalSales = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const uniqueInvestors = new Set(investments.map((inv) => inv.userId.toLowerCase()));
        const activeUsers = uniqueInvestors.size;
        const totalReferrals = users.filter((u) => u.referrerWallet).length;

        setStats({
          totalSales,
          totalUsers: users.length,
          activeUsers,
          totalReferrals,
        });

        // 2. Calculate Daily Volume (Last 30 Days)
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
          if (dayStat) {
            dayStat.amount += inv.amount || 0;
          }
        });

        setDailyVolume(last30Days.map(({ date, amount }) => ({ date, amount })));

        // 3. Calculate Top Performers (by Personal Investment for now)
        // Note: For "Team Volume" we'd need the recursive tree logic from OrgChart.
        // Let's stick to Personal Investment + Direct Referrals for speed here.
        const userMap = new Map<string, Performer>();

        users.forEach((u) => {
          userMap.set(u.walletAddress.toLowerCase(), {
            wallet: u.walletAddress,
            totalInvestment: 0,
            referralCount: 0,
          });
        });

        // Sum investments
        investments.forEach((inv) => {
          const userId = inv.userId.toLowerCase();
          const performer = userMap.get(userId);
          if (performer) {
            performer.totalInvestment += inv.amount || 0;
          }
        });

        // Count referrals
        users.forEach((u) => {
          if (u.referrerWallet) {
            const referrerId = u.referrerWallet.toLowerCase();
            const referrer = userMap.get(referrerId);
            if (referrer) {
              referrer.referralCount += 1;
            }
          }
        });

        const sortedPerformers = Array.from(userMap.values())
          .sort((a, b) => b.totalInvestment - a.totalInvestment)
          .slice(0, 5);

        setTopPerformers(sortedPerformers);

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
