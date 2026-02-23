import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  ArrowLeft,
  Calendar,
  X,
} from "lucide-react";
import { getAllNotices, Notice } from "@/lib/notices";
import { format } from "date-fns";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const PAGE_SIZE = 5;

export default function Notices() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const all = await getAllNotices();
        const sorted = all
          .filter((n) => n.isActive !== false)
          .sort((a, b) => {
            const od = a.sortOrder - b.sortOrder;
            if (od !== 0) return od;
            return b.createdAt - a.createdAt;
          });
        setNotices(sorted);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalPages = Math.max(1, Math.ceil(notices.length / PAGE_SIZE));
  const pageNotices = notices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goTo = (n: Notice) => navigate(`/notices/${n.id}`);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              {t.notices.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {notices.length} {t.notices.allNotices}
            </p>
          </div>
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

        {/* List */}
        <div className="space-y-3">
          {loading
            ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/3" />
                  </CardContent>
                </Card>
              ))
            : pageNotices.length === 0
            ? (
              <Card>
                <CardContent className="py-16 flex flex-col items-center text-muted-foreground">
                  <Bell className="w-10 h-10 mb-3 opacity-30" />
                  <p>{t.notices.noNotices}</p>
                </CardContent>
              </Card>
            )
            : pageNotices.map((notice, idx) => {
                const globalIdx = (page - 1) * PAGE_SIZE + idx + 1;
                const dateStr = notice.createdAt
                  ? format(new Date(notice.createdAt), "yyyy.MM.dd")
                  : "";
                return (
                  <Card
                    key={notice.id}
                    className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
                    onClick={() => goTo(notice)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* 번호 */}
                        <span className="text-sm font-mono text-muted-foreground w-6 shrink-0 pt-0.5">
                          {globalIdx}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {notice.type === "popup" && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {t.notices.popup}
                              </Badge>
                            )}
                            <p className="font-medium text-sm leading-snug truncate group-hover:text-primary transition-colors">
                              {notice.title || notice.points[0] || "—"}
                            </p>
                          </div>
                          {notice.points.length > 0 && notice.title && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {notice.points[0]}
                            </p>
                          )}
                        </div>
                        {/* 날짜 */}
                        <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {dateStr}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                className="h-8 w-8 text-xs"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
