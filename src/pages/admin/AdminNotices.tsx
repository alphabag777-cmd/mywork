import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FileText, Trash2, Edit, Save, X, PlusSquare, Eye, EyeOff,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Notice, getAllNotices, saveNotice, deleteNotice } from "@/lib/notices";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

export const AdminNotices = () => {
  const [notices, setNotices]               = useState<Notice[]>([]);
  const [editingNotice, setEditingNotice]   = useState<Notice | null>(null);
  const [isDialogOpen, setIsDialogOpen]     = useState(false);
  const [isDeleting, setIsDeleting]         = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title:    "",
    content:  "",
    type:     "normal" as "normal" | "popup",
    isActive: true,
  });

  useEffect(() => { loadNotices(); }, []);

  const loadNotices = async () => {
    try {
      setNotices(await getAllNotices());
    } catch {
      toast.error("공지사항을 불러오지 못했습니다.");
    }
  };

  const resetForm = () => {
    setFormData({ title: "", content: "", type: "normal", isActive: true });
    setEditingNotice(null);
  };

  const handleOpenDialog = (notice?: Notice) => {
    if (notice) {
      setEditingNotice(notice);
      setFormData({
        title:    notice.title || "",
        content:  notice.content || "",
        type:     notice.type,
        isActive: notice.isActive,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      toast.error("공지 내용을 입력해 주세요.");
      return;
    }
    try {
      await saveNotice({
        id:       editingNotice?.id,
        title:    formData.title.trim(),
        content:  formData.content.trim(),
        type:     formData.type,
        isActive: formData.isActive,
        sortOrder: editingNotice?.sortOrder ?? 0,
      });
      toast.success(editingNotice ? "공지가 수정되었습니다." : "공지가 등록되었습니다.");
      await loadNotices();
      handleCloseDialog();
    } catch {
      toast.error("저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 공지를 삭제하시겠습니까?")) return;
    setIsDeleting(id);
    try {
      if (await deleteNotice(id)) {
        toast.success("삭제되었습니다.");
        await loadNotices();
      } else {
        toast.error("삭제에 실패했습니다.");
      }
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleActive = async (notice: Notice) => {
    try {
      await saveNotice({ ...notice, type: notice.type || "normal", isActive: !notice.isActive });
      toast.success(`공지가 ${!notice.isActive ? "활성화" : "비활성화"}되었습니다.`);
      await loadNotices();
    } catch {
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  /* ── 본문 미리보기 (첫 줄만) ── */
  const previewText = (content: string, maxLen = 60) => {
    const first = content.split("\n").find((l) => l.trim()) || "";
    return first.length > maxLen ? first.slice(0, maxLen) + "…" : first;
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                공지사항 관리
              </CardTitle>
              <CardDescription>
                홈 화면 및 팝업에 표시될 공지사항을 작성·관리합니다.
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <PlusSquare className="w-4 h-4" />
              새 공지 작성
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {notices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>등록된 공지가 없습니다. "새 공지 작성"을 눌러 첫 공지를 작성하세요.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">상태</TableHead>
                  <TableHead className="w-20">유형</TableHead>
                  <TableHead>제목 / 내용</TableHead>
                  <TableHead className="text-right w-24">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((notice) => (
                  <TableRow key={notice.id}>
                    {/* 상태 토글 */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={notice.isActive}
                          onCheckedChange={() => handleToggleActive(notice)}
                        />
                        {notice.isActive ? (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <Eye className="w-3.5 h-3.5" /> 활성
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <EyeOff className="w-3.5 h-3.5" /> 비활성
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* 유형 */}
                    <TableCell>
                      <Badge variant={notice.type === "popup" ? "default" : "secondary"} className="text-xs">
                        {notice.type === "popup" ? "팝업" : "일반"}
                      </Badge>
                    </TableCell>

                    {/* 제목 / 내용 미리보기 */}
                    <TableCell>
                      {notice.title && (
                        <p className="font-semibold text-sm mb-0.5">{notice.title}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {previewText(notice.content || "")}
                      </p>
                    </TableCell>

                    {/* 수정 / 삭제 */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(notice)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleDelete(notice.id)}
                          disabled={isDeleting === notice.id}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
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

      {/* ── 작성 / 수정 다이얼로그 ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNotice ? "공지 수정" : "새 공지 작성"}</DialogTitle>
            <DialogDescription>
              제목과 내용을 입력하세요. 줄바꿈은 그대로 표시됩니다.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* 공지 유형 */}
            <div className="space-y-2">
              <Label>공지 유형</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(v: "normal" | "popup") => setFormData({ ...formData, type: v })}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="normal" id="type-normal" />
                  <Label htmlFor="type-normal" className="cursor-pointer">일반 (홈 화면)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="popup" id="type-popup" />
                  <Label htmlFor="type-popup" className="cursor-pointer">팝업 (모달)</Label>
                </div>
              </RadioGroup>
            </div>

            {/* 제목 (선택) */}
            <div className="space-y-1.5">
              <Label htmlFor="notice-title">제목 <span className="text-muted-foreground font-normal">(선택)</span></Label>
              <Input
                id="notice-title"
                placeholder="예) 서비스 점검 안내"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* 본문 */}
            <div className="space-y-1.5">
              <Label htmlFor="notice-content">
                공지 내용 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="notice-content"
                placeholder={"공지 내용을 자유롭게 입력하세요.\n줄바꿈은 그대로 표시됩니다.\n\n예)\n• 2025년 3월 1일 오전 2시~4시 서버 점검\n• 점검 중 서비스 이용이 불가합니다."}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                className="resize-y font-sans text-sm leading-relaxed"
              />
              <p className="text-xs text-muted-foreground">
                {formData.content.length}자 입력됨
              </p>
            </div>

            {/* 활성 여부 */}
            <div className="flex items-center gap-3 pt-2 border-t">
              <Switch
                id="notice-active"
                checked={formData.isActive}
                onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
              />
              <Label htmlFor="notice-active" className="cursor-pointer">
                활성화 <span className="text-muted-foreground font-normal text-xs">(활성 공지만 사용자에게 표시됩니다)</span>
              </Label>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                <X className="w-4 h-4 mr-1.5" /> 취소
              </Button>
              <Button type="submit" className="gap-2">
                <Save className="w-4 h-4" />
                {editingNotice ? "수정 완료" : "공지 등록"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotices;
