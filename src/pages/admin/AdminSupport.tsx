import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Ticket, getAllTickets, addReply, closeTicket } from "@/lib/support";
import { format } from "date-fns";

export default function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredTickets(tickets);
    } else {
      setFilteredTickets(tickets.filter(t => t.status === statusFilter));
    }
  }, [statusFilter, tickets]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await getAllTickets();
      setTickets(data);
    } catch (error) {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setLoading(true);
    try {
      await addReply(selectedTicket.id, {
        sender: "admin",
        message: replyMessage,
      });
      setReplyMessage("");
      toast.success("Reply sent");
      await loadTickets(); // Refresh list
      
      // Update selected ticket view
      const updatedTicket = {
        ...selectedTicket,
        status: "answered",
        replies: [
          ...selectedTicket.replies,
          { sender: "admin", message: replyMessage, timestamp: Date.now() } as any
        ]
      };
      setSelectedTicket(updatedTicket as Ticket);
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    if (!confirm("Are you sure you want to close this ticket?")) return;

    setLoading(true);
    try {
      await closeTicket(selectedTicket.id);
      toast.success("Ticket closed");
      await loadTickets();
      setSelectedTicket(prev => prev ? ({ ...prev, status: "closed" }) : null);
    } catch (error) {
      toast.error("Failed to close ticket");
    } finally {
      setLoading(false);
    }
  };

  if (selectedTicket) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="mb-2 pl-0">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Ticket List
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{selectedTicket.subject}</CardTitle>
                    <CardDescription className="mt-1">
                      From: <span className="font-mono text-xs bg-muted px-1 rounded">{selectedTicket.userId}</span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={selectedTicket.status === "closed" ? "secondary" : "default"}>
                      {selectedTicket.status.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">{selectedTicket.priority}</Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto pt-6 space-y-6 max-h-[600px]">
                {/* Original Message */}
                <div className="flex flex-col gap-2">
                  <div className="font-semibold text-sm text-muted-foreground">Original Message</div>
                  <div className="bg-muted/30 p-4 rounded-lg text-sm whitespace-pre-wrap">
                    {selectedTicket.message}
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {format(selectedTicket.createdAt, "PPP p")}
                  </div>
                </div>

                {/* Replies */}
                {selectedTicket.replies.map((reply, index) => (
                  <div
                    key={index}
                    className={`flex flex-col max-w-[85%] ${
                      reply.sender === "admin" ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-lg text-sm ${
                        reply.sender === "admin"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted rounded-tl-none"
                      }`}
                    >
                      {reply.message}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {reply.sender === "admin" ? "Support Agent" : "User"} • {format(reply.timestamp, "p")}
                    </span>
                  </div>
                ))}
              </CardContent>

              {/* Reply Input */}
              {selectedTicket.status !== "closed" ? (
                <CardFooter className="border-t pt-4">
                  <div className="flex w-full gap-2">
                    <Textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      className="min-h-[80px]"
                    />
                    <div className="flex flex-col gap-2">
                      <Button onClick={handleReply} disabled={loading || !replyMessage.trim()} className="flex-1">
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" onClick={handleCloseTicket} disabled={loading} title="Close Ticket">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              ) : (
                <CardFooter className="border-t pt-4 justify-center bg-muted/20">
                  <span className="text-muted-foreground text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> This ticket is closed.
                  </span>
                </CardFooter>
              )}
            </Card>
          </div>

          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Status</span>
                  <Badge variant="outline">{selectedTicket.status}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Priority</span>
                  <Badge variant="outline">{selectedTicket.priority}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Created</span>
                  <span>{format(selectedTicket.createdAt, "PPP")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Last Updated</span>
                  <span>{format(selectedTicket.updatedAt, "PPP p")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Wallet Address</span>
                  <span className="font-mono text-xs break-all">{selectedTicket.userId}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground">Manage user inquiries and support requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="answered">Answered</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadTickets} title="Refresh">
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading && tickets.length === 0 ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              No tickets found matching your filter.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow 
                    key={ticket.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {ticket.subject}
                        {ticket.status === 'open' && (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {ticket.userId.substring(0, 6)}...{ticket.userId.substring(ticket.userId.length - 4)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ticket.status === "open" ? "destructive" : ticket.status === "closed" ? "secondary" : "default"}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">
                      {format(ticket.updatedAt, "MMM d, p")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
