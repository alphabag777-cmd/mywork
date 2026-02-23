import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, Users, Share2, Loader2, TrendingUp, DollarSign, Activity, PieChart, KeyRound, UserCog, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import { subDays, startOfDay } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { changeAdminPassword, changeAdminUsername } from "@/lib/adminConfig";

const CATEGORY_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444"];

type Period = "7d" | "14d" | "30d";

export const AdminDashboard = () => {
  const { stats, dailyVolume, topPerformers, categoryBreakdown, loading } = useAdminAnalytics();
  const [period, setPeriod] = useState<Period>("30d");

  // 비밀번호 변경 상태
  const [pwCurrent, setPwCurrent]   = useState("");
  const [pwNew, setPwNew]           = useState("");
  const [pwConfirm, setPwConfirm]   = useState("");
  const [pwLoading, setPwLoading]   = useState(false);
  const [showPw, setShowPw]         = useState(false);

  // 아이디 변경 상태
  const [unPassword, setUnPassword] = useState("");
  const [unNew, setUnNew]           = useState("");
  const [unLoading, setUnLoading]   = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwNew !== pwConfirm) { toast.error("새 비밀번호가 일치하지 않습니다."); return; }
    if (pwNew.length < 6)    { toast.error("새 비밀번호는 6자 이상이어야 합니다."); return; }
    setPwLoading(true);
    try {
      const res = await changeAdminPassword(pwCurrent, pwNew);
      if (res.ok) {
        toast.success(res.message);
        setPwCurrent(""); setPwNew(""); setPwConfirm("");
      } else {
        toast.error(res.message);
      }
    } catch { toast.error("오류가 발생했습니다."); }
    finally { setPwLoading(false); }
  };

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unNew.trim() || unNew.length < 3) { toast.error("아이디는 3자 이상이어야 합니다."); return; }
    setUnLoading(true);
    try {
      const res = await changeAdminUsername(unPassword, unNew);
      if (res.ok) {
        toast.success(res.message);
        setUnPassword(""); setUnNew("");
      } else {
        toast.error(res.message);
      }
    } catch { toast.error("오류가 발생했습니다."); }
    finally { setUnLoading(false); }
  };

  // Filter daily volume by period
  const filteredVolume = useMemo(() => {
    const days = period === "7d" ? 7 : period === "14d" ? 14 : 30;
    return dailyVolume.slice(-days);
  }, [dailyVolume, period]);

  // Category breakdown — 실제 Firebase 데이터 사용
  // (useAdminAnalytics에서 category 필드로 집계)
  const categoryPieData = categoryBreakdown;

  // New signups trend from dailyVolume length (we approximate by days with activity)
  const signupTrend = useMemo(() => {
    return filteredVolume.map((d) => ({
      date: d.date,
      volume: d.amount,
    }));
  }, [filteredVolume]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Real-time overview of platform performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales Volume</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time USDT investment</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeUsers} active investors</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Share2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">Connected relationships</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Users with investment</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Volume Chart with period tabs */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Daily Investment Volume
            </CardTitle>
            <CardDescription>Investment amount per day</CardDescription>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="14d">14D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredVolume}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, "Volume"]} cursor={{ fill: "transparent" }} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Portfolio Category Pie */}
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Category Breakdown
            </CardTitle>
            <CardDescription>Investment allocation by category (live data)</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryPieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={categoryPieData} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryPieData.map((entry, i) => (
                        <Cell key={entry.name} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
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

        {/* Top Performers */}
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Top Investors
            </CardTitle>
            <CardDescription>Highest personal investment volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {topPerformers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
              ) : (
                topPerformers.map((user, index) => (
                  <div key={user.wallet} className="flex items-center">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted/50 border text-sm font-bold mr-4">
                      {index + 1}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate" title={user.wallet}>
                        {user.wallet}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.referralCount} Direct Referrals</p>
                    </div>
                    <div className="font-bold">${user.totalInvestment.toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Volume trend line chart */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Volume Trend
          </CardTitle>
          <CardDescription>Cumulative investment trend over {period}</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={signupTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, "Volume"]} />
                <Line type="monotone" dataKey="volume" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      {/* ── 계정 설정 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 비밀번호 변경 */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" /> 비밀번호 변경
            </CardTitle>
            <CardDescription className="text-xs">현재 비밀번호 확인 후 새 비밀번호로 변경합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">현재 비밀번호</Label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={pwCurrent}
                    onChange={(e) => setPwCurrent(e.target.value)}
                    placeholder="현재 비밀번호"
                    disabled={pwLoading}
                    className="pr-9 text-sm"
                  />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">새 비밀번호 (6자 이상)</Label>
                <Input
                  type="password"
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  placeholder="새 비밀번호"
                  disabled={pwLoading}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">새 비밀번호 확인</Label>
                <Input
                  type="password"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  placeholder="새 비밀번호 재입력"
                  disabled={pwLoading}
                  className="text-sm"
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={pwLoading} size="sm">
                {pwLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 변경 중...</> : <><ShieldCheck className="w-3.5 h-3.5" /> 비밀번호 변경</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 아이디 변경 */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCog className="w-4 h-4 text-primary" /> 아이디 변경
            </CardTitle>
            <CardDescription className="text-xs">현재 비밀번호 확인 후 새 아이디로 변경합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangeUsername} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">현재 비밀번호</Label>
                <Input
                  type="password"
                  value={unPassword}
                  onChange={(e) => setUnPassword(e.target.value)}
                  placeholder="현재 비밀번호"
                  disabled={unLoading}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">새 아이디 (3자 이상)</Label>
                <Input
                  type="text"
                  value={unNew}
                  onChange={(e) => setUnNew(e.target.value)}
                  placeholder="새 아이디"
                  disabled={unLoading}
                  className="text-sm"
                />
              </div>
              <Button type="submit" className="w-full gap-2 mt-2" disabled={unLoading} size="sm">
                {unLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 변경 중...</> : <><UserCog className="w-3.5 h-3.5" /> 아이디 변경</>}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default AdminDashboard;
