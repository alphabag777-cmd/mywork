import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, ArrowRight } from "lucide-react";
import { StakingPlan, getActiveStakingPlans } from "@/lib/stakingPlans";

export function ROICalculator() {
  const [plans, setPlans] = useState<StakingPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    const activePlans = await getActiveStakingPlans();
    setPlans(activePlans);
    if (activePlans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(activePlans[0].id);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const investmentAmount = parseFloat(amount) || 0;

  // Calculation Logic
  // dailyRateBps is in basis points (e.g. 130 = 1.3%)
  // Daily Profit = Amount * (dailyRateBps / 10000)
  // Total Profit = Daily Profit * Lock Days
  const dailyRate = selectedPlan ? selectedPlan.dailyRateBps / 100 : 0; // %
  const dailyProfit = selectedPlan ? (investmentAmount * selectedPlan.dailyRateBps) / 10000 : 0;
  const totalProfit = selectedPlan ? dailyProfit * selectedPlan.lockDays : 0;
  const totalReturn = investmentAmount + totalProfit;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calculator className="w-4 h-4" />
          ROI Calculator
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            ROI Calculator
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Investment Amount (USDT)</label>
              <Input
                type="number"
                placeholder="Enter amount (e.g. 1000)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Plan</label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a staking plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.title} ({plan.lockDays} Days - {plan.dailyRateBps / 100}% Daily)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="bg-muted/50 border-none">
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Daily Profit</span>
                <span className="font-semibold text-green-600">
                  {dailyProfit.toFixed(2)} USDT
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="font-medium">{selectedPlan?.lockDays || 0} Days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Profit</span>
                <span className="font-semibold text-green-600">
                  +{totalProfit.toFixed(2)} USDT
                </span>
              </div>
              
              <div className="h-px bg-border my-2" />
              
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold">Total Return</span>
                <div className="flex items-center gap-2 text-primary font-bold">
                  {investmentAmount.toFixed(2)} <ArrowRight className="w-4 h-4" /> {totalReturn.toFixed(2)} USDT
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={() => setIsOpen(false)}>
            Close Calculator
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
