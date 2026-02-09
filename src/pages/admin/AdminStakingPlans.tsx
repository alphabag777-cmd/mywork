import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PlusSquare, Trash2, Edit, Save, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getAllStakingPlans,
  createStakingPlan,
  updateStakingPlan,
  deleteStakingPlan,
  toggleStakingPlanActive,
  StakingPlan,
} from "@/lib/stakingPlans";
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
import { Badge } from "@/components/ui/badge";

export const AdminStakingPlans = () => {
  const [plans, setPlans] = useState<StakingPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<StakingPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    planId: "",
    token: "",
    lockDays: "",
    dailyRateBps: "",
    title: "",
    minDeposit: "",
    maxDeposit: "",
    rewardPool: "",
    active: true,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const allPlans = await getAllStakingPlans();
      setPlans(allPlans);
    } catch (error) {
      console.error("Error loading staking plans:", error);
      toast.error("Failed to load staking plans");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      planId: "",
      token: "",
      lockDays: "",
      dailyRateBps: "",
      title: "",
      minDeposit: "",
      maxDeposit: "",
      rewardPool: "",
      active: true,
    });
    setEditingPlan(null);
  };

  const handleEdit = (plan: StakingPlan) => {
    setEditingPlan(plan);
    setFormData({
      planId: plan.planId,
      token: plan.token,
      lockDays: plan.lockDays.toString(),
      dailyRateBps: plan.dailyRateBps.toString(),
      title: plan.title,
      minDeposit: plan.minDeposit.toString(),
      maxDeposit: plan.maxDeposit.toString(),
      rewardPool: plan.rewardPool.toString(),
      active: plan.active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this staking plan?")) {
      return;
    }

    setIsDeleting(planId);
    try {
      await deleteStakingPlan(planId);
      toast.success("Staking plan deleted successfully");
      await loadPlans();
    } catch (error) {
      console.error("Error deleting staking plan:", error);
      toast.error("Failed to delete staking plan");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleActive = async (planId: string, currentActive: boolean) => {
    try {
      await toggleStakingPlanActive(planId, !currentActive);
      toast.success(`Plan ${!currentActive ? "activated" : "deactivated"} successfully`);
      await loadPlans();
    } catch (error) {
      console.error("Error toggling plan active status:", error);
      toast.error("Failed to update plan status");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.planId || !formData.token || !formData.title) {
      toast.error("Please fill in all required fields");
      return;
    }

    const lockDays = parseInt(formData.lockDays);
    const dailyRateBps = parseFloat(formData.dailyRateBps);
    const minDeposit = parseFloat(formData.minDeposit);
    const maxDeposit = parseFloat(formData.maxDeposit);
    const rewardPool = parseFloat(formData.rewardPool);

    if (isNaN(lockDays) || lockDays <= 0) {
      toast.error("Lock days must be a positive number");
      return;
    }

    if (isNaN(dailyRateBps) || dailyRateBps <= 0) {
      toast.error("Daily rate must be a positive number");
      return;
    }

    if (isNaN(minDeposit) || minDeposit <= 0) {
      toast.error("Min deposit must be a positive number");
      return;
    }

    if (isNaN(maxDeposit) || maxDeposit <= minDeposit) {
      toast.error("Max deposit must be greater than min deposit");
      return;
    }

    try {
      if (editingPlan) {
        // Update existing plan
        await updateStakingPlan(editingPlan.id, {
          planId: formData.planId,
          token: formData.token,
          lockDays,
          dailyRateBps,
          title: formData.title,
          minDeposit,
          maxDeposit,
          rewardPool,
          active: formData.active,
        });
        toast.success("Staking plan updated successfully");
      } else {
        // Create new plan
        await createStakingPlan({
          planId: formData.planId,
          token: formData.token,
          lockDays,
          dailyRateBps,
          title: formData.title,
          minDeposit,
          maxDeposit,
          rewardPool,
          active: formData.active,
        });
        toast.success("Staking plan created successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      await loadPlans();
    } catch (error) {
      console.error("Error saving staking plan:", error);
      toast.error("Failed to save staking plan");
    }
  };

  const calculateAPR = (dailyRateBps: number) => {
    const dailyRate = dailyRateBps / 10000; // Convert basis points to decimal
    const apr = dailyRate * 365 * 100; // Convert to percentage
    return apr.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold">Staking Plans</h1>
          <p className="text-sm text-muted-foreground">Manage staking plans and their parameters</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusSquare className="w-4 h-4 mr-2" />
          Add Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : plans.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No staking plans found. Create your first plan to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>All Staking Plans</CardTitle>
            <CardDescription>Manage and configure staking plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Lock Days</TableHead>
                    <TableHead>Daily Rate (BPS)</TableHead>
                    <TableHead>APR</TableHead>
                    <TableHead>Min/Max Deposit</TableHead>
                    <TableHead>Reward Pool</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.planId}</TableCell>
                      <TableCell>{plan.title}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {plan.token.slice(0, 6)}...{plan.token.slice(-4)}
                      </TableCell>
                      <TableCell>{plan.lockDays}</TableCell>
                      <TableCell>{plan.dailyRateBps}</TableCell>
                      <TableCell className="font-semibold text-primary">
                        {calculateAPR(plan.dailyRateBps)}%
                      </TableCell>
                      <TableCell>
                        {plan.minDeposit.toLocaleString()} / {plan.maxDeposit.toLocaleString()}
                      </TableCell>
                      <TableCell>{plan.rewardPool.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={plan.active ? "default" : "secondary"}>
                          {plan.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={plan.active}
                            onCheckedChange={() => handleToggleActive(plan.id, plan.active)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(plan.id)}
                            disabled={isDeleting === plan.id}
                          >
                            {isDeleting === plan.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Staking Plan" : "Create Staking Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlan
                ? "Update the staking plan parameters"
                : "Create a new staking plan with custom parameters"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planId">Plan ID *</Label>
                <Input
                  id="planId"
                  value={formData.planId}
                  onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                  placeholder="alpha_30"
                  required
                />
                <p className="text-xs text-muted-foreground">Unique identifier (e.g., alpha_30)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Alpha 30 Day"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="token">Token Address *</Label>
              <Input
                id="token"
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                placeholder="0x..."
                required
              />
              <p className="text-xs text-muted-foreground">ERC20 token contract address</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lockDays">Lock Days *</Label>
                <Input
                  id="lockDays"
                  type="number"
                  value={formData.lockDays}
                  onChange={(e) => setFormData({ ...formData, lockDays: e.target.value })}
                  placeholder="30"
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyRateBps">Daily Rate (BPS) *</Label>
                <Input
                  id="dailyRateBps"
                  type="number"
                  step="0.1"
                  value={formData.dailyRateBps}
                  onChange={(e) => setFormData({ ...formData, dailyRateBps: e.target.value })}
                  placeholder="130"
                  min="0.1"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Basis points (130 = 1.3% daily). Decimal values accepted (e.g., 1.3, 130.5). APR: {formData.dailyRateBps ? calculateAPR(parseFloat(formData.dailyRateBps) || 0) : "0"}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minDeposit">Min Deposit *</Label>
                <Input
                  id="minDeposit"
                  type="number"
                  value={formData.minDeposit}
                  onChange={(e) => setFormData({ ...formData, minDeposit: e.target.value })}
                  placeholder="100"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDeposit">Max Deposit *</Label>
                <Input
                  id="maxDeposit"
                  type="number"
                  value={formData.maxDeposit}
                  onChange={(e) => setFormData({ ...formData, maxDeposit: e.target.value })}
                  placeholder="100000"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rewardPool">Reward Pool</Label>
              <Input
                id="rewardPool"
                type="number"
                value={formData.rewardPool}
                onChange={(e) => setFormData({ ...formData, rewardPool: e.target.value })}
                placeholder="500000"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">Total reward pool size (optional)</p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Active</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {editingPlan ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStakingPlans;
