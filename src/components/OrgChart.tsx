import React, { useEffect, useState, useRef, useCallback } from "react";
import Tree from "react-d3-tree";
import { OrgNode, buildOrgTree, convertToD3Tree, exportOrgDataToCSV } from "@/lib/orgChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, ZoomIn, ZoomOut, RefreshCw, UserCheck, Activity,
  DollarSign, Home, Download, Search, Undo2, Lock, Network,
  TreePine, Users, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { useAccount } from "wagmi";
import { ImportOrgData } from "@/components/ImportOrgData";
import { getUsersByReferrer } from "@/lib/users";

interface OrgChartProps {
  className?: string;
  viewAs?: "admin" | "user";
}

function fmtAddr(address: string): string {
  if (!address) return "Unknown";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/* ─────────────────────────────────────────────
   USER VIEW – 총 추천인수 카드 (트리 없음)
───────────────────────────────────────────── */
function UserReferralCard({ address, className }: { address?: string; className?: string }) {
  const [loading, setLoading] = useState(true);
  const [directCount, setDirectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!address) { setLoading(false); return; }

    // 재귀적으로 하위 전체 카운트
    const countAll = async (wallet: string, visited = new Set<string>()): Promise<number> => {
      if (visited.has(wallet)) return 0;
      visited.add(wallet);
      const children = await getUsersByReferrer(wallet);
      let total = children.length;
      for (const child of children) {
        total += await countAll(child.walletAddress, visited);
      }
      return total;
    };

    (async () => {
      try {
        setLoading(true);
        const directs = await getUsersByReferrer(address);
        setDirectCount(directs.length);
        // 전체 하위 수 계산 (depth-first)
        let total = directs.length;
        for (const d of directs) {
          total += await countAll(d.walletAddress, new Set([address]));
        }
        setTotalCount(total);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [address]);

  if (!address) {
    return (
      <Card className={cn("w-full p-6 flex flex-col items-center justify-center text-center gap-4", className)}>
        <Lock className="h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold">지갑 미연결</h3>
        <p className="text-muted-foreground text-sm">지갑을 연결하면 추천인 현황을 확인할 수 있습니다.</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={cn("w-full p-6 flex items-center justify-center gap-2", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">추천인 정보 로딩 중...</span>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full border shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          내 추천인 현황
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 pt-2">
        {/* 직접 추천 */}
        <div className="flex flex-col gap-1 p-4 bg-muted/30 rounded-xl border">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" /> 직접 추천인수
          </span>
          <span className="text-3xl font-extrabold text-foreground">{directCount.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">명</span>
        </div>
        {/* 전체 하위 */}
        <div className="flex flex-col gap-1 p-4 bg-primary/10 rounded-xl border border-primary/20">
          <span className="text-xs text-primary font-medium flex items-center gap-1">
            <Network className="w-3.5 h-3.5" /> 총 하위 추천인수
          </span>
          <span className="text-3xl font-extrabold text-primary">{totalCount.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">명 (전체 하위)</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   ADMIN VIEW – 전체 조직도 트리
───────────────────────────────────────────── */
export function OrgChart({ className, viewAs }: OrgChartProps) {
  const { address } = useAccount();

  // viewAs="user" 가 명시되면 localStorage 무관하게 무조건 유저뷰
  const isAdmin =
    viewAs === "user"
      ? false
      : viewAs === "admin" ||
        (typeof window !== "undefined" &&
          localStorage.getItem("alphabag_admin_authenticated") === "true");

  // ── 유저 뷰 ──────────────────────────────
  if (!isAdmin) {
    return <UserReferralCard address={address} className={className} />;
  }

  // ── 어드민 뷰 ────────────────────────────
  return <AdminOrgChart className={className} />;
}

/* ─────────────────────────────────────────────
   ADMIN ORG CHART (내부 컴포넌트)
───────────────────────────────────────────── */
function AdminOrgChart({ className }: { className?: string }) {
  const [data, setData] = useState<any>(null);
  const [originalRoots, setOriginalRoots] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.8);
  const containerRef = useRef<HTMLDivElement>(null);

  // 필터
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: undefined, to: undefined });
  const [depthFilter, setDepthFilter] = useState<string>("5");
  const [showAllRoots, setShowAllRoots] = useState(false);

  // 검색
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<{
    node: OrgNode;
    path: string[];          // 부모 지갑 주소 경로
    directCount: number;
    totalCount: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"full" | "search">("full");

  // 통계
  const [stats, setStats] = useState({ totalUsers: 0, totalVolume: 0 });

  /* depth filter 적용 */
  const applyDepthFilter = useCallback((node: any, cur: number, target: number) => {
    if (!node) return;
    if (!node.__rd3t) node.__rd3t = {};
    node.__rd3t.collapsed = target !== Infinity && cur >= target;
    if (node.children) node.children.forEach((c: any) => applyDepthFilter(c, cur + 1, target));
  }, []);

  /* 트리 뷰 업데이트 */
  const updateView = useCallback(
    (roots: OrgNode[], subtreeNode: OrgNode | null, allRoots: boolean, depth: string) => {
      let nodes = roots;
      let viewName = "Network Root";

      if (subtreeNode) {
        nodes = [subtreeNode];
        viewName = `🔍 ${fmtAddr(subtreeNode.walletAddress)}`;
      } else if (!allRoots && roots.length > 0) {
        nodes = [roots[0]];
        viewName = `Main Network`;
      } else {
        viewName = "All Networks";
      }

      // 통계
      let count = 0;
      const vol = nodes.reduce((a, r) => a + (r.teamSales || 0), 0);
      const countAll = (ns: OrgNode[]) => ns.forEach(n => { count++; if (n.children) countAll(n.children); });
      countAll(nodes);
      setStats({ totalUsers: count, totalVolume: vol });

      const treeData = {
        name: viewName,
        attributes: { isRoot: true },
        children: nodes.map(convertToD3Tree),
      };

      const target = depth === "all" ? Infinity : parseInt(depth);
      applyDepthFilter(treeData, 0, target);
      setData(treeData);

      // 중앙 정렬
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setTranslate({ x: width / 2, y: height / 5 });
        setZoom(0.8);
      }
    },
    [applyDepthFilter]
  );

  /* 데이터 로드 */
  const fetchData = useCallback(
    async (opts?: { allRoots?: boolean; depth?: string }) => {
      setLoading(true);
      const allRoots = opts?.allRoots ?? showAllRoots;
      const depth = opts?.depth ?? depthFilter;
      try {
        const roots = await buildOrgTree({ startDate: dateRange?.from, endDate: dateRange?.to });
        setOriginalRoots(roots);
        updateView(roots, null, allRoots, depth);
      } catch (e) {
        console.error(e);
        toast.error("조직도 로딩 실패");
      } finally {
        setLoading(false);
      }
    },
    [dateRange, showAllRoots, depthFilter, updateView]
  );

  useEffect(() => { fetchData(); }, [dateRange]);

  useEffect(() => {
    if (data) {
      const target = depthFilter === "all" ? Infinity : parseInt(depthFilter);
      const copy = JSON.parse(JSON.stringify(data));
      applyDepthFilter(copy, 0, target);
      setData(copy);
    }
  }, [depthFilter]);

  /* ── 지갑 검색 ── */
  const findNodeInRoots = (roots: OrgNode[], query: string): { node: OrgNode; path: string[] } | null => {
    const q = query.toLowerCase().trim();
    const dfs = (node: OrgNode, path: string[]): { node: OrgNode; path: string[] } | null => {
      if (node.walletAddress.toLowerCase().includes(q)) return { node, path };
      for (const child of node.children) {
        const found = dfs(child, [...path, node.walletAddress]);
        if (found) return found;
      }
      return null;
    };
    for (const root of roots) {
      const r = dfs(root, []);
      if (r) return r;
    }
    return null;
  };

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    const found = findNodeInRoots(originalRoots, q);
    if (!found) {
      toast.error(`"${q}" 주소를 찾을 수 없습니다.`);
      return;
    }
    const { node, path } = found;
    // 직접 추천 / 전체 하위 카운트
    let total = 0;
    const countDown = (n: OrgNode) => { n.children.forEach(c => { total++; countDown(c); }); };
    countDown(node);

    setSearchResult({ node, path, directCount: node.children.length, totalCount: total });
    setViewMode("search");
    updateView(originalRoots, node, false, depthFilter);
    toast.success(`발견: ${node.walletAddress.substring(0, 10)}...`);
  };

  const handleResetSearch = () => {
    setSearchQuery("");
    setSearchResult(null);
    setViewMode("full");
    updateView(originalRoots, null, showAllRoots, depthFilter);
  };

  const handleCenter = () => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setTranslate({ x: width / 2, y: height / 5 });
      setZoom(0.8);
    }
  };

  const handleExport = () => {
    if (!originalRoots.length) return;
    const csv = exportOrgDataToCSV(originalRoots);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `org_chart_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading && !data) {
    return (
      <Card className={cn("w-full h-[600px] flex items-center justify-center gap-2", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground">조직도 로딩 중...</span>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full h-[900px] flex flex-col border-none shadow-none", className)}>
      <CardHeader className="flex flex-col gap-3 border-b bg-card px-6 py-4">

        {/* ── 1행: 제목 + 통계 + 버튼 ── */}
        <div className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Network Overview
              {viewMode === "search" && (
                <span className="text-sm font-normal text-muted-foreground ml-1">(검색 결과)</span>
              )}
            </CardTitle>
            <div className="flex gap-5 mt-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <UserCheck className="h-4 w-4" />
                Total Members: <strong className="text-foreground ml-1">{stats.totalUsers}</strong>
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Total Volume: <strong className="text-foreground ml-1">${stats.totalVolume.toLocaleString()}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <ImportOrgData onSuccess={() => fetchData()} />
            {viewMode !== "search" && (
              <Button
                variant={showAllRoots ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const next = !showAllRoots;
                  setShowAllRoots(next);
                  updateView(originalRoots, null, next, depthFilter);
                }}
                className="gap-1.5"
              >
                {showAllRoots ? <Network className="h-4 w-4" /> : <TreePine className="h-4 w-4" />}
                {showAllRoots ? `전체 (${originalRoots.length})` : "메인 트리"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        </div>

        {/* ── 2행: 지갑 검색 (강화) ── */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="지갑 주소로 검색 (0x...)"
              className="pl-9 pr-4 h-9 font-mono text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {searchQuery && (
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => { setSearchQuery(""); if (viewMode === "search") handleResetSearch(); }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button size="sm" onClick={handleSearch} className="gap-1.5 px-4">
            <Search className="h-4 w-4" /> 검색
          </Button>
          {viewMode === "search" && (
            <Button variant="ghost" size="sm" onClick={handleResetSearch} className="gap-1.5">
              <Undo2 className="h-4 w-4" /> 초기화
            </Button>
          )}
        </div>

        {/* ── 검색 결과 패널 ── */}
        {searchResult && (
          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">검색 결과</span>
              <button onClick={handleResetSearch} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* 지갑 주소 */}
            <div className="font-mono text-xs bg-background rounded px-2 py-1 break-all">
              {searchResult.node.walletAddress}
            </div>
            {/* 통계 */}
            <div className="flex gap-4 text-muted-foreground">
              <span>직접 추천: <strong className="text-foreground">{searchResult.directCount}명</strong></span>
              <span>전체 하위: <strong className="text-foreground">{searchResult.totalCount}명</strong></span>
              <span>레벨: <strong className="text-foreground">{searchResult.node.level ?? 0}</strong></span>
            </div>
            {/* 부모 경로 */}
            {searchResult.path.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="mr-1">경로:</span>
                {searchResult.path.map((p, i) => (
                  <span key={i}>
                    <span
                      className="cursor-pointer text-primary hover:underline"
                      onClick={() => {
                        setSearchQuery(p);
                        const r = findNodeInRoots(originalRoots, p);
                        if (r) {
                          let total = 0;
                          const cd = (n: OrgNode) => { n.children.forEach(c => { total++; cd(c); }); };
                          cd(r.node);
                          setSearchResult({ node: r.node, path: r.path, directCount: r.node.children.length, totalCount: total });
                          updateView(originalRoots, r.node, false, depthFilter);
                        }
                      }}
                    >
                      {fmtAddr(p)}
                    </span>
                    {i < searchResult.path.length - 1 && <span className="mx-1">→</span>}
                  </span>
                ))}
                <span className="mx-1">→</span>
                <span className="text-yellow-500 font-semibold">{fmtAddr(searchResult.node.walletAddress)}</span>
              </div>
            )}
          </div>
        )}

        {/* ── 3행: 날짜 + 깊이 + 줌 ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <DatePickerWithRange value={dateRange} onChange={setDateRange} className="w-[240px]" />
            <Select value={depthFilter} onValueChange={(v) => { setDepthFilter(v); }}>
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Depth" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 레벨</SelectItem>
                <SelectItem value="3">3 레벨</SelectItem>
                <SelectItem value="5">5 레벨</SelectItem>
                <SelectItem value="10">10 레벨</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(z * 0.8, 0.1))} className="h-8 w-8" title="축소">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCenter} className="h-8 w-8" title="중앙">
              <Home className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(z * 1.2, 3))} className="h-8 w-8" title="확대">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-border mx-0.5" />
            <Button variant="ghost" size="icon" onClick={() => fetchData()} className="h-8 w-8" title="새로고침">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent
        className="flex-1 relative bg-slate-50/50 dark:bg-slate-950/50 p-0 overflow-hidden"
        ref={containerRef}
      >
        {data ? (
          <div style={{ width: "100%", height: "100%" }}>
            <Tree
              data={data}
              translate={translate}
              zoom={zoom}
              scaleExtent={{ min: 0.05, max: 3 }}
              orientation="vertical"
              pathFunc="step"
              separation={{ siblings: 1.2, nonSiblings: 1.6 }}
              nodeSize={{ x: 220, y: 150 }}
              renderCustomNodeElement={(rd3tProps) => (
                <CustomNode
                  {...rd3tProps}
                  highlightWallet={searchResult?.node.walletAddress.toLowerCase()}
                />
              )}
              enableLegacyTransitions={false}
              initialDepth={depthFilter === "all" ? undefined : parseInt(depthFilter)}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            표시할 데이터가 없습니다
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   CUSTOM NODE
───────────────────────────────────────────── */
const CustomNode = ({
  nodeDatum,
  toggleNode,
  highlightWallet,
}: {
  nodeDatum: any;
  toggleNode: () => void;
  highlightWallet?: string;
}) => {
  const isRoot = nodeDatum.attributes?.isRoot;
  const personalSales = nodeDatum.attributes?.["Personal Sales"];
  const teamSales = nodeDatum.attributes?.["Team Sales"];
  const directCount = nodeDatum.attributes?.["Directs"];
  const fullWallet: string = nodeDatum.attributes?.["Wallet"] || "";
  const hasChildren = nodeDatum.children && nodeDatum.children.length > 0;
  const isHighlighted = highlightWallet && fullWallet.toLowerCase() === highlightWallet;

  const fmt = (v: string | number) => {
    if (!v) return "$0";
    if (typeof v === "string" && v.startsWith("$")) return v;
    return `$${Number(v).toLocaleString()}`;
  };

  if (isRoot) {
    return (
      <g>
        <circle r={14} fill="#6366f1" onClick={toggleNode} className="cursor-pointer" />
        <text y={28} x={0} textAnchor="middle" style={{ fontSize: 11, fill: "#94a3b8" }}>
          {nodeDatum.name}
        </text>
      </g>
    );
  }

  return (
    <g>
      <foreignObject
        x="-100"
        y="-44"
        width="200"
        height="110"
        style={{ overflow: "visible" }}
      >
        <div
          className={cn(
            "flex flex-col w-[200px] bg-card border rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden",
            isHighlighted
              ? "border-yellow-400 ring-2 ring-yellow-400/60"
              : hasChildren
              ? "border-primary/50"
              : "border-border"
          )}
          onClick={toggleNode}
          title={fullWallet}
        >
          {/* 헤더 */}
          <div
            className={cn(
              "px-3 py-1.5 text-xs font-semibold text-white flex justify-between items-center",
              isHighlighted
                ? "bg-yellow-500"
                : hasChildren
                ? "bg-primary"
                : "bg-slate-500"
            )}
          >
            <span className="truncate max-w-[120px] font-mono" title={fullWallet}>
              {nodeDatum.name}
            </span>
            {hasChildren && (
              <span className="bg-white/25 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                {directCount}명
              </span>
            )}
          </div>

          {/* 바디 */}
          <div className="p-2 flex flex-col gap-1 bg-background text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Personal:</span>
              <span className="font-medium">{fmt(personalSales)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Team Vol:</span>
              <span className="font-bold text-primary">{fmt(teamSales)}</span>
            </div>
          </div>
        </div>
      </foreignObject>
    </g>
  );
};
