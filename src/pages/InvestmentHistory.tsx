import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  History, Download, RefreshCw, Search, Filter, ExternalLink, Wallet,
} from "lucide-react";
import { getUserInvestments, UserInvestment, InvestmentCategory } from "@/lib/userInvestments";
import { format, subDays, isAfter } from "date-fns";

// ─── CSV helper ───────────────────────────────────────────────────────────────
function downloadCSV(data: UserInvestment[], filename: string) {
  const headers = ["Date", "Category", "Project", "Amount (USDT)", "Token Amount", "Token Value (USDT)", "P/L", "Tx Hash"];
  const rows = data.map((inv) => [
    format(new Date(inv.investedAt), "yyyy-MM-dd HH:mm"),
    inv.category,
    inv.projectName,
    (inv.amount || 0).toFixed(2),
    (inv.tokenAmount ?? "").toString(),
    (inv.tokenValueUSDT ?? "").toString(),
    (inv.profit ?? "").toString(),
    inv.transactionHash || "",
  ]);
  const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type PeriodFilter = "all" | "7d" | "30d" | "90d";
const PERIOD_OPTIONS: { label: string; value: PeriodFilter }[] = [
  { label: "All Time", value: "all" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];
const CATEGORY_OPTIONS: { label: string; value: string }[] = [
  { label: "All Categories", value: "all" },
  { label: "BBAG", value: "BBAG" },
  { label: "SBAG", value: "SBAG" },
  { label: "CBAG", value: "CBAG" },
];

const CATEGORY_COLORS: Record<string, string> = {
  BBAG: "bg-yellow-500/20 text-yellow-700 border-yellow-400/50",
  SBAG: "bg-blue-500/20 text-blue-700 border-blue-400/50",
  CBAG: "bg-green-500/20 text-green-700 border-green-400/50",
};

const InvestmentHistory = () => {
  const { address, isConnected } = useAccount();
  const [investments, setInvestments] = useState<UserInvestment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");

  const load = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const data = await getUserInvestments(address);
      setInvestments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let result = [...investments];

    // Period filter
    if (periodFilter !== "all") {
      const days = periodFilter === "7d" ? 7 : periodFilter === "30d" ? 30 : 90;
      const cutoff = subDays(new Date(), days);
      result = result.filter((inv) => isAfter(new Date(inv.investedAt), cutoff));
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((inv) => inv.category === categoryFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.projectName?.toLowerCase().includes(q) ||
          inv.transactionHash?.toLowerCase().includes(q) ||
          inv.category?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [investments, periodFilter, categoryFilter, searchQuery]);

  const totalFiltered = filtered.reduce((s, i) => s + (i.amount || 0), 0);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-[100px] sm:pt-24 pb-16 flex flex-col items-center justify-center gap-4">
          <Wallet className="w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground">Connect your wallet to view investment history</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-[100px] sm:pt-24 pb-16 space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <History className="w-6 h-6 text-primary" />
              Investment History
            </h1>
            <p className="text-sm text-muted-foreground">
              Complete timeline of all your investments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => downloadCSV(filtered, `investments_${format(new Date(), "yyyyMMdd")}.csv`)}
              disabled={filtered.length === 0}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search project or tx hash..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-44">
                  <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filtered.length}</span> records found
          <span className="font-medium text-foreground">${totalFiltered.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> total
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
            <CardDescription>Sorted newest first</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No investments match your filters</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-4 pl-12">
                  {filtered.map((inv) => (
                    <div key={inv.id} className="relative">
                      {/* Dot */}
                      <div className="absolute -left-8 top-4 w-3 h-3 rounded-full border-2 border-primary bg-background" />
                      <div className="p-4 rounded-lg bg-muted/40 border border-border/50 hover:bg-muted/70 transition-colors">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-xs font-mono ${CATEGORY_COLORS[inv.category] || ""}`}
                            >
                              {inv.category}
                            </Badge>
                            <div>
                              <p className="text-sm font-medium">{inv.projectName}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(inv.investedAt), "yyyy-MM-dd HH:mm")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">
                              ${(inv.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT
                            </p>
                            {inv.profit !== undefined && (
                              <p className={`text-xs font-medium ${inv.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {inv.profit >= 0 ? "+" : ""}{inv.profit.toFixed(2)} P/L
                              </p>
                            )}
                          </div>
                        </div>
                        {inv.transactionHash && (
                          <a
                            href={`https://bscscan.com/tx/${inv.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline w-fit"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {inv.transactionHash.slice(0, 12)}...{inv.transactionHash.slice(-8)}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InvestmentHistory;
