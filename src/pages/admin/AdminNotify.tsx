import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Bell, Send, Loader2, Users, User } from "lucide-react";
import { toast } from "sonner";
import { createNotification } from "@/lib/notifications";
import { getAllUsers } from "@/lib/users";

type NotifType = "system_notice" | "staking_reward" | "referral_joined" | "ticket_reply";

export default function AdminNotify() {
  const [mode, setMode]           = useState<"single" | "all">("single");
  const [target, setTarget]       = useState("");
  const [title, setTitle]         = useState("");
  const [message, setMessage]     = useState("");
  const [link, setLink]           = useState("");
  const [notifType, setNotifType] = useState<NotifType>("system_notice");
  const [loading, setLoading]     = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (mode === "single" && !target.trim()) {
      toast.error("Wallet address is required for single-user notification");
      return;
    }

    setLoading(true);
    setSentCount(null);
    try {
      if (mode === "single") {
        await createNotification(
          target.trim().toLowerCase(),
          notifType,
          title.trim(),
          message.trim(),
          link.trim() || undefined
        );
        setSentCount(1);
        toast.success("Notification sent to user");
      } else {
        // Broadcast to all users
        const users = await getAllUsers();
        let count = 0;
        // Send in batches of 10 to avoid overwhelming Firestore
        const BATCH = 10;
        for (let i = 0; i < users.length; i += BATCH) {
          const batch = users.slice(i, i + BATCH);
          await Promise.all(
            batch.map(u =>
              createNotification(
                u.walletAddress.toLowerCase(),
                notifType,
                title.trim(),
                message.trim(),
                link.trim() || undefined
              )
            )
          );
          count += batch.length;
        }
        setSentCount(count);
        toast.success(`Notification sent to ${count} users`);
      }
      // Clear form on success
      setTarget("");
      setTitle("");
      setMessage("");
      setLink("");
    } catch (err) {
      console.error("Failed to send notification:", err);
      toast.error("Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Send Notification
          </CardTitle>
          <CardDescription>
            Send in-app notifications to a specific user or broadcast to all users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === "single" ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setMode("single")}
            >
              <User className="w-4 h-4" /> Single User
            </Button>
            <Button
              variant={mode === "all" ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setMode("all")}
            >
              <Users className="w-4 h-4" /> All Users
            </Button>
          </div>

          {/* Target wallet (single mode) */}
          {mode === "single" && (
            <div className="space-y-1">
              <Label className="text-xs">Target Wallet Address</Label>
              <Input
                placeholder="0x..."
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          )}

          {/* Notification type */}
          <div className="space-y-1">
            <Label className="text-xs">Notification Type</Label>
            <Select value={notifType} onValueChange={(v) => setNotifType(v as NotifType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system_notice">System Notice</SelectItem>
                <SelectItem value="staking_reward">Staking Reward</SelectItem>
                <SelectItem value="referral_joined">Referral Joined</SelectItem>
                <SelectItem value="ticket_reply">Ticket Reply</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-1">
            <Label className="text-xs">Message</Label>
            <Textarea
              placeholder="Notification message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Optional link */}
          <div className="space-y-1">
            <Label className="text-xs">Link (optional)</Label>
            <Input
              placeholder="/profile, /investment, ..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>

          {/* Preview */}
          {(title || message) && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-1">
              <p className="text-xs text-muted-foreground">Preview</p>
              <p className="text-sm font-semibold">{title || "(no title)"}</p>
              <p className="text-xs text-muted-foreground">{message || "(no message)"}</p>
              {link && <p className="text-xs text-primary">→ {link}</p>}
            </div>
          )}

          {/* Send button */}
          <Button
            className="w-full gap-2"
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-4 h-4" /> Send {mode === "all" ? "to All Users" : "Notification"}</>
            )}
          </Button>

          {/* Result */}
          {sentCount !== null && (
            <p className="text-sm text-center text-green-600 font-medium">
              ✓ Sent to {sentCount} user{sentCount !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
