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
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadNotices = async () => {
      const activeNotices = await getActivePopupNotices();
      if (activeNotices.length > 0) {
        // Optional: Check if already seen in session storage
        const seenIds = sessionStorage.getItem("seen_notices");
        const unseenNotices = activeNotices.filter(n => !seenIds?.includes(n.id));
        
        if (unseenNotices.length > 0) {
          setNotices(unseenNotices);
          setOpen(true);
        }
      }
    };

    // Delay slightly to let app load
    const timer = setTimeout(loadNotices, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    // Mark current as seen
    const currentNotice = notices[currentIndex];
    if (currentNotice) {
      const seenIds = sessionStorage.getItem("seen_notices") || "";
      sessionStorage.setItem("seen_notices", seenIds + "," + currentNotice.id);
    }

    if (currentIndex < notices.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setOpen(false);
    }
  };

  const currentNotice = notices[currentIndex];

  if (!currentNotice) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            {currentNotice.title || "Notice"}
          </DialogTitle>
          {notices.length > 1 && (
            <DialogDescription>
              {currentIndex + 1} of {notices.length}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="py-4">
          <ul className="list-disc list-inside space-y-2 text-sm text-foreground">
            {currentNotice.points.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full sm:w-auto">
            {currentIndex < notices.length - 1 ? "Next" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
