import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, MessageSquare, ArrowLeft, Send, Paperclip, X, Image } from "lucide-react";
import { toast } from "sonner";
import { Ticket, getUserTickets, createTicket, addReply, uploadTicketAttachment } from "@/lib/support";
import { format } from "date-fns";
import { useRef } from "react";

export default function Support() {
  const { address } = useAccount();
  const [view, setView] = useState<"list" | "detail">("list");
  // const [showCreateForm, setShowCreateForm] = useState(false); // Removed toggle state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);

  // Create Form State
  const [formData, setFormData] = useState({
    subject: "",
    priority: "medium",
    message: "",
  });

  // Attachment state
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reply State
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    if (address) {
      loadTickets();
    }
  }, [address]);

  const loadTickets = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const data = await getUserTickets(address.toLowerCase());
      setTickets(data);
    } catch (error) {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      // Create ticket first to get ticketId
      const ticketId = await createTicket({
        userId: address.toLowerCase(),
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority as "low" | "medium" | "high",
      });

      // Upload attachments if any
      if (attachments.length > 0) {
        const urls: string[] = [];
        for (const file of attachments) {
          const url = await uploadTicketAttachment(ticketId, file, (pct) =>
            setUploadProgress(pct)
          );
          urls.push(url);
        }
        // Update ticket with attachment URLs via updateDoc (support.ts toFirestore)
        const { doc, updateDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        await updateDoc(doc(db, "support_tickets", ticketId), { attachmentUrls: urls });
      }

      toast.success("Ticket created successfully");
      setFormData({ subject: "", priority: "medium", message: "" });
      setAttachments([]);
      setUploadProgress(0);
      loadTickets();
    } catch (error) {
      toast.error("Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.size <= 5 * 1024 * 1024); // 5MB limit
    const oversized = files.length - valid.length;
    if (oversized > 0) toast.error(`${oversized} file(s) exceed 5 MB limit`);
    setAttachments(prev => {
      const combined = [...prev, ...valid];
      return combined.slice(0, 3); // max 3 files
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setLoading(true);
    try {
      await addReply(selectedTicket.id, {
        sender: "user",
        message: replyMessage,
      });
      setReplyMessage("");
      // Refresh ticket data locally or refetch
      const updatedTicket = {
        ...selectedTicket,
        replies: [
          ...selectedTicket.replies,
          { sender: "user", message: replyMessage, timestamp: Date.now() } as any
        ]
      };
      setSelectedTicket(updatedTicket);
      toast.success("Reply sent");
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "default"; // Black/White
      case "answered": return "success"; // Greenish (need custom variant or class)
      case "closed": return "secondary"; // Gray
      default: return "default";
    }
  };

  if (!address) {
    return (
      <div className="container py-10 flex justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Please connect your wallet to access support.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Support Center</h1>
        {/* Button removed, form is always visible */}
      </div>

      {/* LIST VIEW */}
      {view === "list" && (
        <div className="space-y-6">
          {/* CREATE FORM - Always Visible */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Create New Ticket</CardTitle>
              <CardDescription>Describe your issue and we'll get back to you.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Brief summary of the issue"
                      className="bg-background"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select
                      value={formData.priority}
                      onValueChange={(val) => setFormData({ ...formData, priority: val })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Detailed description..."
                      rows={5}
                      className="bg-background"
                    />
                  </div>

                  {/* File Attachments */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Attachments <span className="text-muted-foreground font-normal">(optional, max 3 × 5MB)</span>
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                          <Image className="w-3 h-3 text-muted-foreground" />
                          <span className="max-w-[120px] truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="ml-1 text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {attachments.length < 3 && (
                        <>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5 h-7 text-xs"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Paperclip className="w-3 h-3" />
                            Add image
                          </Button>
                        </>
                      )}
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <p className="text-xs text-muted-foreground">Uploading… {uploadProgress}%</p>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Ticket"}
                    </Button>
                  </div>
                </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {loading && !tickets.length ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No tickets found. Create one if you need help!
                </div>
              ) : (
                <div className="divide-y">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between"
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setView("detail");
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="font-semibold">{ticket.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(ticket.createdAt, "PPP p")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={ticket.status === "answered" ? "default" : "secondary"}>
                          {ticket.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{ticket.priority}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* DETAIL VIEW */}
      {view === "detail" && selectedTicket && (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setView("list")} className="mb-2 pl-0">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tickets
          </Button>

          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{selectedTicket.subject}</CardTitle>
                  <CardDescription className="mt-1">
                    Ticket ID: {selectedTicket.id} • {format(selectedTicket.createdAt, "PPP")}
                  </CardDescription>
                </div>
                <Badge variant={selectedTicket.status === "closed" ? "secondary" : "default"}>
                  {selectedTicket.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Original Message */}
              <div className="flex flex-col gap-2">
                <div className="font-semibold text-sm text-muted-foreground">Original Message</div>
                <div className="bg-muted/30 p-4 rounded-lg text-sm whitespace-pre-wrap">
                  {selectedTicket.message}
                </div>
                {/* Attachment images */}
                {selectedTicket.attachmentUrls && selectedTicket.attachmentUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTicket.attachmentUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={`attachment-${i + 1}`}
                          className="h-24 w-auto rounded border border-border object-cover hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Replies */}
              <div className="space-y-4">
                {selectedTicket.replies.map((reply, index) => (
                  <div
                    key={index}
                    className={`flex flex-col max-w-[80%] ${
                      reply.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-lg text-sm ${
                        reply.sender === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted rounded-tl-none"
                      }`}
                    >
                      {reply.message}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {reply.sender === "user" ? "You" : "Support"} • {format(reply.timestamp, "p")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
            
            {/* Reply Input */}
            {selectedTicket.status !== "closed" && (
              <CardFooter className="border-t pt-4">
                <div className="flex w-full gap-2">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="min-h-[60px]"
                  />
                  <Button onClick={handleReply} disabled={loading || !replyMessage.trim()} className="h-auto">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
