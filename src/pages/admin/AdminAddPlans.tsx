import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusSquare, Trash2, Edit, Save, X, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { InvestmentPlan, PlanStatus, getAllPlans, savePlan, deletePlan, updatePlanOrder } from "@/lib/plans";
import { ImageUpload } from "@/components/ImageUpload";
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

export const AdminAddPlans = () => {
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    label: "",
    dailyProfit: "",
    status: "Daily profit" as PlanStatus,
    focus: "",
    logo: "",
    dappUrl: "",
    description: "",
    tags: "",
    quickActionsDescription: "",
    youtubeUrl: "",
    telegram: "",
    twitter: "",
    materials: "",
    recommendedAmount: "1000",
    wallet1: "",
    wallet1Percentage: "0",
    useUserAddress1: false,
    wallet1TokenConversionRate: "0",
    wallet1TokenPrice: "0",
    wallet2: "",
    wallet2Percentage: "0",
    useUserAddress2: false,
    wallet2TokenConversionRate: "0",
    wallet2TokenPrice: "0",
    wallet3: "",
    wallet3Percentage: "0",
    useUserAddress3: false,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const allPlans = await getAllPlans();
      setPlans(allPlans);
    } catch (error) {
      console.error("Error loading plans:", error);
      toast.error("Failed to load plans");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      label: "",
      dailyProfit: "",
      status: "Daily profit" as PlanStatus,
      focus: "",
      logo: "",
      dappUrl: "",
      description: "",
      tags: "",
      quickActionsDescription: "",
      youtubeUrl: "",
      telegram: "",
      twitter: "",
      materials: "",
      recommendedAmount: "1000",
      wallet1: "",
      wallet1Percentage: "0",
      useUserAddress1: false,
      wallet1TokenConversionRate: "0",
      wallet1TokenPrice: "0",
      wallet2: "",
      wallet2Percentage: "0",
      useUserAddress2: false,
      wallet2TokenConversionRate: "0",
      wallet2TokenPrice: "0",
      wallet3: "",
      wallet3Percentage: "0",
      useUserAddress3: false,
    });
    setEditingPlan(null);
  };

  const handleOpenDialog = (plan?: InvestmentPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        label: plan.label,
        dailyProfit: plan.dailyProfit,
        status: plan.status || "Daily profit",
        focus: plan.focus,
        logo: plan.logo,
        dappUrl: plan.dappUrl,
        description: plan.description,
        tags: plan.tags.join(", "),
        quickActionsDescription: plan.quickActionsDescription,
        youtubeUrl: plan.youtubeUrl,
        telegram: plan.telegram,
        twitter: plan.twitter,
        materials: plan.materials.map((m) => `${m.title}|${m.url}`).join("\n"),
        recommendedAmount: plan.recommendedAmount,
        wallet1: plan.wallet1 || "",
        wallet1Percentage: plan.wallet1Percentage?.toString() || "0",
        useUserAddress1: plan.useUserAddress1 || false,
        wallet1TokenConversionRate: plan.wallet1TokenConversionRate?.toString() || "0",
        wallet1TokenPrice: plan.wallet1TokenPrice?.toString() || "0",
        wallet2: plan.wallet2 || "",
        wallet2Percentage: plan.wallet2Percentage?.toString() || "0",
        useUserAddress2: plan.useUserAddress2 || false,
        wallet2TokenConversionRate: plan.wallet2TokenConversionRate?.toString() || "0",
        wallet2TokenPrice: plan.wallet2TokenPrice?.toString() || "0",
        wallet3: plan.wallet3 || "",
        wallet3Percentage: plan.wallet3Percentage?.toString() || "0",
        useUserAddress3: plan.useUserAddress3 || false,
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

    // Parse materials
    const materials = formData.materials
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const [title, url] = line.split("|").map((s) => s.trim());
        return { title: title || "Link", url: url || "" };
      })
      .filter((m) => m.url.length > 0);

    // Validate percentages sum to 100 or less
    const wallet1Percent = parseFloat(formData.wallet1Percentage) || 0;
    const wallet2Percent = parseFloat(formData.wallet2Percentage) || 0;
    const wallet3Percent = parseFloat(formData.wallet3Percentage) || 0;
    const totalPercentage = wallet1Percent + wallet2Percent + wallet3Percent;
    
    if (totalPercentage > 100) {
      toast.error("Total wallet percentages cannot exceed 100%");
      return;
    }

    const planData = {
      id: editingPlan?.id,
      name: formData.name,
      label: formData.label,
      dailyProfit: formData.dailyProfit,
      status: formData.status,
      focus: formData.focus,
      logo: formData.logo,
      dappUrl: formData.dappUrl,
      description: formData.description,
      tags,
      quickActionsDescription: formData.quickActionsDescription,
      youtubeUrl: formData.youtubeUrl,
      telegram: formData.telegram,
      twitter: formData.twitter,
      materials,
      recommendedAmount: formData.recommendedAmount,
      wallet1: formData.wallet1.trim(),
      wallet1Percentage: wallet1Percent,
      useUserAddress1: formData.useUserAddress1,
      wallet1TokenConversionRate: parseFloat(formData.wallet1TokenConversionRate) || 0,
      wallet1TokenPrice: parseFloat(formData.wallet1TokenPrice) || 0,
      wallet2: formData.wallet2.trim(),
      wallet2Percentage: wallet2Percent,
      useUserAddress2: formData.useUserAddress2,
      wallet2TokenConversionRate: parseFloat(formData.wallet2TokenConversionRate) || 0,
      wallet2TokenPrice: parseFloat(formData.wallet2TokenPrice) || 0,
      wallet3: formData.wallet3.trim(),
      wallet3Percentage: wallet3Percent,
      useUserAddress3: formData.useUserAddress3,
    };

    try {
      await savePlan(planData);
      toast.success(editingPlan ? "Plan updated successfully!" : "Plan created successfully!");
      await loadPlans();
      handleCloseDialog();
    } catch (error) {
      toast.error("Failed to save plan");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) {
      return;
    }

    setIsDeleting(id);
    try {
      const success = await deletePlan(id);
      if (success) {
        toast.success("Plan deleted successfully!");
        await loadPlans();
      } else {
        toast.error("Failed to delete plan");
      }
    } catch (error) {
      toast.error("Failed to delete plan");
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newPlans = [...plans];
    const draggedPlan = newPlans[draggedIndex];
    
    // Remove dragged item
    newPlans.splice(draggedIndex, 1);
    
    // Insert at new position
    newPlans.splice(dropIndex, 0, draggedPlan);
    
    // Update sortOrder for all affected plans
    const planOrders = newPlans.map((plan, index) => ({
      id: plan.id,
      sortOrder: index,
    }));

    try {
      await updatePlanOrder(planOrders);
      toast.success("Plan order updated successfully!");
      await loadPlans();
    } catch (error) {
      toast.error("Failed to update plan order");
      console.error(error);
    } finally {
      setDraggedIndex(null);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newPlans = [...plans];
    [newPlans[index - 1], newPlans[index]] = [newPlans[index], newPlans[index - 1]];
    
    const planOrders = newPlans.map((plan, i) => ({
      id: plan.id,
      sortOrder: i,
    }));

    try {
      await updatePlanOrder(planOrders);
      toast.success("Plan order updated successfully!");
      await loadPlans();
    } catch (error) {
      toast.error("Failed to update plan order");
      console.error(error);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === plans.length - 1) return;

    const newPlans = [...plans];
    [newPlans[index], newPlans[index + 1]] = [newPlans[index + 1], newPlans[index]];
    
    const planOrders = newPlans.map((plan, i) => ({
      id: plan.id,
      sortOrder: i,
    }));

    try {
      await updatePlanOrder(planOrders);
      toast.success("Plan order updated successfully!");
      await loadPlans();
    } catch (error) {
      toast.error("Failed to update plan order");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PlusSquare className="w-4 h-4 text-primary" />
                Manage Investment Plans
              </CardTitle>
              <CardDescription>Create and manage investment plans that appear on the landing page</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <PlusSquare className="w-4 h-4" />
              Add New Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No plans created yet. Click "Add New Plan" to create your first plan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Drag rows by the <GripVertical className="w-4 h-4 inline mx-1" /> icon or use the arrow buttons to reorder plans. The order here determines the display order on the frontend.
              </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Order</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Daily Profit</TableHead>
                  <TableHead>Focus</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan, index) => (
                  <TableRow
                    key={plan.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`cursor-move ${
                      draggedIndex === index ? "opacity-50" : ""
                    } ${
                      dragOverIndex === index ? "border-2 border-primary" : ""
                    }`}
                  >
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                        <div className="flex flex-col gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            <ChevronUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === plans.length - 1}
                          >
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <img src={plan.logo || "/logo.png"} alt={plan.label} className="w-10 h-10 object-contain" />
                    </TableCell>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{plan.label}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs font-semibold bg-primary/20 text-primary border border-primary/50 rounded-full">
                        {plan.status || "Daily profit"}
                      </span>
                    </TableCell>
                    <TableCell>{plan.dailyProfit}</TableCell>
                    <TableCell>{plan.focus}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(plan)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(plan.id)}
                          disabled={isDeleting === plan.id}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
            <DialogDescription>
              Fill in all the details for the investment plan. This will appear on the landing page.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. B BAG MAXFI +SBAG+CBAG"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g. MaxFi"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyProfit">Daily Profit *</Label>
                <Input
                  id="dailyProfit"
                  value={formData.dailyProfit}
                  onChange={(e) => setFormData({ ...formData, dailyProfit: e.target.value })}
                  placeholder="e.g. 0.6% ~ 2%"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as PlanStatus })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Display Node">Display Node</SelectItem>
                    <SelectItem value="ICO">ICO</SelectItem>
                    <SelectItem value="Daily profit">Daily profit</SelectItem>
                    <SelectItem value="Trading">Trading</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="focus">Focus *</Label>
                <Input
                  id="focus"
                  value={formData.focus}
                  onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
                  placeholder="e.g. Stable / Treasury-focused"
                  required
                />
              </div>
              <div className="space-y-2">
                <ImageUpload
                  value={formData.logo}
                  onChange={(url) => setFormData({ ...formData, logo: url })}
                  label="Plan Logo *"
                  folder="alphabag/plans"
                  maxSizeMB={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dappUrl">DApp URL *</Label>
                <Input
                  id="dappUrl"
                  value={formData.dappUrl}
                  onChange={(e) => setFormData({ ...formData, dappUrl: e.target.value })}
                  placeholder="e.g. http://maxfi.io/"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recommendedAmount">Recommended Amount (USDT)</Label>
                <Input
                  id="recommendedAmount"
                  type="number"
                  value={formData.recommendedAmount}
                  onChange={(e) => setFormData({ ...formData, recommendedAmount: e.target.value })}
                  placeholder="1000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the plan"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickActionsDescription">Quick Actions Description</Label>
              <Textarea
                id="quickActionsDescription"
                value={formData.quickActionsDescription}
                onChange={(e) => setFormData({ ...formData, quickActionsDescription: e.target.value })}
                placeholder="Brief description for quick actions"
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. Resources, Video, Blog"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtubeUrl">YouTube URL</Label>
                <Input
                  id="youtubeUrl"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/embed/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram">Telegram URL</Label>
                <Input
                  id="telegram"
                  value={formData.telegram}
                  onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                  placeholder="https://t.me/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter URL</Label>
                <Input
                  id="twitter"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="https://twitter.com/..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="materials">Materials (one per line, format: Title|URL)</Label>
              <Textarea
                id="materials"
                value={formData.materials}
                onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                placeholder="Whitepaper|https://example.com/whitepaper&#10;Documentation|https://docs.example.com"
                rows={4}
              />
            </div>

            {/* Wallet Allocation Section */}
            <div className="border-t border-border/50 pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">Investment Wallet Allocation</Label>
                <span className="text-xs text-muted-foreground">
                  (Total: {(
                    parseFloat(formData.wallet1Percentage || "0") +
                    parseFloat(formData.wallet2Percentage || "0") +
                    parseFloat(formData.wallet3Percentage || "0")
                  ).toFixed(1)}%)
                </span>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {/* Wallet 1 */}
                <div className="space-y-2 p-3 border border-border/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="wallet1" className="text-sm font-medium">Wallet 1 Address</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="useUserAddress1"
                        checked={formData.useUserAddress1}
                        onCheckedChange={(checked) => {
                          setFormData({ ...formData, useUserAddress1: checked === true, wallet1: checked ? "" : formData.wallet1 });
                        }}
                      />
                      <Label htmlFor="useUserAddress1" className="text-xs text-muted-foreground cursor-pointer">
                        Use User Address
                      </Label>
                    </div>
                  </div>
                  <Input
                    id="wallet1"
                    value={formData.wallet1}
                    onChange={(e) => setFormData({ ...formData, wallet1: e.target.value, useUserAddress1: false })}
                    placeholder={formData.useUserAddress1 ? "Will use investor's wallet address" : "0x..."}
                    className="font-mono text-sm"
                    disabled={formData.useUserAddress1}
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      id="wallet1Percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.wallet1Percentage}
                      onChange={(e) => setFormData({ ...formData, wallet1Percentage: e.target.value })}
                      placeholder="0"
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border/30">
                    <Label htmlFor="wallet1TokenConversionRate" className="text-xs text-muted-foreground">Token Conversion Rate (BBAG)</Label>
                    <Input
                      id="wallet1TokenConversionRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.wallet1TokenConversionRate}
                      onChange={(e) => setFormData({ ...formData, wallet1TokenConversionRate: e.target.value })}
                      placeholder="e.g., 2 (1 USDT = 2 tokens)"
                      className="text-sm"
                    />
                    <Label htmlFor="wallet1TokenPrice" className="text-xs text-muted-foreground">Token Price in USDT (BBAG)</Label>
                    <Input
                      id="wallet1TokenPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.wallet1TokenPrice}
                      onChange={(e) => setFormData({ ...formData, wallet1TokenPrice: e.target.value })}
                      placeholder="e.g., 2.5"
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Wallet 2 */}
                <div className="space-y-2 p-3 border border-border/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="wallet2" className="text-sm font-medium">Wallet 2 Address</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="useUserAddress2"
                        checked={formData.useUserAddress2}
                        onCheckedChange={(checked) => {
                          setFormData({ ...formData, useUserAddress2: checked === true, wallet2: checked ? "" : formData.wallet2 });
                        }}
                      />
                      <Label htmlFor="useUserAddress2" className="text-xs text-muted-foreground cursor-pointer">
                        Use User Address
                      </Label>
                    </div>
                  </div>
                  <Input
                    id="wallet2"
                    value={formData.wallet2}
                    onChange={(e) => setFormData({ ...formData, wallet2: e.target.value, useUserAddress2: false })}
                    placeholder={formData.useUserAddress2 ? "Will use investor's wallet address" : "0x..."}
                    className="font-mono text-sm"
                    disabled={formData.useUserAddress2}
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      id="wallet2Percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.wallet2Percentage}
                      onChange={(e) => setFormData({ ...formData, wallet2Percentage: e.target.value })}
                      placeholder="0"
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border/30">
                    <Label htmlFor="wallet2TokenConversionRate" className="text-xs text-muted-foreground">Token Conversion Rate (SBAG)</Label>
                    <Input
                      id="wallet2TokenConversionRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.wallet2TokenConversionRate}
                      onChange={(e) => setFormData({ ...formData, wallet2TokenConversionRate: e.target.value })}
                      placeholder="e.g., 2 (1 USDT = 2 tokens)"
                      className="text-sm"
                    />
                    <Label htmlFor="wallet2TokenPrice" className="text-xs text-muted-foreground">Token Price in USDT (SBAG)</Label>
                    <Input
                      id="wallet2TokenPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.wallet2TokenPrice}
                      onChange={(e) => setFormData({ ...formData, wallet2TokenPrice: e.target.value })}
                      placeholder="e.g., 2.5"
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Wallet 3 */}
                <div className="space-y-2 p-3 border border-border/50 rounded-lg md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="wallet3" className="text-sm font-medium">Wallet 3 Address</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="useUserAddress3"
                        checked={formData.useUserAddress3}
                        onCheckedChange={(checked) => {
                          setFormData({ ...formData, useUserAddress3: checked === true, wallet3: checked ? "" : formData.wallet3 });
                        }}
                      />
                      <Label htmlFor="useUserAddress3" className="text-xs text-muted-foreground cursor-pointer">
                        Use User Address
                      </Label>
                    </div>
                  </div>
                  <Input
                    id="wallet3"
                    value={formData.wallet3}
                    onChange={(e) => setFormData({ ...formData, wallet3: e.target.value, useUserAddress3: false })}
                    placeholder={formData.useUserAddress3 ? "Will use investor's wallet address" : "0x..."}
                    className="font-mono text-sm"
                    disabled={formData.useUserAddress3}
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      id="wallet3Percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.wallet3Percentage}
                      onChange={(e) => setFormData({ ...formData, wallet3Percentage: e.target.value })}
                      placeholder="0"
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <Save className="w-4 h-4" />
                {editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAddPlans;
