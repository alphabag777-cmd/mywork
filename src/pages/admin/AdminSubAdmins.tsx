/**
 * AdminSubAdmins.tsx
 * 부운영자 관리 페이지 (admin 전용)
 * - 목록 조회, 생성, 수정, 삭제
 * - 각 부운영자에게 허용할 권한(메뉴)을 개별 설정
 * - users-org, airdrop은 부운영자에게 절대 부여 불가
 */

import { useState, useEffect, useCallback } from "react";
import {
  UserCog, Plus, Pencil, Trash2, Check, X, Shield, ShieldOff,
  RefreshCw, Eye, EyeOff, ChevronDown, ChevronUp, Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAllSubAdmins,
  createSubAdmin,
  updateSubAdmin,
  deleteSubAdmin,
  SUB_ADMIN_PERMISSIONS,
  ALL_SUB_PERMISSIONS,
  type SubAdmin,
  type AdminPermission,
} from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";

// ── 날짜 포맷 ─────────────────────────────────────────────────────────────────
function fmtDate(ts: unknown): string {
  if (!ts) return "—";
  try {
    const d =
      typeof ts === "object" && ts !== null && "toDate" in ts
        ? (ts as { toDate: () => Date }).toDate()
        : new Date(ts as string | number);
    return d.toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" });
  } catch {
    return "—";
  }
}

// ── 기본 폼 ───────────────────────────────────────────────────────────────────
const defaultForm = {
  username: "",
  password: "",
  note: "",
  permissions: ALL_SUB_PERMISSIONS as AdminPermission[],
};

