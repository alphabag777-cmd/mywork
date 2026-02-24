import { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Gift, Plus, Loader2, Send, Users, Trash2, Edit2, Eye, CheckCircle2,
  XCircle, PauseCircle, PlayCircle, BarChart3, Download, RefreshCw,
  Wallet, Settings, Save, Globe, Copy, Coins,
} from "lucide-react";
import { toast } from "sonner";
import {
  AirdropCampaign, AirdropClaim, AirdropStatus,
  AirdropNetwork, AirdropSettings, AirdropTokenSymbol,
  createAirdropCampaign, updateAirdropCampaign, deleteAirdropCampaign,
  getAllAirdropCampaigns, distributeAirdrop, getCampaignClaims, getAllClaims,
  getAirdropSettings, saveAirdropSettings,
} from "@/lib/airdrop";
import { getAllUsers } from "@/lib/users";

// ── helpers ───────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<AirdropStatus, { label: string; className: string }> = {
  active: { label: "Active",  className: "bg-green-500/15 text-green-500 border-green-500/30" },
  paused: { label: "Paused",  className: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" },
  ended:  { label: "Ended",   className: "bg-zinc-500/15  text-zinc-400   border-zinc-500/30"  },
};

const CLAIM_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  claimed: { label: "Claimed", className: "bg-green-500/15 text-green-500 border-green-500/30" },
  expired: { label: "Expired", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
};

