import React, { useEffect, useState, useRef } from "react";
import Tree from "react-d3-tree";
import { OrgNode, buildOrgTree, convertToD3Tree, exportOrgDataToCSV } from "@/lib/orgChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ZoomIn, ZoomOut, RefreshCw, UserCheck, Activity, DollarSign, Home, Download, Search, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays, startOfMonth, endOfMonth } from "date-fns";

interface OrgChartProps {
  className?: string;
}

export function OrgChart({ className }: OrgChartProps) {
  const [data, setData] = useState<any>(null);
  const [originalRoots, setOriginalRoots] = useState<OrgNode[]>([]); // Store original data for filtering/searching
  const [loading, setLoading] = useState(true);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filters & Search
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"full" | "subtree">("full");
  const [subtreeRoot, setSubtreeRoot] = useState<OrgNode | null>(null);

  // Stats to display at the top
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVolume: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Pass date range to builder
      const roots = await buildOrgTree({
        startDate: dateRange?.from,
        endDate: dateRange?.to,
      });
      
      setOriginalRoots(roots);
      updateView(roots, viewMode === "subtree" ? subtreeRoot : null);

    } catch (error) {
      console.error("Failed to load org chart:", error);
      toast.error("Failed to load organization chart");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when date range changes
  useEffect(() => {
    fetchData();
  }, [dateRange]);

  // Handle Search
  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    const findNode = (nodes: OrgNode[], query: string): OrgNode | null => {
      for (const node of nodes) {
        if (
          node.walletAddress.toLowerCase().includes(query.toLowerCase()) ||
          (node.referralCode && node.referralCode.toLowerCase().includes(query.toLowerCase()))
        ) {
          return node;
        }
        if (node.children) {
          const found = findNode(node.children, query);
          if (found) return found;
        }
      }
      return null;
    };

    const foundNode = findNode(originalRoots, searchQuery);
    
    if (foundNode) {
      setSubtreeRoot(foundNode);
      setViewMode("subtree");
      updateView(originalRoots, foundNode);
      toast.success(`Found user: ${foundNode.walletAddress.substring(0, 6)}...`);
    } else {
      toast.error("User not found in the current organization tree.");
    }
  };

  const handleResetView = () => {
    setViewMode("full");
    setSubtreeRoot(null);
    setSearchQuery("");
    updateView(originalRoots, null);
    handleCenter();
  };

  const updateView = (roots: OrgNode[], subtreeNode: OrgNode | null) => {
    let nodesToRender = roots;
    let viewName = "Network Root";

    if (subtreeNode) {
      nodesToRender = [subtreeNode];
      viewName = `Subtree: ${subtreeNode.walletAddress.substring(0, 6)}...`;
    }

    // Recalculate stats for the CURRENT VIEW
    const currentTotalVolume = nodesToRender.reduce((acc, root) => acc + (root.teamSales || 0), 0);
    let count = 0;
    const countNodes = (nodes: OrgNode[]) => {
      nodes.forEach(node => {
        count++;
        if (node.children) countNodes(node.children);
      });
    };
    countNodes(nodesToRender);

    setStats({
      totalUsers: count,
      totalVolume: currentTotalVolume,
    });

    const treeData = {
      name: viewName,
      attributes: {
        isRoot: true,
      },
      children: nodesToRender.map(convertToD3Tree),
    };

    setData(treeData);

    // Center view if switching modes
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setTranslate({ x: width / 2, y: height / 6 });
      setZoom(1);
    }
  };

  const handleExport = () => {
    if (!originalRoots.length) return;
    
    // Export mostly consistent with current view logic? 
    // Usually export full data regardless of view, but respecting date filter.
    // Let's export the *currently filtered* full tree (originalRoots).
    
    const csvContent = exportOrgDataToCSV(originalRoots);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `org_chart_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev * 0.8, 0.1));
  };

  const handleCenter = () => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setTranslate({ x: width / 2, y: height / 6 });
      setZoom(1);
    }
  };

  if (loading && !data) {
    return (
      <Card className={`w-full h-[600px] flex items-center justify-center ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading Organization Chart...</span>
      </Card>
    );
  }

  return (
    <Card className={`w-full h-[900px] flex flex-col border-none shadow-none ${className}`}>
      <CardHeader className="flex flex-col gap-4 border-b bg-card px-6 py-4">
        {/* Top Row: Title & Stats */}
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Network Overview
              {viewMode === "subtree" && <span className="text-sm font-normal text-muted-foreground ml-2">(Subtree View)</span>}
            </CardTitle>
            <div className="flex gap-6 mt-2 text-sm text-muted-foreground">
               <div className="flex items-center gap-1">
                  <UserCheck className="h-4 w-4" />
                  <span>Total Members: <span className="font-semibold text-foreground">{stats.totalUsers}</span></span>
               </div>
               <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Total Volume: <span className="font-semibold text-foreground">${stats.totalVolume.toLocaleString()}</span></span>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Second Row: Controls (Date, Search, View) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <DatePickerWithRange 
              value={dateRange} 
              onChange={setDateRange} 
              className="w-[260px]"
            />
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search wallet or referral code..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button variant="secondary" onClick={handleSearch}>Search</Button>
            {viewMode === "subtree" && (
              <Button variant="ghost" onClick={handleResetView} className="gap-2">
                <Undo2 className="h-4 w-4" />
                Reset
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
            <Button variant="ghost" size="icon" onClick={handleZoomOut} title="Zoom Out" className="h-8 w-8">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCenter} title="Center View" className="h-8 w-8">
              <Home className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} title="Zoom In" className="h-8 w-8">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button variant="ghost" size="icon" onClick={handleRefresh} title="Refresh Data" className="h-8 w-8">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 relative bg-slate-50/50 dark:bg-slate-950/50 p-0 overflow-hidden" ref={containerRef}>
        {data ? (
          <div style={{ width: "100%", height: "100%" }}>
            <Tree
              data={data}
              translate={translate}
              zoom={zoom}
              scaleExtent={{ min: 0.1, max: 2 }}
              orientation="vertical"
              pathFunc="step"
              separation={{ siblings: 1.2, nonSiblings: 1.5 }}
              nodeSize={{ x: 220, y: 140 }}
              renderCustomNodeElement={(rd3tProps) => (
                <CustomNode {...rd3tProps} />
              )}
              enableLegacyTransitions={true}
              transitionDuration={800}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No data to display</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Custom Node Component using foreignObject for HTML rendering inside SVG
const CustomNode = ({ nodeDatum, toggleNode }: any) => {
  const isRoot = nodeDatum.attributes?.isRoot;
  const personalSales = nodeDatum.attributes?.["Personal Sales"];
  const teamSales = nodeDatum.attributes?.["Team Sales"];
  const directCount = nodeDatum.attributes?.["Directs"];
  const hasChildren = nodeDatum.children && nodeDatum.children.length > 0;

  // Format currency helper
  const formatCurrency = (val: string | number) => {
    if (!val) return "$0";
    if (typeof val === 'string' && val.startsWith('$')) return val;
    return `$${Number(val).toLocaleString()}`;
  };

  if (isRoot) {
    return (
      <g>
        <circle r={12} fill="#6366f1" onClick={toggleNode} className="cursor-pointer" />
        <text y={25} x={0} textAnchor="middle" className="text-xs font-bold fill-current">
          {nodeDatum.name}
        </text>
      </g>
    );
  }

  return (
    <g>
      {/* Connector line stub if needed, but react-d3-tree handles paths */}
      
      {/* Node Card via foreignObject */}
      <foreignObject
        x="-100"
        y="-40"
        width="200"
        height="100"
        style={{ overflow: 'visible' }} // Allow shadows/popovers
      >
        <div 
          className={cn(
            "flex flex-col w-[200px] bg-card border rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden",
            hasChildren ? "border-primary/50" : "border-border"
          )}
          onClick={toggleNode}
        >
          {/* Header */}
          <div className={cn(
            "px-3 py-2 text-xs font-semibold text-white flex justify-between items-center",
            hasChildren ? "bg-primary" : "bg-slate-500"
          )}>
            <span className="truncate max-w-[120px]" title={nodeDatum.name}>
              {nodeDatum.name}
            </span>
            {hasChildren && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                {directCount} Directs
              </span>
            )}
          </div>
          
          {/* Body */}
          <div className="p-2 flex flex-col gap-1 bg-background text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Personal:</span>
              <span className="font-medium">{formatCurrency(personalSales)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Team Vol:</span>
              <span className="font-bold text-primary">{formatCurrency(teamSales)}</span>
            </div>
          </div>
        </div>
      </foreignObject>
    </g>
  );
};
