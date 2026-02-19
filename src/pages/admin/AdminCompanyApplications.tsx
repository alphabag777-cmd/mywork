import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Building2, ArrowLeft, Loader2, Trash2, CheckCircle2,
  XCircle, Clock, ExternalLink, Search, RefreshCw, Mail,
  Phone, Globe, User, FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import {
  CompanyApplication,
  getAllCompanyApplications,
  updateCompanyApplicationStatus,
  deleteCompanyApplication,
} from "@/lib/company_applications";

/* ── 상태별 Badge ─────────────────────────────────────────── */
function StatusBadge({ status }: { status: CompanyApplication["status"] }) {
  if (status === "approved")
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1"><CheckCircle2 className="w-3 h-3" />Approved</Badge>;
  if (status === "rejected")
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>;
  return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
}

export default function AdminCompanyApplications() {
  const [apps, setApps] = useState<CompanyApplication[]>([]);
  const [filtered, setFiltered] = useState<CompanyApplication[]>([]);
  const [selected, setSelected] = useState<CompanyApplication | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CompanyApplication | null>(null);

  /* ── 로드 ── */
  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllCompanyApplications();
      setApps(data);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── 필터링 ── */
  useEffect(() => {
    let list = apps;
    if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.companyName.toLowerCase().includes(q) ||
          a.contactPerson.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [apps, statusFilter, search]);

  /* ── 상태 변경 ── */
  const handleStatus = async (status: CompanyApplication["status"]) => {
    if (!selected?.id) return;
    setActionLoading(true);
    try {
      await updateCompanyApplicationStatus(selected.id, status, adminNote.trim() || undefined);
      toast.success(`Application ${status}`);
      const updated = { ...selected, status, adminNote: adminNote.trim() || selected.adminNote, reviewedAt: Date.now() };
      setSelected(updated);
      setApps((prev) => prev.map((a) => (a.id === selected.id ? updated : a)));
    } catch {
      toast.error("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  /* ── 삭제 ── */
  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setActionLoading(true);
    try {
      await deleteCompanyApplication(deleteTarget.id);
      toast.success("Application deleted");
      setApps((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setActionLoading(false);
    }
  };

  /* ── 통계 ── */
  const counts = {
    total: apps.length,
    pending: apps.filter((a) => a.status === "pending").length,
    approved: apps.filter((a) => a.status === "approved").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
  };

  /* ────────────────────────────────────────────────────────── */
  if (selected) {
    return (
      <div className="space-y-4">
        {/* 상단 네비 */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => { setSelected(null); setAdminNote(""); }}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to List
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(selected)}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ── 신청 상세 ── */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {selected.logoUrl ? (
                      <img src={selected.logoUrl} alt="logo" className="w-14 h-14 rounded-xl object-contain border border-border/50" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-primary" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-xl">{selected.companyName}</CardTitle>
                      <CardDescription>
                        Submitted {format(new Date(selected.createdAt), "PPP p")}
                      </CardDescription>
                    </div>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow icon={<User className="w-4 h-4" />} label="Contact" value={selected.contactPerson} />
                  <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={
                    <a href={`mailto:${selected.email}`} className="text-primary hover:underline">{selected.email}</a>
                  } />
                  <InfoRow icon={<Phone className="w-4 h-4" />} label="Telegram / Phone" value={selected.telegramId} />
                  <InfoRow icon={<Globe className="w-4 h-4" />} label="Website" value={
                    <a href={selected.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      {selected.websiteUrl} <ExternalLink className="w-3 h-3" />
                    </a>
                  } />
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Description
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{selected.description}</p>
                </div>
                {selected.adminNote && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Admin Note</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.adminNote}</p>
                    </div>
                  </>
                )}
                {selected.reviewedAt && (
                  <p className="text-xs text-muted-foreground">
                    Reviewed: {format(new Date(selected.reviewedAt), "PPP p")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── 관리자 액션 패널 ── */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Review Application</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Admin Note (optional)</p>
                  <Textarea
                    placeholder="Add internal notes or reason for decision..."
                    className="min-h-[100px] text-sm"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white w-full"
                    disabled={actionLoading || selected.status === "approved"}
                    onClick={() => handleStatus("approved")}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={actionLoading || selected.status === "rejected"}
                    onClick={() => handleStatus("rejected")}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={actionLoading || selected.status === "pending"}
                    onClick={() => handleStatus("pending")}
                  >
                    <Clock className="w-4 h-4 mr-2" /> Set Pending
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 삭제 확인 다이얼로그 */}
        <DeleteDialog
          target={deleteTarget}
          loading={actionLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    );
  }

  /* ────────────────────────── 목록 뷰 ──────────────────────── */
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" /> Company Applications
          </h1>
          <p className="text-sm text-muted-foreground">Review partnership applications submitted by companies.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.total, color: "text-foreground" },
          { label: "Pending", value: counts.pending, color: "text-yellow-400" },
          { label: "Approved", value: counts.approved, color: "text-green-400" },
          { label: "Rejected", value: counts.rejected, color: "text-red-400" },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* 필터 */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by company, contact, email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 테이블 */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No applications found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telegram</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((app) => (
                    <TableRow key={app.id} className="cursor-pointer hover:bg-muted/40" onClick={() => { setSelected(app); setAdminNote(app.adminNote || ""); }}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {app.logoUrl ? (
                            <img src={app.logoUrl} alt="" className="w-7 h-7 rounded object-contain border border-border/40" />
                          ) : (
                            <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-primary" />
                            </div>
                          )}
                          <span className="font-medium text-sm">{app.companyName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{app.contactPerson}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{app.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{app.telegramId}</TableCell>
                      <TableCell><StatusBadge status={app.status} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(app.createdAt), "MM/dd/yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(app); }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <DeleteDialog
        target={deleteTarget}
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

/* ── 헬퍼 컴포넌트 ── */
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function DeleteDialog({
  target, loading, onConfirm, onCancel,
}: {
  target: CompanyApplication | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Application</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the application from{" "}
            <strong>{target?.companyName}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
