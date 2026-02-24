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
import {
  Gift, Plus, Loader2, Send, Users, Trash2, Edit2, Eye, CheckCircle2,
  XCircle, PauseCircle, PlayCircle, BarChart3, Download, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  AirdropCampaign, AirdropClaim, AirdropStatus,
  createAirdropCampaign, updateAirdropCampaign, deleteAirdropCampaign,
  getAllAirdropCampaigns, distributeAirdrop, getCampaignClaims, getAllClaims,
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
  a.href     = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Default form state ────────────────────────────────────────────────────────
const DEFAULT_FORM = {
  title:            "",
  description:      "",
  tokenSymbol:      "NUMI",
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

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminAirdrop() {
  const [campaigns, setCampaigns]         = useState<AirdropCampaign[]>([]);
  const [claims, setClaims]               = useState<AirdropClaim[]>([]);
  const [loadingCamp, setLoadingCamp]     = useState(true);
  const [loadingClaims, setLoadingClaims] = useState(false);

  // Create / Edit dialog
  const [showForm, setShowForm]     = useState(false);
  const [editTarget, setEditTarget] = useState<AirdropCampaign | null>(null);
  const [formData, setFormData]     = useState({ ...DEFAULT_FORM });
  const [saving, setSaving]         = useState(false);
  const [endDateStr, setEndDateStr] = useState("");
  const [walletsText, setWalletsText] = useState("");

  // Distribute dialog
  const [distribCamp, setDistribCamp]     = useState<AirdropCampaign | null>(null);
  const [distribText, setDistribText]     = useState("");
  const [distribLoading, setDistribLoading] = useState(false);
  const [distribResult, setDistribResult]   = useState<{ success: number; skipped: number } | null>(null);
  const [distributeToAll, setDistributeToAll] = useState(false);

  // Claims detail dialog
  const [detailCamp, setDetailCamp]   = useState<AirdropCampaign | null>(null);
  const [detailClaims, setDetailClaims] = useState<AirdropClaim[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Load campaigns ──────────────────────────────────────────────────────────
  const loadCampaigns = useCallback(async () => {
    setLoadingCamp(true);
    try {
      const data = await getAllAirdropCampaigns();
      setCampaigns(data);
    } catch { toast.error("캠페인 로드 실패"); }
    finally { setLoadingCamp(false); }
  }, []);

  const loadClaims = useCallback(async () => {
    setLoadingClaims(true);
    try {
      const data = await getAllClaims(200);
      setClaims(data);
    } catch { toast.error("클레임 로드 실패"); }
    finally { setLoadingClaims(false); }
  }, []);

  useEffect(() => { loadCampaigns(); loadClaims(); }, [loadCampaigns, loadClaims]);

  // ── Open create form ────────────────────────────────────────────────────────
  function openCreate() {
    setEditTarget(null);
    setFormData({ ...DEFAULT_FORM, startAt: Date.now() });
    setEndDateStr("");
    setWalletsText("");
    setShowForm(true);
  }

  // ── Open edit form ──────────────────────────────────────────────────────────
  function openEdit(c: AirdropCampaign) {
    setEditTarget(c);
    setFormData({
      title:            c.title,
      description:      c.description,
      tokenSymbol:      c.tokenSymbol,
      tokenAmount:      c.tokenAmount,
      totalBudget:      c.totalBudget,
      targetType:       c.targetType,
      targetWallets:    c.targetWallets,
      status:           c.status,
      startAt:          c.startAt,
      endAt:            c.endAt,
      imageUrl:         c.imageUrl ?? "",
      requiresReferral: c.requiresReferral,
      maxClaimCount:    c.maxClaimCount,
      claimMessage:     c.claimMessage,
    });
    setEndDateStr(c.endAt ? fmtInput(c.endAt) : "");
    setWalletsText(c.targetWallets.join("\n"));
    setShowForm(true);
  }

  // ── Save campaign ───────────────────────────────────────────────────────────
  async function saveCampaign() {
    if (!formData.title.trim())        { toast.error("제목을 입력하세요."); return; }
    if (formData.tokenAmount <= 0)     { toast.error("토큰 수량을 입력하세요."); return; }
    if (formData.totalBudget <= 0)     { toast.error("총 예산을 입력하세요."); return; }

    const wallets = walletsText
      .split(/[\n,]+/)
      .map(w => w.trim().toLowerCase())
      .filter(w => w.startsWith("0x") && w.length === 42);

    const payload = {
      ...formData,
      targetWallets: formData.targetType === "selected" ? wallets : [],
      endAt:         endDateStr ? new Date(endDateStr).getTime() : null,
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

  // ── Toggle status ───────────────────────────────────────────────────────────
  async function toggleStatus(c: AirdropCampaign) {
    const next: AirdropStatus = c.status === "active" ? "paused" : "active";
    try {
      await updateAirdropCampaign(c.id, { status: next });
      toast.success(`상태가 ${STATUS_BADGE[next].label}로 변경되었습니다.`);
      loadCampaigns();
    } catch { toast.error("상태 변경 실패"); }
  }

  // ── Delete campaign ─────────────────────────────────────────────────────────
  async function handleDelete(c: AirdropCampaign) {
    if (!confirm(`"${c.title}" 캠페인을 종료하시겠습니까?`)) return;
    try {
      await deleteAirdropCampaign(c.id);
      toast.success("캠페인이 종료되었습니다.");
      loadCampaigns();
    } catch { toast.error("삭제 실패"); }
  }

  // ── Open distribute dialog ──────────────────────────────────────────────────
  function openDistribute(c: AirdropCampaign) {
    setDistribCamp(c);
    setDistribText("");
    setDistribResult(null);
    setDistributeToAll(c.targetType === "all");
  }

  // ── Run distribute ──────────────────────────────────────────────────────────
  async function runDistribute() {
    if (!distribCamp) return;
    setDistribLoading(true);
    setDistribResult(null);
    try {
      let wallets: string[] = [];
      if (distributeToAll) {
        const users = await getAllUsers();
        wallets = users.map(u => u.walletAddress.toLowerCase());
        toast.info(`전체 ${wallets.length}명에게 배포 중...`);
      } else {
        wallets = distribText
          .split(/[\n,]+/)
          .map(w => w.trim().toLowerCase())
          .filter(w => w.startsWith("0x") && w.length === 42);
        if (wallets.length === 0) { toast.error("유효한 지갑 주소가 없습니다."); setDistribLoading(false); return; }
      }
      const result = await distributeAirdrop(distribCamp, wallets);
      setDistribResult(result);
      toast.success(`배포 완료: ${result.success}명 성공, ${result.skipped}명 건너뜀`);
      loadCampaigns();
    } catch { toast.error("배포 실패"); }
    finally { setDistribLoading(false); }
  }

  // ── Open claim detail ───────────────────────────────────────────────────────
  async function openDetail(c: AirdropCampaign) {
    setDetailCamp(c);
    setDetailLoading(true);
    try {
      const data = await getCampaignClaims(c.id);
      setDetailClaims(data);
    } catch { toast.error("클레임 데이터 로드 실패"); }
    finally { setDetailLoading(false); }
  }

  // ── Export CSV ──────────────────────────────────────────────────────────────
  function exportClaims() {
    const rows = [
      ["Campaign", "Wallet", "Token", "Amount", "Status", "Claimed At", "Created At"],
      ...claims.map(c => [
        c.campaignTitle, c.userId, c.tokenSymbol,
        c.tokenAmount.toString(), c.status,
        fmtDate(c.claimedAt), fmtDate(c.createdAt),
      ]),
    ];
    downloadCSV(rows, `airdrop_claims_${fmtFile()}.csv`);
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  const totalClaimed  = campaigns.reduce((s, c) => s + (c.claimedCount ?? 0), 0);
  const totalBudget   = campaigns.reduce((s, c) => s + (c.totalBudget  ?? 0), 0);
  const activeCnt     = campaigns.filter(c => c.status === "active").length;

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
          { label: "Total Campaigns",    value: campaigns.length,          icon: Gift,         color: "text-primary" },
          { label: "Active Campaigns",   value: activeCnt,                 icon: PlayCircle,   color: "text-green-500" },
          { label: "Total Claims",       value: totalClaimed,              icon: CheckCircle2, color: "text-blue-500" },
          { label: "Total Budget",       value: `${totalBudget.toLocaleString()} tokens`, icon: BarChart3, color: "text-yellow-500" },
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
                        <TableHead>Token</TableHead>
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
                        const sb = STATUS_BADGE[c.status];
                        const pct = c.totalBudget > 0
                          ? Math.round((c.totalClaimed / c.totalBudget) * 100) : 0;
                        return (
                          <TableRow key={c.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{c.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{c.tokenSymbol}</TableCell>
                            <TableCell className="font-semibold">{c.tokenAmount.toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <span>{c.totalClaimed.toLocaleString()}</span>
                                <span className="text-muted-foreground"> / {c.totalBudget.toLocaleString()}</span>
                              </div>
                              <div className="w-24 h-1.5 bg-muted rounded-full mt-1">
                                <div
                                  className="h-1.5 bg-primary rounded-full"
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
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
                                <Button
                                  size="icon" variant="ghost" className="w-8 h-8"
                                  title="View Claims"
                                  onClick={() => openDetail(c)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon" variant="ghost" className="w-8 h-8"
                                  title="Distribute"
                                  onClick={() => openDistribute(c)}
                                >
                                  <Send className="w-4 h-4 text-primary" />
                                </Button>
                                <Button
                                  size="icon" variant="ghost" className="w-8 h-8"
                                  title={c.status === "active" ? "Pause" : "Resume"}
                                  onClick={() => toggleStatus(c)}
                                >
                                  {c.status === "active"
                                    ? <PauseCircle className="w-4 h-4 text-yellow-500" />
                                    : <PlayCircle  className="w-4 h-4 text-green-500" />}
                                </Button>
                                <Button
                                  size="icon" variant="ghost" className="w-8 h-8"
                                  title="Edit"
                                  onClick={() => openEdit(c)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon" variant="ghost" className="w-8 h-8"
                                  title="End Campaign"
                                  onClick={() => handleDelete(c)}
                                >
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
                              {cl.userId.slice(0, 8)}…{cl.userId.slice(-6)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{cl.tokenSymbol}</TableCell>
                            <TableCell className="font-semibold">{cl.tokenAmount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${cb.className}`}>
                                {cb.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {fmtDate(cl.claimedAt)}
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
      </Tabs>

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
              <div className="space-y-1">
                <Label className="text-xs">Token Symbol *</Label>
                <Select
                  value={formData.tokenSymbol}
                  onValueChange={v => setFormData(p => ({ ...p, tokenSymbol: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["NUMI","USDT","BNB","SBAG"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
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
                  onValueChange={v => setFormData(p => ({ ...p, targetType: v as "all" | "selected" }))}
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
              <Send className="w-5 h-5 text-primary" />
              Distribute Airdrop
            </DialogTitle>
          </DialogHeader>
          {distribCamp && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-muted/50 border text-sm space-y-1">
                <p><span className="text-muted-foreground">Campaign:</span> <strong>{distribCamp.title}</strong></p>
                <p><span className="text-muted-foreground">Token:</span> <strong>{distribCamp.tokenSymbol} × {distribCamp.tokenAmount.toLocaleString()}</strong> per user</p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={distributeToAll ? "default" : "outline"}
                  className="gap-1"
                  onClick={() => setDistributeToAll(true)}
                >
                  <Users className="w-3 h-3" /> All Users
                </Button>
                <Button
                  size="sm"
                  variant={!distributeToAll ? "default" : "outline"}
                  className="gap-1"
                  onClick={() => setDistributeToAll(false)}
                >
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
                        <TableCell className="font-mono text-xs">
                          {cl.userId.slice(0, 10)}…{cl.userId.slice(-6)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {cl.tokenAmount.toLocaleString()} {cl.tokenSymbol}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${cb.className}`}>
                            {cb.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {fmtDate(cl.claimedAt)}
                        </TableCell>
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
            <Button
              variant="outline" size="sm"
              onClick={() => {
                const rows = [
                  ["Wallet","Amount","Token","Status","Claimed At"],
                  ...detailClaims.map(c => [c.userId, c.tokenAmount.toString(), c.tokenSymbol, c.status, fmtDate(c.claimedAt)]),
                ];
                downloadCSV(rows, `claims_${detailCamp?.id ?? "export"}.csv`);
              }}
              className="gap-1"
            >
              <Download className="w-3 h-3" /> Export CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
