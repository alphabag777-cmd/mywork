/**
 * AdminKyc.tsx
 * KYC 인증 신청 관리 (관리자용) - 승인/거절
 */

import { useState, useEffect } from "react";
import { getAllKyc, approveKyc, rejectKyc, KycData } from "@/lib/kyc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Clock,
  Phone,
  Mail,
  User,
} from "lucide-react";

type FilterStatus = "all" | "pending" | "approved" | "rejected";

export function AdminKyc() {
  const { toast } = useToast();
  const [list, setList]           = useState<KycData[]>([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<FilterStatus>("pending");
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllKyc();
      setList(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* 필터링 */
  const filtered = list.filter((k) => {
    const matchStatus = filter === "all" || k.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      k.name.toLowerCase().includes(q) ||
      k.email.toLowerCase().includes(q) ||
      k.phone.includes(q) ||
      k.id.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  /* 상태 뱃지 */
  const StatusBadge = ({ status }: { status: KycData["status"] }) => {
    const map = {
      pending:  { label: "심사 중",   cls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", icon: <Clock className="w-3 h-3" /> },
      approved: { label: "승인",      cls: "bg-green-500/10 text-green-500 border-green-500/30",  icon: <CheckCircle2 className="w-3 h-3" /> },
      rejected: { label: "거절",      cls: "bg-red-500/10 text-red-500 border-red-500/30",        icon: <XCircle className="w-3 h-3" /> },
      none:     { label: "미제출",    cls: "bg-muted text-muted-foreground",                       icon: null },
    };
    const s = map[status] || map.none;
    return (
      <Badge variant="outline" className={`gap-1 ${s.cls}`}>
        {s.icon}{s.label}
      </Badge>
    );
  };

  /* 승인 */
  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await approveKyc(id);
      toast({ title: "✅ KYC 승인 완료", description: `${id.slice(0, 10)}... 승인됨` });
      await load();
    } catch {
      toast({ title: "❌ 오류", description: "승인에 실패했습니다.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  /* 거절 확인 */
  const handleRejectConfirm = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await rejectKyc(rejectTarget, rejectReason.trim());
      toast({ title: "❌ KYC 거절 완료" });
      setRejectTarget(null);
      setRejectReason("");
      await load();
    } catch {
      toast({ title: "❌ 오류", description: "거절에 실패했습니다.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  /* 카운트 */
  const counts = {
    all:      list.length,
    pending:  list.filter(k => k.status === "pending").length,
    approved: list.filter(k => k.status === "approved").length,
    rejected: list.filter(k => k.status === "rejected").length,
  };

  return (
    <div className="space-y-4">
      {/* 상단 통계 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["all","pending","approved","rejected"] as FilterStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`p-3 rounded-xl border text-left transition-all ${
              filter === s
                ? "border-primary bg-primary/10"
                : "border-border/60 bg-card hover:bg-muted/50"
            }`}
          >
            <p className="text-xs text-muted-foreground capitalize">
              {s === "all" ? "전체" : s === "pending" ? "심사 중" : s === "approved" ? "승인됨" : "거절됨"}
            </p>
            <p className="text-2xl font-bold mt-1">{counts[s]}</p>
          </button>
        ))}
      </div>

      {/* 검색 + 새로고침 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="이름, 이메일, 전화번호, ID 검색"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[180px]">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />이름</span>
              </TableHead>
              <TableHead>
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />이메일</span>
              </TableHead>
              <TableHead>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />전화번호</span>
              </TableHead>
              <TableHead>상태</TableHead>
              <TableHead>제출일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                  불러오는 중...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>KYC 신청 내역이 없습니다.</p>
                </TableCell>
              </TableRow>
            ) : filtered.map((k) => (
              <TableRow key={k.id} className="hover:bg-muted/20">
                <TableCell className="font-medium">
                  <div>
                    <p className="font-semibold">{k.name || "-"}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">{k.id}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{k.email || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{k.phone || "-"}</span>
                    {k.phoneVerified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <StatusBadge status={k.status} />
                    {k.status === "rejected" && k.rejectReason && (
                      <p className="text-xs text-red-400 mt-1 max-w-[120px] truncate" title={k.rejectReason}>
                        {k.rejectReason}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {k.submittedAt ? new Date(k.submittedAt).toLocaleDateString("ko-KR") : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {k.status === "pending" && (
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white gap-1"
                        onClick={() => handleApprove(k.id)}
                        disabled={actionLoading}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2 gap-1"
                        onClick={() => { setRejectTarget(k.id); setRejectReason(""); }}
                        disabled={actionLoading}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        거절
                      </Button>
                    </div>
                  )}
                  {k.status === "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-red-500 border-red-300 hover:bg-red-50 gap-1"
                      onClick={() => { setRejectTarget(k.id); setRejectReason(""); }}
                      disabled={actionLoading}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      취소
                    </Button>
                  )}
                  {k.status === "rejected" && (
                    <Button
                      size="sm"
                      className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white gap-1"
                      onClick={() => handleApprove(k.id)}
                      disabled={actionLoading}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      재승인
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 거절 사유 다이얼로그 */}
      <Dialog open={!!rejectTarget} onOpenChange={(v) => !v && setRejectTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              KYC 거절
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-sm">거절 사유 (사용자에게 표시됨)</Label>
            <Textarea
              placeholder="거절 사유를 입력해 주세요."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectTarget(null)}>취소</Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || actionLoading}
            >
              {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "거절 확인"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