export default function AdminSubAdmins() {
  const { toast } = useToast();
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(false);

  // 다이얼로그 상태
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubAdmin | null>(null);

  // 폼 상태
  const [form, setForm] = useState({ ...defaultForm });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── 목록 로드 ───────────────────────────────────────────────────────────────
  const loadSubAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getAllSubAdmins();
      setSubAdmins(list);
    } catch (e) {
      toast({ title: "오류", description: "부운영자 목록을 불러오지 못했습니다.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadSubAdmins(); }, [loadSubAdmins]);

  // ── 권한 토글 ───────────────────────────────────────────────────────────────
  function togglePermission(key: AdminPermission) {
    setForm(prev => {
      const has = prev.permissions.includes(key);
      return {
        ...prev,
        permissions: has
          ? prev.permissions.filter(p => p !== key)
          : [...prev.permissions, key],
      };
    });
  }

  function toggleAllPermissions(on: boolean) {
    setForm(prev => ({ ...prev, permissions: on ? [...ALL_SUB_PERMISSIONS] : [] }));
  }

  // ── 생성 ────────────────────────────────────────────────────────────────────
  function openCreate() {
    setForm({ ...defaultForm });
    setShowPw(false);
    setCreateOpen(true);
  }

  async function handleCreate() {
    setSaving(true);
    try {
      const res = await createSubAdmin({
        username: form.username,
        password: form.password,
        permissions: form.permissions,
        note: form.note,
      });
      if (res.ok) {
        toast({ title: "생성 완료", description: res.message });
        setCreateOpen(false);
        await loadSubAdmins();
      } else {
        toast({ title: "오류", description: res.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "부운영자 생성 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  // ── 수정 ────────────────────────────────────────────────────────────────────
  function openEdit(sa: SubAdmin) {
    setForm({
      username: sa.username,
      password: "",
      note: sa.note ?? "",
      permissions: sa.permissions ?? [],
    });
    setShowPw(false);
    setEditTarget(sa);
  }

  async function handleEdit() {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await updateSubAdmin(editTarget.id, {
        username: form.username,
        password: form.password || undefined,
        permissions: form.permissions,
        note: form.note,
      });
      if (res.ok) {
        toast({ title: "수정 완료", description: res.message });
        setEditTarget(null);
        await loadSubAdmins();
      } else {
        toast({ title: "오류", description: res.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "부운영자 수정 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  // ── 삭제 ────────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await deleteSubAdmin(deleteTarget.id);
      if (res.ok) {
        toast({ title: "삭제 완료", description: res.message });
        setDeleteTarget(null);
        await loadSubAdmins();
      } else {
        toast({ title: "오류", description: res.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "부운영자 삭제 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  // ── 권한 선택 UI ─────────────────────────────────────────────────────────────
  const PermissionsSelector = () => {
    const allSelected = form.permissions.length === SUB_ADMIN_PERMISSIONS.length;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">허용 메뉴 권한</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => toggleAllPermissions(!allSelected)}
          >
            {allSelected ? "전체 해제" : "전체 선택"}
          </Button>
        </div>
        <div className="border border-border/60 rounded-lg p-3 space-y-2 bg-muted/20">
          {SUB_ADMIN_PERMISSIONS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-sm text-foreground">{label}</span>
              <Switch
                checked={form.permissions.includes(key)}
                onCheckedChange={() => togglePermission(key)}
              />
            </div>
          ))}
          <div className="pt-2 border-t border-border/40">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldOff className="w-3 h-3" />
              Users &amp; Org, Airdrop, Sub-Admins 메뉴는 admin 전용으로 부운영자에게 부여 불가
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ── 렌더링 ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <UserCog className="w-6 h-6 text-primary" />
            부운영자 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            부운영자 계정을 생성하고 허용 메뉴 권한을 설정합니다.
            Users &amp; Org, Airdrop, Sub-Admins는 admin 전용입니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadSubAdmins} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" />
            부운영자 추가
          </Button>
        </div>
      </div>

      {/* 권한 안내 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-border/60 rounded-lg p-4 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Admin (관리자)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            모든 메뉴에 접근 가능 · Dashboard · Plans · Content · Users &amp; Org ·
            Assets · Support · Notifications · Airdrop · Sub-Admins
          </p>
        </div>
        <div className="border border-border/60 rounded-lg p-4 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-600">Sub-Admin (부운영자)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            허용된 메뉴만 접근 가능 · Users &amp; Org, Airdrop, Sub-Admins는 항상 제외
          </p>
        </div>
      </div>

      {/* 목록 테이블 */}
      <div className="border border-border/60 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>아이디</TableHead>
              <TableHead>허용 메뉴</TableHead>
              <TableHead>메모</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                  불러오는 중...
                </TableCell>
              </TableRow>
            ) : subAdmins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  등록된 부운영자가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              subAdmins.map((sa) => (
                <>
                  <TableRow key={sa.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-600 dark:text-amber-400 text-xs font-bold px-1.5 py-0.5 bg-amber-500/10 rounded">
                          SUB
                        </span>
                        {sa.username}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(sa.permissions ?? []).length === 0 ? (
                          <span className="text-xs text-muted-foreground">권한 없음</span>
                        ) : (sa.permissions ?? []).length === SUB_ADMIN_PERMISSIONS.length ? (
                          <Badge variant="secondary" className="text-xs">전체 권한</Badge>
                        ) : (
                          <button
                            type="button"
                            className="text-xs text-primary underline-offset-2 hover:underline flex items-center gap-0.5"
                            onClick={() => setExpandedId(expandedId === sa.id ? null : sa.id)}
                          >
                            {(sa.permissions ?? []).length}개 권한
                            {expandedId === sa.id
                              ? <ChevronUp className="w-3 h-3" />
                              : <ChevronDown className="w-3 h-3" />
                            }
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                      {sa.note || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmtDate(sa.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(sa)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(sa)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* 권한 확장 행 */}
                  {expandedId === sa.id && (
                    <TableRow key={`${sa.id}-expand`} className="bg-muted/20">
                      <TableCell colSpan={5} className="py-2 px-6">
                        <div className="flex flex-wrap gap-1.5">
                          {SUB_ADMIN_PERMISSIONS.map(({ key, label }) => {
                            const has = (sa.permissions ?? []).includes(key);
                            return (
                              <span
                                key={key}
                                className={`text-xs px-2 py-0.5 rounded-full border ${
                                  has
                                    ? "bg-primary/10 border-primary/30 text-primary"
                                    : "bg-muted/40 border-border/40 text-muted-foreground line-through"
                                }`}
                              >
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── 생성 다이얼로그 ────────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> 부운영자 추가
            </DialogTitle>
            <DialogDescription>
              새 부운영자 계정을 생성하고 허용할 메뉴 권한을 설정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">아이디 *</label>
              <Input
                placeholder="3자 이상 입력"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">비밀번호 *</label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="6자 이상 입력"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPw(v => !v)}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">메모 (선택)</label>
              <Input
                placeholder="예: 고객지원 담당자"
                value={form.note}
                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              />
            </div>
            <PermissionsSelector />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
              취소
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !form.username.trim() || !form.password}
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 수정 다이얼로그 ────────────────────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={v => !v && setEditTarget(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4" /> 부운영자 수정
            </DialogTitle>
            <DialogDescription>
              아이디, 비밀번호, 권한을 수정합니다. 비밀번호를 비워두면 변경되지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">아이디 *</label>
              <Input
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1">
                <Key className="w-3.5 h-3.5" />
                새 비밀번호 (변경 시에만 입력)
              </label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="변경하지 않으려면 비워두세요"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPw(v => !v)}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">메모</label>
              <Input
                value={form.note}
                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              />
            </div>
            <PermissionsSelector />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={saving}>
              취소
            </Button>
            <Button
              onClick={handleEdit}
              disabled={saving || !form.username.trim()}
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 삭제 확인 다이얼로그 ──────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" /> 부운영자 삭제
            </DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.username}</strong> 계정을 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={saving}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
