import { useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Bell, Send, Users, User, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getAllUsers } from "@/lib/users";
import {
  createNotification,
  sendBroadcastNotification,
  Notification,
} from "@/lib/notifications";

type Target = "all" | "specific";
type NotifType = Notification["type"];

const NOTIF_TYPES: { value: NotifType; label: string }[] = [
  { value: "system_notice",  label: "System Notice"   },
  { value: "staking_reward", label: "Staking Reward"  },
  { value: "ticket_reply",   label: "Ticket Reply"    },
  { value: "referral_joined",label: "Referral Joined" },
];

export const AdminNotifications = () => {
  // Form state
  const [target, setTarget]         = useState<Target>("all");
  const [walletInput, setWalletInput] = useState("");
  const [notifType, setNotifType]   = useState<NotifType>("system_notice");
  const [title, setTitle]           = useState("");
  const [message, setMessage]       = useState("");
  const [link, setLink]             = useState("");
  const [sending, setSending]       = useState(false);
  const [sentCount, setSentCount]   = useState<number | null>(null);

  // ── Send handler ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    setSending(true);
    setSentCount(null);

    try {
      if (target === "all") {
        // Fetch all user IDs
        const users = await getAllUsers();
        if (users.length === 0) {
          toast.warning("No users found");
          setSending(false);
          return;
        }
        const ids = users.map(u => u.walletAddress ?? u.id);
        await sendBroadcastNotification(
          ids,
          notifType,
          title.trim(),
          message.trim(),
          link.trim() || undefined
        );
        setSentCount(ids.length);
        toast.success(`Notification sent to ${ids.length} users`);
      } else {
        // Specific wallet(s): comma-separated list
        const wallets = walletInput
          .split(",")
          .map(w => w.trim())
          .filter(w => /^0x[0-9a-fA-F]{40}$/i.test(w));
        if (wallets.length === 0) {
          toast.error("Enter at least one valid wallet address");
          setSending(false);
          return;
        }
        for (const w of wallets) {
          await createNotification(
            w.toLowerCase(),
            notifType,
            title.trim(),
            message.trim(),
            link.trim() || undefined
          );
        }
        setSentCount(wallets.length);
        toast.success(`Notification sent to ${wallets.length} wallet(s)`);
      }

      // Reset form
      setTitle("");
      setMessage("");
      setLink("");
      setWalletInput("");
    } catch (err) {
      console.error("Send notification error:", err);
      toast.error("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          Notifications
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send push notifications to specific users or all users.
        </p>
      </div>

      {/* Compose Card */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Compose Notification</CardTitle>
          <CardDescription className="text-xs">
            Messages will appear in each user's NotificationCenter in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Target */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Target</Label>
            <div className="flex gap-3">
              <Button
                variant={target === "all" ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setTarget("all")}
              >
                <Users className="w-4 h-4" />
                All Users
              </Button>
              <Button
                variant={target === "specific" ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setTarget("specific")}
              >
                <User className="w-4 h-4" />
                Specific Wallet
              </Button>
            </div>
          </div>

          {/* Wallet input (specific only) */}
          {target === "specific" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Wallet Address(es)</Label>
              <Input
                placeholder="0xABC…, 0xDEF… (comma separated)"
                value={walletInput}
                onChange={e => setWalletInput(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Separate multiple addresses with commas.
              </p>
            </div>
          )}

          {/* Notification Type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Type</Label>
            <Select value={notifType} onValueChange={v => setNotifType(v as NotifType)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTIF_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Title</Label>
            <Input
              placeholder="Notification title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Message</Label>
            <Textarea
              placeholder="Notification body text…"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              className="resize-none text-sm"
            />
            <p className="text-[11px] text-muted-foreground text-right">
              {message.length}/500
            </p>
          </div>

          {/* Optional link */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Deep Link <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              placeholder="/profile, /staking, /community …"
              value={link}
              onChange={e => setLink(e.target.value)}
            />
          </div>

          {/* Send button */}
          <div className="flex items-center gap-4 pt-1">
            <Button
              onClick={handleSend}
              disabled={sending || !title.trim() || !message.trim()}
              className="gap-2"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? "Sending…" : "Send Notification"}
            </Button>

            {sentCount !== null && !sending && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                Sent to {sentCount} user{sentCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="border-border/60 bg-muted/30">
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
            Tips
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              <strong>All Users</strong> sends one Firestore doc per registered wallet.
              Large user-bases may take a few seconds.
            </li>
            <li>
              <strong>Deep links</strong> open in the user's app when they tap the notification (e.g. <code>/staking</code>).
            </li>
            <li>
              Notifications appear in the <strong>NotificationCenter</strong> bell icon in the app header.
            </li>
            <li>
              Each user can dismiss / mark-as-read individually.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotifications;
