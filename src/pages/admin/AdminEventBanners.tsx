import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Edit, Loader2, Megaphone, Clock, Bell, Link2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  EventBanner,
  getAllEventBanners,
  saveEventBanner,
  deleteEventBanner,
} from "@/lib/eventBanners";
import { getAllNotices, Notice } from "@/lib/notices";

const PRESET_COLORS = [
  { label: "골드", value: "from-yellow-500/20 to-yellow-500/5" },
  { label: "블루", value: "from-blue-500/20 to-blue-500/5" },
  { label: "그린", value: "from-green-500/20 to-green-500/5" },
  { label: "레드", value: "from-red-500/20 to-red-500/5" },
  { label: "퍼플", value: "from-purple-500/20 to-purple-500/5" },
  { label: "프라이머리", value: "from-primary/20 to-primary/5" },
];

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  ctaText: "",
  ctaUrl: "",
  bgColor: "from-primary/20 to-primary/5",
  textColor: "",
  endsAtStr: "",
  noExpiry: true,
  isActive: true,
  order: "0",
};

// CTA URL 입력 모드
type CtaMode = "direct" | "notice_list" | "notice_detail";

export const AdminEventBanners = () => {
  const [banners, setBanners] = useState<EventBanner[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EventBanner | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // CTA URL 모드 & 선택된 공지 ID
  const [ctaMode, setCtaMode] = useState<CtaMode>("direct");
  const [selectedNoticeId, setSelectedNoticeId] = useState<string>("");

  const load = async () => {
    setLoading(true);
    const [bannerData, noticeData] = await Promise.all([
      getAllEventBanners(),
      getAllNotices(),
    ]);
    setBanners(bannerData);
    // 활성 공지만
    const activeNotices = noticeData
      .filter((n) => n.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt - a.createdAt);
    setNotices(activeNotices);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // CTA URL 자동 계산
  const computedCtaUrl = (): string => {
    if (ctaMode === "notice_list") return "/notices";
    if (ctaMode === "notice_detail" && selectedNoticeId)
      return `/notices/${selectedNoticeId}`;
    return form.ctaUrl;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setCtaMode("direct");
    setSelectedNoticeId("");
    setOpen(true);
  };

  const openEdit = (b: EventBanner) => {
    setEditing(b);
    // ctaUrl로 모드 자동 감지
    const url = b.ctaUrl || "";
    let mode: CtaMode = "direct";
    let noticeId = "";
    if (url === "/notices") {
      mode = "notice_list";
    } else if (url.startsWith("/notices/")) {
      mode = "notice_detail";
      noticeId = url.replace("/notices/", "");
    }
    setCtaMode(mode);
    setSelectedNoticeId(noticeId);
    setForm({
      title: b.title,
      subtitle: b.subtitle || "",
      ctaText: b.ctaText || "",
      ctaUrl: mode === "direct" ? url : "",
      bgColor: b.bgColor || "from-primary/20 to-primary/5",
      textColor: b.textColor || "",
      endsAtStr: b.endsAt ? format(new Date(b.endsAt), "yyyy-MM-dd'T'HH:mm") : "",
      noExpiry: !b.endsAt,
      isActive: b.isActive,
      order: String(b.order),
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("제목을 입력하세요"); return; }
    setSaving(true);
    try {
      const endsAt = form.noExpiry || !form.endsAtStr
        ? 0
        : new Date(form.endsAtStr).getTime();

      const finalCtaUrl = computedCtaUrl();

      await saveEventBanner({
        id: editing?.id,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        ctaText: form.ctaText.trim() || undefined,
        ctaUrl: finalCtaUrl.trim() || undefined,
        bgColor: form.bgColor,
        textColor: form.textColor || undefined,
        endsAt,
        isActive: form.isActive,
        order: parseInt(form.order, 10) || 0,
      });
      toast.success(editing ? "배너가 수정되었습니다" : "배너가 생성되었습니다");
      setOpen(false);
      load();
    } catch (err: any) {
      console.error("배너 저장 에러:", err);
      toast.error("저장 실패: " + (err?.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("배너를 삭제하시겠습니까?")) return;
    setDeleting(id);
    await deleteEventBanner(id);
    toast.success("삭제됨");
    setDeleting(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">이벤트 배너</h1>
          <p className="text-muted-foreground text-sm">홈/프로필 상단에 표시되는 이벤트 배너를 관리합니다.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> 배너 추가
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" /> 배너 목록 ({banners.length})
          </CardTitle>
          <CardDescription>활성 배너는 사용자 화면 상단에 순서대로 표시됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : banners.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>배너가 없습니다. 배너를 추가해보세요.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>순서</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>CTA</TableHead>
                  <TableHead>종료</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-sm">{b.order}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{b.title}</p>
                        {b.subtitle && <p className="text-xs text-muted-foreground">{b.subtitle}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{b.ctaText || "-"}</p>
                        {b.ctaUrl && (
                          <p className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                            {b.ctaUrl}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {b.endsAt ? (
                        <span className="flex items-center gap-1 text-xs">
                          <Clock className="w-3 h-3" />
                          {format(new Date(b.endsAt), "MM/dd HH:mm")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">만료 없음</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={b.isActive ? "default" : "secondary"}>
                        {b.isActive ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(b.id)} disabled={deleting === b.id}>
                          {deleting === b.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
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

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "배너 수정" : "배너 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label>제목 *</Label>
              <Input placeholder="🎉 신규 가입자 특별 이벤트!"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            {/* Subtitle */}
            <div className="space-y-1.5">
              <Label>부제목</Label>
              <Input placeholder="지금 참여하고 보너스 받으세요"
                value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </div>

            {/* CTA 버튼 텍스트 */}
            <div className="space-y-1.5">
              <Label>CTA 버튼 텍스트</Label>
              <Input placeholder="자세히 보기"
                value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} />
            </div>

            {/* CTA URL 모드 선택 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                CTA 링크 유형
              </Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  size="sm"
                  variant={ctaMode === "direct" ? "default" : "outline"}
                  className="text-xs h-8"
                  onClick={() => setCtaMode("direct")}
                >
                  직접 입력
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={ctaMode === "notice_list" ? "default" : "outline"}
                  className="text-xs h-8 gap-1"
                  onClick={() => { setCtaMode("notice_list"); setSelectedNoticeId(""); }}
                >
                  <Bell className="w-3 h-3" />
                  공지 목록
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={ctaMode === "notice_detail" ? "default" : "outline"}
                  className="text-xs h-8 gap-1"
                  onClick={() => setCtaMode("notice_detail")}
                >
                  <Bell className="w-3 h-3" />
                  특정 공지글
                </Button>
              </div>

              {/* 직접 입력 */}
              {ctaMode === "direct" && (
                <Input
                  placeholder="https:// 또는 /path"
                  value={form.ctaUrl}
                  onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                />
              )}

              {/* 공지 목록 */}
              {ctaMode === "notice_list" && (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/40 border border-border">
                  <Bell className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-mono text-muted-foreground">/notices</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto">공지 목록 페이지</Badge>
                </div>
              )}

              {/* 특정 공지글 선택 */}
              {ctaMode === "notice_detail" && (
                <div className="space-y-2">
                  {notices.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">
                      활성 공지사항이 없습니다. 먼저 공지를 등록해주세요.
                    </p>
                  ) : (
                    <Select
                      value={selectedNoticeId}
                      onValueChange={setSelectedNoticeId}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="공지글 선택..." />
                      </SelectTrigger>
                      <SelectContent>
                        {notices.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            <span className="flex items-center gap-2">
                              <Bell className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[280px]">
                                {n.title || n.points[0] || "제목 없음"}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {selectedNoticeId && (
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/40 border border-border">
                      <span className="text-xs font-mono text-muted-foreground">
                        /notices/{selectedNoticeId}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Colors */}
            <div className="space-y-1.5">
              <Label>배경 색상</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button key={c.value}
                    onClick={() => setForm({ ...form, bgColor: c.value })}
                    className={`px-3 py-1 rounded-md text-xs border transition-all ${
                      form.bgColor === c.value ? "border-primary ring-1 ring-primary" : "border-border"
                    } bg-gradient-to-r ${c.value}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Countdown */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch checked={!form.noExpiry}
                  onCheckedChange={(v) => setForm({ ...form, noExpiry: !v })} />
                <Label>카운트다운 설정</Label>
              </div>
              {!form.noExpiry && (
                <Input type="datetime-local" value={form.endsAtStr}
                  onChange={(e) => setForm({ ...form, endsAtStr: e.target.value })} />
              )}
            </div>
            {/* Active + Order */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                <Label>활성화</Label>
              </div>
              <div className="space-y-1.5">
                <Label>표시 순서</Label>
                <Input type="number" min="0" value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </div>
            </div>
            {/* Preview */}
            <div className="space-y-1.5">
              <Label>미리보기</Label>
              <div className={`rounded-lg p-3 bg-gradient-to-r ${form.bgColor} border border-border/40`}>
                <p className="text-sm font-semibold">{form.title || "제목 미입력"}</p>
                {form.subtitle && <p className="text-xs text-muted-foreground">{form.subtitle}</p>}
                {form.ctaText && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-block text-xs px-2 py-1 rounded bg-primary text-primary-foreground">
                      {form.ctaText}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      → {computedCtaUrl() || "(URL 없음)"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEventBanners;
