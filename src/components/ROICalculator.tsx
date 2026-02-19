import { useState, useEffect, useMemo } from "react";
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Calculator,
  ArrowRight,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { StakingPlan, getActiveStakingPlans } from "@/lib/stakingPlans";

interface ScenarioResult {
  plan: StakingPlan;
  dailyProfit: number;
  totalProfit: number;
  totalReturn: number;
  compoundReturn: number;
  roi: number;
  chartData: Array<{ day: number; simple: number; compound: number }>;
}

function calcCompound(principal: number, dailyRateBps: number, days: number): number {
  const rate = dailyRateBps / 10000;
  return principal * Math.pow(1 + rate, days);
}

function buildChartData(principal: number, dailyRateBps: number, days: number) {
  const points = Math.min(days, 60); // max 60 data points for readability
  const step = Math.max(1, Math.floor(days / points));
  const rate = dailyRateBps / 10000;
  const data: Array<{ day: number; simple: number; compound: number }> = [];

  for (let d = 0; d <= days; d += step) {
    const simple = principal + principal * rate * d;
    const compound = principal * Math.pow(1 + rate, d);
    data.push({ day: d, simple: +simple.toFixed(2), compound: +compound.toFixed(2) });
  }
  // Ensure last day is always present
  if (data[data.length - 1]?.day !== days) {
    data.push({
      day: days,
      simple: +(principal + principal * rate * days).toFixed(2),
      compound: +calcCompound(principal, dailyRateBps, days).toFixed(2),
    });
  }
  return data;
}

export function ROICalculator() {
  const [plans, setPlans] = useState<StakingPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [compound, setCompound] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) loadPlans();
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

  // Single plan calculation
  const dailyRate = selectedPlan ? selectedPlan.dailyRateBps / 100 : 0;
  const dailyProfit = selectedPlan ? (investmentAmount * selectedPlan.dailyRateBps) / 10000 : 0;
  const totalProfit = selectedPlan ? dailyProfit * selectedPlan.lockDays : 0;
  const totalReturn = investmentAmount + totalProfit;
  const compoundReturn = selectedPlan
    ? calcCompound(investmentAmount, selectedPlan.dailyRateBps, selectedPlan.lockDays)
    : investmentAmount;

  const chartData = useMemo(() => {
    if (!selectedPlan || investmentAmount <= 0) return [];
    return buildChartData(investmentAmount, selectedPlan.dailyRateBps, selectedPlan.lockDays);
  }, [selectedPlan, investmentAmount]);

  // Scenario comparison — all plans side-by-side
  const scenarios: ScenarioResult[] = useMemo(() => {
    if (investmentAmount <= 0) return [];
    return plans.map((plan) => {
      const dp = (investmentAmount * plan.dailyRateBps) / 10000;
      const tp = dp * plan.lockDays;
      const tr = investmentAmount + tp;
      const cr = calcCompound(investmentAmount, plan.dailyRateBps, plan.lockDays);
      return {
        plan,
        dailyProfit: dp,
        totalProfit: tp,
        totalReturn: tr,
        compoundReturn: cr,
        roi: (tp / investmentAmount) * 100,
        chartData: buildChartData(investmentAmount, plan.dailyRateBps, plan.lockDays),
      };
    }).sort((a, b) => b.roi - a.roi);
  }, [plans, investmentAmount]);

  const displayReturn = compound ? compoundReturn : totalReturn;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calculator className="w-4 h-4" />
          ROI Calculator
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            ROI Calculator
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="single" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="single" className="flex-1">Single Plan</TabsTrigger>
            <TabsTrigger value="compare" className="flex-1">Compare All</TabsTrigger>
          </TabsList>

          {/* ── Single plan tab ── */}
          <TabsContent value="single" className="space-y-5 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (USDT)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.title} ({plan.lockDays}d – {plan.dailyRateBps / 100}%/day)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Compound toggle */}
            <div className="flex items-center gap-3">
              <Switch checked={compound} onCheckedChange={setCompound} id="compound" />
              <Label htmlFor="compound" className="cursor-pointer">
                Compound reinvestment (daily)
              </Label>
            </div>

            <Card className="bg-muted/50 border-none">
              <CardContent className="pt-5 space-y-3">
                <Row label="Daily Rate" value={`${dailyRate.toFixed(2)}%`} />
                <Row label="Daily Profit" value={`${dailyProfit.toFixed(2)} USDT`} green />
                <Row label="Duration" value={`${selectedPlan?.lockDays || 0} Days`} />
                <Row label={compound ? "Compound Total Profit" : "Simple Total Profit"} value={`+${(displayReturn - investmentAmount).toFixed(2)} USDT`} green />
                <div className="h-px bg-border my-1" />
                <Row
                  label="Total Return"
                  value={`${investmentAmount.toFixed(2)} → ${displayReturn.toFixed(2)} USDT`}
                  bold
                />
                {compound && (
                  <p className="text-xs text-muted-foreground">
                    Simple: {totalReturn.toFixed(2)} USDT vs Compound: {compoundReturn.toFixed(2)} USDT
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Growth chart */}
            {chartData.length > 0 && (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" fontSize={10} tickLine={false} axisLine={false} label={{ value: "Days", position: "insideBottomRight", offset: -5, fontSize: 10 }} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line type="monotone" dataKey="simple" name="Simple" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="compound" name="Compound" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          {/* ── Compare all tab ── */}
          <TabsContent value="compare" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Amount (USDT)</Label>
              <Input
                type="number"
                placeholder="e.g. 1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
              />
            </div>
            {scenarios.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {investmentAmount <= 0 ? "Enter an amount to compare plans" : "No plans available"}
              </p>
            ) : (
              <div className="space-y-3">
                {scenarios.map((s, i) => (
                  <Card key={s.plan.id} className={`border ${i === 0 ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm flex items-center gap-2">
                          {i === 0 && <TrendingUp className="w-3.5 h-3.5 text-primary" />}
                          {s.plan.title}
                        </p>
                        <span className="text-xs text-muted-foreground">{s.plan.lockDays}d · {s.plan.dailyRateBps / 100}%/day</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <span className="text-muted-foreground">Simple ROI</span>
                        <span className="font-medium text-green-500">+{s.roi.toFixed(1)}%</span>
                        <span className="text-muted-foreground">Simple return</span>
                        <span className="font-medium">${s.totalReturn.toFixed(2)}</span>
                        <span className="text-muted-foreground">Compound return</span>
                        <span className="font-medium text-emerald-500">${s.compoundReturn.toFixed(2)}</span>
                        <span className="text-muted-foreground">Daily profit</span>
                        <span className="font-medium">${s.dailyProfit.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Button className="w-full mt-2" onClick={() => setIsOpen(false)}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, green, bold }: { label: string; value: string; green?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? "font-bold" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm font-semibold ${green ? "text-green-500" : bold ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}
