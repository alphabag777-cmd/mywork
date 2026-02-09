import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Network, Trash2, Edit, Save, X, PlusSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { NodeType, getAllNodes, saveNode, deleteNode } from "@/lib/nodes";
import { ImageUpload } from "@/components/ImageUpload";
import { NodeId } from "@/lib/contract";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const AdminNodes = () => {
  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [editingNode, setEditingNode] = useState<NodeType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    color: "gold",
    nodeId: NodeId.ALPHA.toString(),
    icon: "",
    description: "",
    tags: "",
    walletAddress: "",
  });

  useEffect(() => {
    loadNodes();
  }, []);

  const loadNodes = async () => {
    try {
      const allNodes = await getAllNodes();
      setNodes(allNodes);
    } catch (error) {
      console.error("Error loading nodes:", error);
      toast.error("Failed to load nodes");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      color: "gold",
      nodeId: NodeId.ALPHA.toString(),
      icon: "",
      description: "",
      tags: "",
      walletAddress: "",
    });
    setEditingNode(null);
  };

  const handleOpenDialog = (node?: NodeType) => {
    if (node) {
      setEditingNode(node);
      setFormData({
        name: node.name,
        price: node.price.toString(),
        color: node.color,
        nodeId: node.nodeId.toString(),
        icon: node.icon || "",
        description: node.description || "",
        tags: node.tags?.join(", ") || "",
        walletAddress: node.walletAddress || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse tags
    const tags = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const nodeData = {
      id: editingNode?.id,
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      color: formData.color,
      nodeId: parseInt(formData.nodeId) || NodeId.ALPHA,
      icon: formData.icon,
      description: formData.description,
      tags,
      walletAddress: formData.walletAddress.trim(),
    };

    try {
      await saveNode(nodeData);
      toast.success(editingNode ? "Node updated successfully!" : "Node created successfully!");
      await loadNodes();
      handleCloseDialog();
    } catch (error) {
      toast.error("Failed to save node");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this node?")) {
      return;
    }

    setIsDeleting(id);
    try {
      const success = await deleteNode(id);
      if (success) {
        toast.success("Node deleted successfully!");
        await loadNodes();
      } else {
        toast.error("Failed to delete node");
      }
    } catch (error) {
      toast.error("Failed to delete node");
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  const getColorBadge = (color: string) => {
    const colors: Record<string, string> = {
      gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      blue: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      green: "bg-green-500/20 text-green-400 border-green-500/50",
      orange: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    };
    return colors[color] || "bg-gray-500/20 text-gray-400 border-gray-500/50";
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-4 h-4 text-primary" />
                Manage Nodes
              </CardTitle>
              <CardDescription>Create and manage nodes that users can purchase</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <PlusSquare className="w-4 h-4" />
              Add New Node
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {nodes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No nodes created yet. Click "Add New Node" to create your first node.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price (USDT)</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Node ID</TableHead>
                  <TableHead>Wallet Address</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nodes.map((node) => (
                  <TableRow key={node.id}>
                    <TableCell className="font-medium">{node.name}</TableCell>
                    <TableCell>{node.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getColorBadge(node.color)}`}>
                        {node.color}
                      </span>
                    </TableCell>
                    <TableCell>{node.nodeId}</TableCell>
                    <TableCell>
                      {node.walletAddress ? (
                        <div className="font-mono text-xs truncate max-w-[120px]" title={node.walletAddress}>
                          {node.walletAddress.slice(0, 6)}...{node.walletAddress.slice(-4)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={node.description || ""}>
                        {node.description || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {node.tags && node.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {node.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground border border-border"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(node)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(node.id)}
                          disabled={isDeleting === node.id}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNode ? "Edit Node" : "Create New Node"}</DialogTitle>
            <DialogDescription>
              Configure node details for purchase
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Node Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. ABAG Super Node"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (USDT) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g. 10000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color *</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nodeId">Node ID *</Label>
                <Select value={formData.nodeId} onValueChange={(value) => setFormData({ ...formData, nodeId: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NodeId.SUPER.toString()}>Super ({NodeId.SUPER})</SelectItem>
                    <SelectItem value={NodeId.ALPHA.toString()}>Alpha ({NodeId.ALPHA})</SelectItem>
                    <SelectItem value={NodeId.T.toString()}>T ({NodeId.T})</SelectItem>
                    <SelectItem value={NodeId.F.toString()}>F ({NodeId.F})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <ImageUpload
                  value={formData.icon}
                  onChange={(url) => setFormData({ ...formData, icon: url })}
                  label="Node Icon"
                  folder="alphabag/nodes"
                  maxSizeMB={2}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Node description"
                  rows={3}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. Premium, Exclusive, Limited"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="walletAddress">Wallet Address</Label>
                <Input
                  id="walletAddress"
                  value={formData.walletAddress}
                  onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                  placeholder="0x..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Wallet address to receive payments for this node purchase
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <Save className="w-4 h-4" />
                {editingNode ? "Update Node" : "Create Node"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNodes;