function fmtDate(ts: number | null): string {
  if (!ts) return "-";
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fmtInput(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fmtFile(): string {
  const d = new Date(); const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}`;
}

function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Default form state ────────────────────────────────────────────────────────
const DEFAULT_FORM = {
  title:            "",
  description:      "",
  tokenSymbol:      "NUMI",
  networkId:        "bsc",
  tokenAmount:      0,
  totalBudget:      0,
  targetType:       "all" as "all" | "selected",
  targetWallets:    [] as string[],
  status:           "active" as AirdropStatus,
  startAt:          Date.now(),
  endAt:            null as number | null,
  imageUrl:         "",
  requiresReferral: false,
  maxClaimCount:    null as number | null,
  claimMessage:     "에어드랍이 성공적으로 지급되었습니다!",
};

// ── Empty forms ───────────────────────────────────────────────────────────────
const EMPTY_NETWORK: Omit<AirdropNetwork, "id"> = {
  name: "", chainId: "", rpcUrl: "", explorerUrl: "", nativeCurrency: "", enabled: true,
};
const EMPTY_TOKEN: AirdropTokenSymbol = { symbol: "", name: "", enabled: true };

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminAirdrop() {
  const [campaigns, setCampaigns]         = useState<AirdropCampaign[]>([]);
  const [claims, setClaims]               = useState<AirdropClaim[]>([]);
  const [loadingCamp, setLoadingCamp]     = useState(true);
  const [loadingClaims, setLoadingClaims] = useState(false);

  // ── Settings state ──────────────────────────────────────────────────────────
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings]   = useState(false);
  const [adminWallet, setAdminWallet]         = useState("");
  const [adminWalletNote, setAdminWalletNote] = useState("");
  const [networks, setNetworks]               = useState<AirdropNetwork[]>([]);
  const [tokenSymbols, setTokenSymbols]       = useState<AirdropTokenSymbol[]>([]);

  // Network form dialog
  const [showNetworkForm, setShowNetworkForm] = useState(false);
  const [editNetworkIdx, setEditNetworkIdx]   = useState<number | null>(null);
  const [networkForm, setNetworkForm]         = useState<AirdropNetwork>({ id: "", ...EMPTY_NETWORK });

  // Token symbol form dialog
  const [showTokenForm, setShowTokenForm]   = useState(false);
  const [editTokenIdx, setEditTokenIdx]     = useState<number | null>(null);
  const [tokenForm, setTokenForm]           = useState<AirdropTokenSymbol>({ ...EMPTY_TOKEN });

  // ── Campaign form ───────────────────────────────────────────────────────────
  const [showForm, setShowForm]       = useState(false);
  const [editTarget, setEditTarget]   = useState<AirdropCampaign | null>(null);
  const [formData, setFormData]       = useState({ ...DEFAULT_FORM });
  const [saving, setSaving]           = useState(false);
  const [endDateStr, setEndDateStr]   = useState("");
  const [walletsText, setWalletsText] = useState("");

  // ── Distribute dialog ───────────────────────────────────────────────────────
  const [distribCamp, setDistribCamp]         = useState<AirdropCampaign | null>(null);
  const [distribText, setDistribText]         = useState("");
  const [distribLoading, setDistribLoading]   = useState(false);
  const [distribResult, setDistribResult]     = useState<{ success: number; skipped: number } | null>(null);
  const [distributeToAll, setDistributeToAll] = useState(false);

  // ── Claims detail dialog ────────────────────────────────────────────────────
  const [detailCamp, setDetailCamp]       = useState<AirdropCampaign | null>(null);
  const [detailClaims, setDetailClaims]   = useState<AirdropClaim[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Loaders ──────────────────────────────────────────────────────────────────
  const loadCampaigns = useCallback(async () => {
    setLoadingCamp(true);
    try { setCampaigns(await getAllAirdropCampaigns()); }
    catch { toast.error("캠페인 로드 실패"); }
    finally { setLoadingCamp(false); }
  }, []);

  const loadClaims = useCallback(async () => {
    setLoadingClaims(true);
    try { setClaims(await getAllClaims(200)); }
    catch { toast.error("클레임 로드 실패"); }
    finally { setLoadingClaims(false); }
  }, []);

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const s: AirdropSettings = await getAirdropSettings();
      setAdminWallet(s.adminWalletAddress);
      setAdminWalletNote(s.adminWalletNote);
      setNetworks(s.networks);
      setTokenSymbols(s.tokenSymbols);
    } catch { toast.error("설정 로드 실패"); }
    finally { setLoadingSettings(false); }
  }, []);

  useEffect(() => {
    loadCampaigns();
    loadClaims();
    loadSettings();
  }, [loadCampaigns, loadClaims, loadSettings]);

  // ── Settings save ──────────────────────────────────────────────────────────
  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      await saveAirdropSettings({
        adminWalletAddress: adminWallet.trim(),
        adminWalletNote:    adminWalletNote.trim(),
        networks,
        tokenSymbols,
      });
      toast.success("설정이 저장되었습니다.");
    } catch { toast.error("설정 저장 실패"); }
    finally { setSavingSettings(false); }
  }

  // ── Network CRUD ──────────────────────────────────────────────────────────
  function openAddNetwork() {
    setEditNetworkIdx(null);
    setNetworkForm({ id: "", ...EMPTY_NETWORK });
    setShowNetworkForm(true);
  }
  function openEditNetwork(idx: number) {
    setEditNetworkIdx(idx);
    setNetworkForm({ ...networks[idx] });
    setShowNetworkForm(true);
  }
  function saveNetwork() {
    if (!networkForm.name.trim())           { toast.error("네트워크 이름을 입력하세요."); return; }
    if (!networkForm.nativeCurrency.trim()) { toast.error("기본 통화를 입력하세요."); return; }
    const id = networkForm.id.trim() ||
      networkForm.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const updated: AirdropNetwork = { ...networkForm, id };
    if (editNetworkIdx !== null) {
      setNetworks(prev => prev.map((n, i) => i === editNetworkIdx ? updated : n));
    } else {
      if (networks.find(n => n.id === id)) { toast.error("같은 ID의 네트워크가 이미 있습니다."); return; }
      setNetworks(prev => [...prev, updated]);
    }
    setShowNetworkForm(false);
  }
  function removeNetwork(idx: number) {
    if (!confirm("이 네트워크를 삭제하시겠습니까?")) return;
    setNetworks(prev => prev.filter((_, i) => i !== idx));
  }
  function toggleNetworkEnabled(idx: number) {
    setNetworks(prev => prev.map((n, i) => i === idx ? { ...n, enabled: !n.enabled } : n));
  }

  // ── Token Symbol CRUD ─────────────────────────────────────────────────────
  function openAddToken() {
    setEditTokenIdx(null);
    setTokenForm({ ...EMPTY_TOKEN });
    setShowTokenForm(true);
  }
  function openEditToken(idx: number) {
    setEditTokenIdx(idx);
    setTokenForm({ ...tokenSymbols[idx] });
    setShowTokenForm(true);
  }
  function saveToken() {
    const sym = tokenForm.symbol.trim().toUpperCase();
    if (!sym) { toast.error("토큰 심볼을 입력하세요."); return; }
    const updated: AirdropTokenSymbol = { ...tokenForm, symbol: sym };
    if (editTokenIdx !== null) {
      setTokenSymbols(prev => prev.map((t, i) => i === editTokenIdx ? updated : t));
    } else {
      if (tokenSymbols.find(t => t.symbol === sym)) { toast.error("같은 심볼이 이미 있습니다."); return; }
      setTokenSymbols(prev => [...prev, updated]);
    }
    setShowTokenForm(false);
  }
  function removeToken(idx: number) {
    if (!confirm("이 토큰 심볼을 삭제하시겠습니까?")) return;
    setTokenSymbols(prev => prev.filter((_, i) => i !== idx));
  }
  function toggleTokenEnabled(idx: number) {
    setTokenSymbols(prev => prev.map((t, i) => i === idx ? { ...t, enabled: !t.enabled } : t));
  }

  // ── Campaign form ──────────────────────────────────────────────────────────
  const enabledTokens   = tokenSymbols.filter(t => t.enabled);
  const enabledNetworks = networks.filter(n => n.enabled);

  function openCreate() {
    setEditTarget(null);
    const firstToken = enabledTokens[0]?.symbol ?? "NUMI";
    const firstNet   = enabledNetworks[0]?.id   ?? "bsc";
    setFormData({ ...DEFAULT_FORM, startAt: Date.now(), tokenSymbol: firstToken, networkId: firstNet });
    setEndDateStr(""); setWalletsText("");
    setShowForm(true);
  }
  function openEdit(c: AirdropCampaign) {
    setEditTarget(c);
    setFormData({
      title: c.title, description: c.description,
      tokenSymbol: c.tokenSymbol, networkId: c.networkId ?? "bsc",
      tokenAmount: c.tokenAmount, totalBudget: c.totalBudget,
      targetType: c.targetType, targetWallets: c.targetWallets,
      status: c.status, startAt: c.startAt, endAt: c.endAt,
      imageUrl: c.imageUrl ?? "", requiresReferral: c.requiresReferral,
      maxClaimCount: c.maxClaimCount, claimMessage: c.claimMessage,
    });
    setEndDateStr(c.endAt ? fmtInput(c.endAt) : "");
    setWalletsText(c.targetWallets.join("\n"));
    setShowForm(true);
  }
  async function saveCampaign() {
    if (!formData.title.trim())    { toast.error("제목을 입력하세요."); return; }
    if (formData.tokenAmount <= 0) { toast.error("토큰 수량을 입력하세요."); return; }
    if (formData.totalBudget <= 0) { toast.error("총 예산을 입력하세요."); return; }
    const wallets = walletsText.split(/[\n,]+/)
      .map(w => w.trim().toLowerCase())
      .filter(w => w.startsWith("0x") && w.length === 42);
    const payload = {
      ...formData,
      targetWallets: formData.targetType === "selected" ? wallets : [],
      endAt: endDateStr ? new Date(endDateStr).getTime() : null,
    };
    setSaving(true);
    try {
      if (editTarget) {
        await updateAirdropCampaign(editTarget.id, payload);
        toast.success("캠페인이 업데이트되었습니다.");
      } else {
        await createAirdropCampaign(payload);
        toast.success("캠페인이 생성되었습니다.");
      }
      setShowForm(false);
      loadCampaigns();
    } catch { toast.error("저장 실패"); }
    finally { setSaving(false); }
  }

  async function toggleStatus(c: AirdropCampaign) {
    const next: AirdropStatus = c.status === "active" ? "paused" : "active";
    try {
      await updateAirdropCampaign(c.id, { status: next });
      toast.success(`상태: ${STATUS_BADGE[next].label}`);
      loadCampaigns();
    } catch { toast.error("상태 변경 실패"); }
  }
  async function handleDelete(c: AirdropCampaign) {
    if (!confirm(`"${c.title}" 캠페인을 종료하시겠습니까?`)) return;
    try {
      await deleteAirdropCampaign(c.id);
      toast.success("종료되었습니다.");
      loadCampaigns();
    } catch { toast.error("삭제 실패"); }
  }

  // ── Distribute ─────────────────────────────────────────────────────────────
  function openDistribute(c: AirdropCampaign) {
    setDistribCamp(c); setDistribText(""); setDistribResult(null);
    setDistributeToAll(c.targetType === "all");
  }
  async function runDistribute() {
    if (!distribCamp) return;
    setDistribLoading(true); setDistribResult(null);
    try {
      let wallets: string[] = [];
      if (distributeToAll) {
        const users = await getAllUsers();
        wallets = users.map(u => u.walletAddress.toLowerCase());
        toast.info(`전체 ${wallets.length}명에게 배포 중...`);
      } else {
        wallets = distribText.split(/[\n,]+/)
          .map(w => w.trim().toLowerCase())
          .filter(w => w.startsWith("0x") && w.length === 42);
        if (!wallets.length) { toast.error("유효한 주소 없음"); setDistribLoading(false); return; }
      }
      const result = await distributeAirdrop(distribCamp, wallets);
      setDistribResult(result);
      toast.success(`완료: ${result.success}명 성공, ${result.skipped}명 건너뜀`);
      loadCampaigns();
    } catch { toast.error("배포 실패"); }
    finally { setDistribLoading(false); }
  }

  async function openDetail(c: AirdropCampaign) {
    setDetailCamp(c); setDetailLoading(true);
    try { setDetailClaims(await getCampaignClaims(c.id)); }
    catch { toast.error("클레임 로드 실패"); }
    finally { setDetailLoading(false); }
  }

  function exportClaims() {
    const rows = [
      ["Campaign","Wallet","Token","Amount","Status","Claimed At","Created At"],
      ...claims.map(c => [c.campaignTitle, c.userId, c.tokenSymbol,
        c.tokenAmount.toString(), c.status, fmtDate(c.claimedAt), fmtDate(c.createdAt)]),
    ];
    downloadCSV(rows, `airdrop_claims_${fmtFile()}.csv`);
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalClaimed = campaigns.reduce((s, c) => s + (c.claimedCount ?? 0), 0);
  const totalBudget  = campaigns.reduce((s, c) => s + (c.totalBudget  ?? 0), 0);
  const activeCnt    = campaigns.filter(c => c.status === "active").length;

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" /> Airdrop Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            에어드랍 캠페인을 생성하고 유저에게 토큰을 배포합니다.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Campaigns",  value: campaigns.length,                         icon: Gift,         color: "text-primary" },
          { label: "Active Campaigns", value: activeCnt,                                icon: PlayCircle,   color: "text-green-500" },
          { label: "Total Claims",     value: totalClaimed,                             icon: CheckCircle2, color: "text-blue-500" },
          { label: "Total Budget",     value: `${totalBudget.toLocaleString()} tokens`, icon: BarChart3,    color: "text-yellow-500" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <s.icon className={`w-8 h-8 ${s.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="claims">All Claims</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1">
            <Settings className="w-3.5 h-3.5" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* ── Campaigns Tab ── */}
        <TabsContent value="campaigns" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Campaigns ({campaigns.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={loadCampaigns} className="gap-1">
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingCamp ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
              ) : campaigns.length === 0 ? (
                <div className="text-center p-10 text-muted-foreground">
                  <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>캠페인이 없습니다. 새 캠페인을 생성하세요.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Token / Network</TableHead>
                        <TableHead>Per User</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Claimed</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ends</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map(c => {
                        const sb  = STATUS_BADGE[c.status];
                        const pct = c.totalBudget > 0
                          ? Math.round((c.totalClaimed / c.totalBudget) * 100) : 0;
                        const net = networks.find(n => n.id === c.networkId);
                        return (
                          <TableRow key={c.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{c.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-mono text-sm font-semibold">{c.tokenSymbol}</p>
                              {net && <p className="text-xs text-muted-foreground">{net.name}</p>}
                            </TableCell>
                            <TableCell className="font-semibold">{c.tokenAmount.toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <span>{c.totalClaimed.toLocaleString()}</span>
                                <span className="text-muted-foreground"> / {c.totalBudget.toLocaleString()}</span>
                              </div>
                              <div className="w-24 h-1.5 bg-muted rounded-full mt-1">
                                <div className="h-1.5 bg-primary rounded-full"
                                  style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium">{c.claimedCount}</span>
                              {c.maxClaimCount && (
                                <span className="text-xs text-muted-foreground"> / {c.maxClaimCount}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {c.targetType === "all" ? "All Users" : `${c.targetWallets.length} wallets`}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${sb.className}`}>
                                {sb.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {fmtDate(c.endAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1 flex-wrap">
                                <Button size="icon" variant="ghost" className="w-8 h-8" title="View Claims" onClick={() => openDetail(c)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="w-8 h-8" title="Distribute" onClick={() => openDistribute(c)}>
                                  <Send className="w-4 h-4 text-primary" />
                                </Button>
                                <Button size="icon" variant="ghost" className="w-8 h-8"
                                  title={c.status === "active" ? "Pause" : "Resume"}
                                  onClick={() => toggleStatus(c)}>
                                  {c.status === "active"
                                    ? <PauseCircle className="w-4 h-4 text-yellow-500" />
                                    : <PlayCircle  className="w-4 h-4 text-green-500" />}
                                </Button>
                                <Button size="icon" variant="ghost" className="w-8 h-8" title="Edit" onClick={() => openEdit(c)}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="w-8 h-8" title="End Campaign" onClick={() => handleDelete(c)}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── All Claims Tab ── */}
        <TabsContent value="claims" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">All Claims ({claims.length})</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadClaims} className="gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={exportClaims} className="gap-1">
                  <Download className="w-3 h-3" /> CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingClaims ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Wallet</TableHead>
                        <TableHead>Token</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Claimed At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims.slice(0, 100).map(cl => {
                        const cb = CLAIM_BADGE[cl.status] ?? CLAIM_BADGE.pending;
                        return (
                          <TableRow key={cl.id}>
                            <TableCell className="text-sm">{cl.campaignTitle}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {cl.userId.slice(0,8)}…{cl.userId.slice(-6)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{cl.tokenSymbol}</TableCell>
                            <TableCell className="font-semibold">{cl.tokenAmount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${cb.className}`}>{cb.label}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{fmtDate(cl.claimedAt)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Settings Tab ── */}
        <TabsContent value="settings" className="mt-4 space-y-6">

          {/* ▸ Admin Wallet */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" /> 에어드랍 송금 지갑
              </CardTitle>
              <CardDescription>
                에어드랍 토큰을 발송하는 Admin 지갑 주소입니다. 캠페인 생성·배포 화면에 표시됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingSettings ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin" /></div>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Admin Wallet Address</Label>
                    <div className="flex gap-2">
                      <Input
                        value={adminWallet}
                        onChange={e => setAdminWallet(e.target.value)}
                        placeholder="0x... 또는 TRC-20 주소"
                        className="font-mono"
                      />
                      {adminWallet && (
                        <Button variant="outline" size="icon" title="복사"
                          onClick={() => { navigator.clipboard.writeText(adminWallet); toast.success("복사됨"); }}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">이 주소로 에어드랍 토큰을 미리 전송해 두세요.</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">메모 (선택)</Label>
                    <Input
                      value={adminWalletNote}
                      onChange={e => setAdminWalletNote(e.target.value)}
                      placeholder="예: BSC 메인넷 전용 지갑"
                    />
                  </div>
                  {adminWallet && (
                    <div className="p-3 rounded-lg bg-muted/50 border text-sm space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">현재 설정된 지갑</p>
                      <p className="font-mono text-xs break-all">{adminWallet}</p>
                      {adminWalletNote && <p className="text-xs text-muted-foreground">{adminWalletNote}</p>}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* ▸ Token Symbols */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Coins className="w-4 h-4 text-primary" /> 토큰 심볼 관리
                  </CardTitle>
                  <CardDescription className="mt-1">
                    캠페인 생성 시 선택할 수 있는 토큰 심볼 목록입니다.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={openAddToken} className="gap-1">
                  <Plus className="w-3.5 h-3.5" /> 토큰 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {tokenSymbols.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground text-sm">토큰 심볼이 없습니다. 추가해 주세요.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>심볼</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead>활성화</TableHead>
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokenSymbols.map((tok, idx) => (
                      <TableRow key={tok.symbol}>
                        <TableCell>
                          <span className="font-mono font-bold text-sm">{tok.symbol}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{tok.name || "-"}</TableCell>
                        <TableCell>
                          <Switch
                            checked={tok.enabled}
                            onCheckedChange={() => toggleTokenEnabled(idx)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => openEditToken(idx)}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => removeToken(idx)}>
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* ▸ Networks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" /> 코인 네트워크 관리
                  </CardTitle>
                  <CardDescription className="mt-1">
                    에어드랍 캠페인에서 선택할 수 있는 네트워크 목록입니다.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={openAddNetwork} className="gap-1">
                  <Plus className="w-3.5 h-3.5" /> 네트워크 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {networks.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground text-sm">네트워크가 없습니다. 추가해 주세요.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>네트워크</TableHead>
                      <TableHead>Chain ID</TableHead>
                      <TableHead>기본 통화</TableHead>
                      <TableHead>Explorer</TableHead>
                      <TableHead>활성화</TableHead>
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {networks.map((net, idx) => (
                      <TableRow key={net.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{net.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{net.id}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{net.chainId || "-"}</TableCell>
                        <TableCell className="font-semibold text-sm">{net.nativeCurrency}</TableCell>
                        <TableCell>
                          {net.explorerUrl ? (
                            <a href={net.explorerUrl} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline truncate max-w-[120px] block">
                              {net.explorerUrl.replace("https://", "")}
                            </a>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          <Switch checked={net.enabled} onCheckedChange={() => toggleNetworkEnabled(idx)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => openEditNetwork(idx)}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => removeNetwork(idx)}>
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Save button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={savingSettings} className="gap-2 px-6">
              {savingSettings
                ? <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중...</>
                : <><Save className="w-4 h-4" /> 설정 저장</>}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* ══ Token Symbol Form Dialog ══ */}
      <Dialog open={showTokenForm} onOpenChange={setShowTokenForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              {editTokenIdx !== null ? "토큰 심볼 편집" : "토큰 심볼 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">토큰 심볼 * (예: USDT, BNB)</Label>
              <Input
                value={tokenForm.symbol}
                onChange={e => setTokenForm(p => ({ ...p, symbol: e.target.value.toUpperCase() }))}
                placeholder="예: NUMI"
                disabled={editTokenIdx !== null}
                className="font-mono font-bold"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">토큰 이름 (선택)</Label>
              <Input
                value={tokenForm.name}
                onChange={e => setTokenForm(p => ({ ...p, name: e.target.value }))}
                placeholder="예: NUMI Token"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={tokenForm.enabled}
                onCheckedChange={v => setTokenForm(p => ({ ...p, enabled: v }))}
              />
              <Label className="text-sm">{tokenForm.enabled ? "활성화" : "비활성화"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTokenForm(false)}>취소</Button>
            <Button onClick={saveToken} className="gap-2">
              <Save className="w-4 h-4" />
              {editTokenIdx !== null ? "저장" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Network Form Dialog ══ */}
      <Dialog open={showNetworkForm} onOpenChange={setShowNetworkForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              {editNetworkIdx !== null ? "네트워크 편집" : "네트워크 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">네트워크 이름 *</Label>
                <Input
                  value={networkForm.name}
                  onChange={e => setNetworkForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="예: BNB Smart Chain (BSC)"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ID (영문/숫자/_)</Label>
                <Input
                  value={networkForm.id}
                  onChange={e => setNetworkForm(p => ({ ...p, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"") }))}
                  placeholder="예: bsc"
                  disabled={editNetworkIdx !== null}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Chain ID</Label>
                <Input
                  value={networkForm.chainId ?? ""}
                  onChange={e => setNetworkForm(p => ({ ...p, chainId: e.target.value }))}
                  placeholder="예: 56"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">기본 통화 *</Label>
                <Input
                  value={networkForm.nativeCurrency}
                  onChange={e => setNetworkForm(p => ({ ...p, nativeCurrency: e.target.value.toUpperCase() }))}
                  placeholder="예: BNB"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">활성화</Label>
                <div className="flex items-center gap-2 h-9">
                  <Switch
                    checked={networkForm.enabled}
                    onCheckedChange={v => setNetworkForm(p => ({ ...p, enabled: v }))}
                  />
                  <span className="text-sm">{networkForm.enabled ? "활성" : "비활성"}</span>
                </div>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Explorer URL</Label>
                <Input
                  value={networkForm.explorerUrl ?? ""}
                  onChange={e => setNetworkForm(p => ({ ...p, explorerUrl: e.target.value }))}
                  placeholder="예: https://bscscan.com"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">RPC URL (선택)</Label>
                <Input
                  value={networkForm.rpcUrl ?? ""}
                  onChange={e => setNetworkForm(p => ({ ...p, rpcUrl: e.target.value }))}
                  placeholder="예: https://bsc-dataseed.binance.org"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNetworkForm(false)}>취소</Button>
            <Button onClick={saveNetwork} className="gap-2">
              <Save className="w-4 h-4" />
              {editNetworkIdx !== null ? "저장" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Create / Edit Campaign Dialog ══ */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Campaign" : "New Airdrop Campaign"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Campaign Title *</Label>
                <Input
                  placeholder="e.g. Genesis Airdrop"
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea
                  placeholder="에어드랍 설명..."
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="min-h-[70px]"
                />
              </div>

              {/* Token Symbol — Settings에서 관리하는 목록 사용 */}
              <div className="space-y-1">
                <Label className="text-xs">
                  Token Symbol *
                  <span className="ml-1 text-muted-foreground font-normal">(Settings에서 추가 가능)</span>
                </Label>
                <Select
                  value={formData.tokenSymbol}
                  onValueChange={v => setFormData(p => ({ ...p, tokenSymbol: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="토큰 선택" /></SelectTrigger>
                  <SelectContent>
                    {(enabledTokens.length > 0 ? enabledTokens : tokenSymbols).map(t => (
                      <SelectItem key={t.symbol} value={t.symbol}>
                        <span className="font-mono font-bold">{t.symbol}</span>
                        {t.name && <span className="ml-2 text-muted-foreground text-xs">{t.name}</span>}
                      </SelectItem>
                    ))}
                    {tokenSymbols.length === 0 && (
                      <SelectItem value="_none" disabled>Settings에서 토큰을 추가하세요</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Network */}
              <div className="space-y-1">
                <Label className="text-xs">
                  네트워크 *
                  <span className="ml-1 text-muted-foreground font-normal">(Settings에서 추가 가능)</span>
                </Label>
                <Select
                  value={formData.networkId}
                  onValueChange={v => setFormData(p => ({ ...p, networkId: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="네트워크 선택" /></SelectTrigger>
                  <SelectContent>
                    {(enabledNetworks.length > 0 ? enabledNetworks : networks).map(n => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.name} ({n.nativeCurrency})
                      </SelectItem>
                    ))}
                    {networks.length === 0 && (
                      <SelectItem value="_none" disabled>Settings에서 네트워크를 추가하세요</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Amount per User *</Label>
                <Input
                  type="number" min="0"
                  value={formData.tokenAmount || ""}
                  onChange={e => setFormData(p => ({ ...p, tokenAmount: parseFloat(e.target.value) || 0 }))}
                  placeholder="예: 100"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Total Budget *</Label>
                <Input
                  type="number" min="0"
                  value={formData.totalBudget || ""}
                  onChange={e => setFormData(p => ({ ...p, totalBudget: parseFloat(e.target.value) || 0 }))}
                  placeholder="예: 1000000"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max Claim Count (비워두면 무제한)</Label>
                <Input
                  type="number" min="0"
                  value={formData.maxClaimCount ?? ""}
                  onChange={e => setFormData(p => ({ ...p, maxClaimCount: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="무제한"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target</Label>
                <Select
                  value={formData.targetType}
                  onValueChange={v => setFormData(p => ({ ...p, targetType: v as "all"|"selected" }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users (누구나 클레임)</SelectItem>
                    <SelectItem value="selected">Selected Wallets (지정 지갑만)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={v => setFormData(p => ({ ...p, status: v as AirdropStatus }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Date (비워두면 무제한)</Label>
                <Input
                  type="datetime-local"
                  value={endDateStr}
                  onChange={e => setEndDateStr(e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Claim Success Message</Label>
                <Input
                  value={formData.claimMessage}
                  onChange={e => setFormData(p => ({ ...p, claimMessage: e.target.value }))}
                />
              </div>
              {formData.targetType === "selected" && (
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Target Wallets (한 줄에 하나씩 또는 콤마로 구분)</Label>
                  <Textarea
                    placeholder={"0xabc...\n0xdef...\n..."}
                    value={walletsText}
                    onChange={e => setWalletsText(e.target.value)}
                    className="font-mono text-xs min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    유효한 주소: {walletsText.split(/[\n,]+/).filter(w => w.trim().startsWith("0x") && w.trim().length === 42).length}개
                  </p>
                </div>
              )}

              {/* 송금 지갑 안내 */}
              {adminWallet && (
                <div className="col-span-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm space-y-1">
                  <p className="text-xs font-medium text-primary flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5" /> 에어드랍 송금 지갑
                  </p>
                  <p className="font-mono text-xs break-all text-muted-foreground">{adminWallet}</p>
                  {adminWalletNote && <p className="text-xs text-muted-foreground">{adminWalletNote}</p>}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={saveCampaign} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editTarget ? "Update" : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Distribute Dialog ══ */}
      <Dialog open={!!distribCamp} onOpenChange={v => !v && setDistribCamp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" /> Distribute Airdrop
            </DialogTitle>
          </DialogHeader>
          {distribCamp && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-muted/50 border text-sm space-y-1">
                <p><span className="text-muted-foreground">Campaign:</span> <strong>{distribCamp.title}</strong></p>
                <p><span className="text-muted-foreground">Token:</span> <strong>{distribCamp.tokenSymbol} × {distribCamp.tokenAmount.toLocaleString()}</strong> per user</p>
                {adminWallet && (
                  <p className="text-xs"><span className="text-muted-foreground">From Wallet:</span> <span className="font-mono">{adminWallet.slice(0,10)}…{adminWallet.slice(-6)}</span></p>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant={distributeToAll ? "default" : "outline"} className="gap-1" onClick={() => setDistributeToAll(true)}>
                  <Users className="w-3 h-3" /> All Users
                </Button>
                <Button size="sm" variant={!distributeToAll ? "default" : "outline"} className="gap-1" onClick={() => setDistributeToAll(false)}>
                  <Edit2 className="w-3 h-3" /> Custom List
                </Button>
              </div>
              {!distributeToAll && (
                <div className="space-y-1">
                  <Label className="text-xs">Wallet Addresses (한 줄에 하나씩)</Label>
                  <Textarea
                    placeholder={"0xabc...\n0xdef..."}
                    value={distribText}
                    onChange={e => setDistribText(e.target.value)}
                    className="font-mono text-xs min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    유효 주소: {distribText.split(/[\n,]+/).filter(w => w.trim().startsWith("0x") && w.trim().length === 42).length}개
                  </p>
                </div>
              )}
              {distribResult && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm space-y-1">
                  <p className="font-semibold text-green-500">✓ 배포 완료</p>
                  <p>성공: <strong>{distribResult.success}명</strong></p>
                  <p>건너뜀 (중복): <strong>{distribResult.skipped}명</strong></p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDistribCamp(null)}>Cancel</Button>
            <Button onClick={runDistribute} disabled={distribLoading} className="gap-2">
              {distribLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> 배포 중...</>
                : <><Send className="w-4 h-4" /> 배포 실행</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Claims Detail Dialog ══ */}
      <Dialog open={!!detailCamp} onOpenChange={v => !v && setDetailCamp(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailCamp?.title} — Claims</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Claimed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailClaims.map(cl => {
                    const cb = CLAIM_BADGE[cl.status] ?? CLAIM_BADGE.pending;
                    return (
                      <TableRow key={cl.id}>
                        <TableCell className="font-mono text-xs">{cl.userId.slice(0,10)}…{cl.userId.slice(-6)}</TableCell>
                        <TableCell className="font-semibold">{cl.tokenAmount.toLocaleString()} {cl.tokenSymbol}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${cb.className}`}>{cb.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(cl.claimedAt)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {detailClaims.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        클레임 기록이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" className="gap-1"
              onClick={() => {
                const rows = [["Wallet","Amount","Token","Status","Claimed At"],
                  ...detailClaims.map(c => [c.userId, c.tokenAmount.toString(), c.tokenSymbol, c.status, fmtDate(c.claimedAt)])];
                downloadCSV(rows, `claims_${detailCamp?.id ?? "export"}.csv`);
              }}>
              <Download className="w-3 h-3" /> Export CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
