import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Megaphone, Trash2, Plus, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Announcement,
  getAllAnnouncements,
  saveAnnouncement,
  deleteAnnouncement,
  dispatchDueAnnouncements,
} from "@/lib/announcements";

export const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    message: "",
    link: "",
    scheduled: "",   // datetime-local string
    sendNow: false,
  });

  const load = async () => {
    setLoading(true);
    const data = await getAllAnnouncements();
    setAnnouncements(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    const scheduledAt = form.sendNow
      ? 0
      : form.scheduled
      ? new Date(form.scheduled).getTime()
      : Date.now();

    await saveAnnouncement({ title: form.title, message: form.message, link: form.link || undefined, scheduledAt });
    toast.success("Announcement saved");
    setIsDialogOpen(false);
    setForm({ title: "", message: "", link: "", scheduled: "", sendNow: false });
    load();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await deleteAnnouncement(id);
    toast.success("Deleted");
    setDeleting(null);
    load();
  };

  const handleDispatch = async () => {
    setDispatching(true);
    const n = await dispatchDueAnnouncements();
    toast.success(n > 0 ? `Dispatched ${n} announcement(s)` : "No pending announcements");
    setDispatching(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            Announcements
          </h1>
          <p className="text-sm text-muted-foreground">Schedule broadcasts to all users</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDispatch} disabled={dispatching} className="gap-2">
            {dispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Dispatch Due
          </Button>
          <Button size="sm" onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Announcements</CardTitle>
          <CardDescription>{announcements.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : announcements.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No announcements yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Scheduled At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((ann) => (
                  <TableRow key={ann.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{ann.title}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{ann.message}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {ann.scheduledAt === 0 ? "Immediate" : format(new Date(ann.scheduledAt), "yyyy-MM-dd HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ann.isSent ? "default" : "secondary"}>
                        {ann.isSent ? "Sent" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ann.sentAt ? format(new Date(ann.sentAt), "yyyy-MM-dd HH:mm") : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(ann.id)}
                        disabled={deleting === ann.id}
                      >
                        {deleting === ann.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-destructive" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" />
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Announcement body..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Link (optional)</Label>
              <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.sendNow}
                onCheckedChange={(v) => setForm({ ...form, sendNow: v })}
              />
              <Label>Send immediately</Label>
            </div>
            {!form.sendNow && (
              <div className="space-y-2">
                <Label>Scheduled Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduled}
                  onChange={(e) => setForm({ ...form, scheduled: e.target.value })}
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAnnouncements;
