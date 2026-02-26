import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Bell, Calendar, ChevronRight, ChevronLeft, X } from "lucide-react";
import { getNoticeById, getAllNotices, Notice } from "@/lib/notices";
import { format } from "date-fns";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function NoticeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
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

  const currentIdx = allNotices.findIndex((n) => n.id === id);
  const prevNotice = currentIdx > 0 ? allNotices[currentIdx - 1] : null;
  const nextNotice = currentIdx < allNotices.length - 1 ? allNotices[currentIdx + 1] : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[88px] sm:pt-20">
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
            {t.notices.title}
          </h1>
          {/* 닫기 → 홈으로 */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => navigate("/")}
            title={t.notices.home}
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
                <p>{t.notices.noNotices}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/notices")}
                >
                  {t.notices.backToList}
                </Button>
              </div>
            ) : (
              <>
                {/* 제목 & 메타 */}
                <div className="border-b border-border pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {notice.type === "popup" && (
                      <Badge variant="secondary" className="text-xs">{t.notices.popup}</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">{t.notices.noticeDetail}</Badge>
                  </div>
                  <h2 className="text-lg font-bold leading-snug">
                    {notice.title || (notice.content ? notice.content.split("\n").find(l => l.trim()) : undefined) || "—"}
                  </h2>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {notice.createdAt
                      ? format(new Date(notice.createdAt), "yyyy.MM.dd")
                      : ""}
                  </div>
                </div>

                {/* 본문 — 줄바꿈 그대로 표시 */}
                <div className="pt-2">
                  {notice.content ? (
                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                      {notice.content}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
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
                    <p className="text-[10px] text-muted-foreground">{t.notices.prevPost}</p>
                    <p className="text-sm truncate group-hover:text-primary transition-colors">
                      {nextNotice.title || (nextNotice.content?.split("\n").find(l => l.trim())) || "—"}
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
                    <p className="text-[10px] text-muted-foreground text-right">{t.notices.nextPost}</p>
                    <p className="text-sm truncate text-right group-hover:text-primary transition-colors">
                      {prevNotice.title || (prevNotice.content?.split("\n").find(l => l.trim())) || "—"}
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
                {t.notices.backToList}
              </Button>
            </div>
          </div>
        )}
      </div>
      </main>
    </div>
  );
}
