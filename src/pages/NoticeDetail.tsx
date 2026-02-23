import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Bell, Calendar, ChevronRight, ChevronLeft, Home, X } from "lucide-react";
import { getNoticeById, getAllNotices, Notice } from "@/lib/notices";
import { format } from "date-fns";

export default function NoticeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [allNotices, setAllNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [found, all] = await Promise.all([
          getNoticeById(id!),
          getAllNotices(),
        ]);
        setNotice(found);
        const sorted = all
          .filter((n) => n.isActive !== false)
          .sort((a, b) => {
            const od = a.sortOrder - b.sortOrder;
            if (od !== 0) return od;
            return b.createdAt - a.createdAt;
          });
        setAllNotices(sorted);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // 이전/다음 공지
  const currentIdx = allNotices.findIndex((n) => n.id === id);
  const prevNotice = currentIdx > 0 ? allNotices[currentIdx - 1] : null;
  const nextNotice = currentIdx < allNotices.length - 1 ? allNotices[currentIdx + 1] : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => navigate("/notices")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2 flex-1">
            <Bell className="w-5 h-5 text-primary" />
            공지사항
          </h1>
          {/* 닫기 → 홈으로 */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => navigate("/")}
            title="홈으로"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content Card */}
        <Card className="mb-4">
          <CardContent className="p-5 space-y-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-1/4" />
                <div className="space-y-2 pt-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-3 w-full" />
                  ))}
                </div>
              </div>
            ) : !notice ? (
              <div className="py-12 text-center text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>공지사항을 찾을 수 없습니다.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/notices")}
                >
                  목록으로 돌아가기
                </Button>
              </div>
            ) : (
              <>
                {/* 제목 & 메타 */}
                <div className="border-b border-border pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {notice.type === "popup" && (
                      <Badge variant="secondary" className="text-xs">팝업</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">공지</Badge>
                  </div>
                  <h2 className="text-lg font-bold leading-snug">
                    {notice.title || notice.points[0] || "제목 없음"}
                  </h2>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {notice.createdAt
                      ? format(new Date(notice.createdAt), "yyyy년 MM월 dd일")
                      : ""}
                  </div>
                </div>

                {/* 본문 (points 배열) */}
                <div className="space-y-3 pt-1">
                  {notice.points.map((point, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-primary font-bold text-sm shrink-0 mt-0.5">
                        {i + 1}.
                      </span>
                      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                        {point}
                      </p>
                    </div>
                  ))}
                  {notice.points.length === 0 && (
                    <p className="text-sm text-muted-foreground">내용이 없습니다.</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Prev / Next Navigation */}
        {!loading && notice && (
          <div className="space-y-2">
            {nextNotice && (
              <Card
                className="cursor-pointer hover:border-primary/50 transition-colors group"
                onClick={() => navigate(`/notices/${nextNotice.id}`)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">이전 글</p>
                    <p className="text-sm truncate group-hover:text-primary transition-colors">
                      {nextNotice.title || nextNotice.points[0] || "제목 없음"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {prevNotice && (
              <Card
                className="cursor-pointer hover:border-primary/50 transition-colors group"
                onClick={() => navigate(`/notices/${prevNotice.id}`)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground text-right">다음 글</p>
                    <p className="text-sm truncate text-right group-hover:text-primary transition-colors">
                      {prevNotice.title || prevNotice.points[0] || "제목 없음"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            )}
            {/* 목록으로 */}
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/notices")}
                className="gap-1"
              >
                <Bell className="w-3.5 h-3.5" />
                목록으로
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
