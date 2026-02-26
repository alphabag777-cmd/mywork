import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Notice, getActivePopupNotices } from "@/lib/notices";
import { Bell } from "lucide-react";

export function UserNoticePopup() {
  const [open, setOpen]               = useState(false);
  const [notices, setNotices]         = useState<Notice[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      const active = await getActivePopupNotices();
      if (active.length > 0) {
        const seenIds = sessionStorage.getItem("seen_notices") || "";
        const unseen  = active.filter((n) => !seenIds.includes(n.id));
        if (unseen.length > 0) {
          setNotices(unseen);
          setOpen(true);
        }
      }
    };
    const timer = setTimeout(load, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    const current = notices[currentIndex];
    if (current) {
      const seen = sessionStorage.getItem("seen_notices") || "";
      sessionStorage.setItem("seen_notices", seen + "," + current.id);
    }
    if (currentIndex < notices.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setOpen(false);
    }
  };

  const current = notices[currentIndex];
  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            {current.title || "공지사항"}
          </DialogTitle>
          {notices.length > 1 && (
            <DialogDescription>
              {currentIndex + 1} / {notices.length}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* 본문 — 줄바꿈 그대로 표시 */}
        <div className="py-4">
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            {current.content}
          </p>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full sm:w-auto">
            {currentIndex < notices.length - 1 ? "다음" : "닫기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
