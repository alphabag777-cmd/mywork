import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, DollarSign, Wallet, RefreshCw, BarChart3, PieChart,
  AlertCircle,
} from "lucide-react";
import { getUserInvestments } from "@/lib/userInvestments";
import { getActiveUserStakes } from "@/lib/userStakes";
import { formatUnits } from "viem";
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";

const COLORS = {
  BBAG: "#f59e0b",
  SBAG: "#3b82f6",
  CBAG: "#10b981",
  Staking: "#8b5cf6",
};

const Earnings = () => {
  const { address, isConnected } = useAccount();
  const [investments, setInvestments] = useState<any[]>([]);
  const [stakes, setStakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const [invData, stakeData] = await Promise.all([
        getUserInvestments(address),
        getActiveUserStakes(address),
      ]);
      setInvestments(invData);
      setStakes(stakeData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Aggregated stats ──────────────────────────────────────────────────────────
  const totalInvested = investments.reduce((s, i) => s + (i.amount || 0), 0);
  const totalProfit = investments.reduce((s, i) => s + (i.profit || 0), 0);
  const totalTokenValue = investments.reduce((s, i) => s + (i.tokenValueUSDT || 0), 0);

  // Staking earnings
  const stakingPrincipal = stakes.reduce((s, st) => {
    try { return s + parseFloat(formatUnits(BigInt(st.principal), 18)); } catch { return s + 0; }
  }, 0);
  const stakingDailyRewards = stakes.reduce((s, st) => {
    try {
      const p = parseFloat(formatUnits(BigInt(st.principal), 18));
      return s + (p * st.dailyRateBps) / 10000;
    } catch { return s; }
  }, 0);

  // ── Category breakdown for pie chart ─────────────────────────────────────────
  const categoryMap: Record<string, number> = {};
  investments.forEach((inv) => {
    const cat = inv.category || "BBAG";
    categoryMap[cat] = (categoryMap[cat] || 0) + (inv.amount || 0);
  });
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // ── Monthly investment bar chart ──────────────────────────────────────────────
  const monthlyMap: Record<string, number> = {};
  investments.forEach((inv) => {
    const m = format(new Date(inv.investedAt), "yyyy-MM");
    monthlyMap[m] = (monthlyMap[m] || 0) + (inv.amount || 0);
  });
  const barData = Object.entries(monthlyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, amount]) => ({ month: format(new Date(month), "MMM yy"), amount }));

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center gap-4">
          <Wallet className="w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground">Connect your wallet to view earnings</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16 space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              My Earnings
            </h1>
            <p className="text-sm text-muted-foreground">Investment performance & portfolio overview</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Invested", value: `$${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, sub: "USDT", icon: DollarSign, color: "border-l-primary" },
            { label: "Total Token Value", value: `$${totalTokenValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, sub: "Current value", icon: BarChart3, color: "border-l-blue-500" },
            { label: "Unrealized P/L", value: `${totalProfit >= 0 ? "+" : ""}$${totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, sub: totalInvested ? `${((totalProfit / totalInvested) * 100).toFixed(1)}%` : "0%", icon: TrendingUp, color: totalProfit >= 0 ? "border-l-green-500" : "border-l-red-500" },
            { label: "Staking Daily", value: `+$${stakingDailyRewards.toFixed(2)}`, sub: `Principal: $${stakingPrincipal.toFixed(2)}`, icon: Wallet, color: "border-l-purple-500" },
          ].map((kpi) => (
            <Card key={kpi.label} className={`border-l-4 ${kpi.color}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading
                  ? <Skeleton className="h-8 w-32" />
                  : <div className="text-2xl font-bold">{kpi.value}</div>}
                <p className="text-xs text-muted-foreground">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Portfolio Allocation Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChart className="w-4 h-4 text-primary" />
                Portfolio Allocation
              </CardTitle>
              <CardDescription>Investment by category</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-60 w-full" />
              ) : pieData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-60 text-muted-foreground gap-2">
                  <AlertCircle className="w-8 h-8" />
                  <p className="text-sm">No investment data</p>
                </div>
              ) : (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={(COLORS as any)[entry.name] || "#6b7280"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Amount"]} />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Investment Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4 text-primary" />
                Monthly Investment
              </CardTitle>
              <CardDescription>Last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-60 w-full" />
              ) : barData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-60 text-muted-foreground gap-2">
                  <AlertCircle className="w-8 h-8" />
                  <p className="text-sm">No investment data</p>
                </div>
              ) : (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Invested"]} />
                      <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Investment List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Investment Details</CardTitle>
            <CardDescription>{investments.length} total investments</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : investments.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-muted-foreground gap-2">
                <AlertCircle className="w-8 h-8" />
                <p className="text-sm">No investments found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {investments.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs font-mono">{inv.category}</Badge>
                      <div>
                        <p className="text-sm font-medium">{inv.projectName}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(inv.investedAt), "yyyy-MM-dd")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${(inv.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      {inv.profit !== undefined && (
                        <p className={`text-xs font-medium ${inv.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {inv.profit >= 0 ? "+" : ""}{inv.profit.toFixed(2)} P/L
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Earnings;
