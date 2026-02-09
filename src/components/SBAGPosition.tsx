import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, RefreshCw, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { SBAGPosition, createSellDelegation, updateSBAGPrice } from "@/lib/sbagPositions";
import { getCachedNUMIPrice } from "@/lib/coinmarketcap";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface SBAGPositionProps {
  position: SBAGPosition;
  onRefresh?: () => void;
}

export const SBAGPositionComponent = ({ position, onRefresh }: SBAGPositionProps) => {
  const { t } = useLanguage();
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [slippageDialogOpen, setSlippageDialogOpen] = useState(false);
  const [sellAmount, setSellAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(position.currentPriceUSDT || null);

  // Calculate available NUMI (total minus pending/processing sells)
  const availableNUMI = position.purchasedNUMI - 
    position.sellDelegations
      .filter(sd => sd.status === "pending" || sd.status === "processing")
      .reduce((sum, sd) => sum + sd.numiAmount, 0);

  // Calculate profit/loss
  const calculatePNL = (numiAmount: number) => {
    if (!position.backofficeConfirmed || !currentPrice || position.purchasePriceUSDT === 0) {
      return { pnl: 0, percentage: 0 };
    }
    
    const currentValue = numiAmount * currentPrice;
    const purchaseValue = numiAmount * position.purchasePriceUSDT;
    const pnl = currentValue - purchaseValue;
    const percentage = purchaseValue > 0 ? (pnl / purchaseValue) * 100 : 0;
    
    return { pnl, percentage };
  };

  // Calculate holding value and PNL for entire position
  const totalPNL = calculatePNL(position.purchasedNUMI);
  const holdingValueUSDT = position.backofficeConfirmed && currentPrice 
    ? position.purchasedNUMI * currentPrice 
    : position.investedUSDT;

  const handleRefreshPrice = async () => {
    setIsRefreshing(true);
    try {
      const price = await getCachedNUMIPrice();
      if (price !== null) {
        await updateSBAGPrice(position.id, price);
        setCurrentPrice(price);
        toast.success("Price updated successfully");
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.error("Failed to fetch price");
      }
    } catch (error) {
      console.error("Error refreshing price:", error);
      toast.error("Failed to refresh price");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSellClick = () => {
    if (!position.backofficeConfirmed) {
      toast.error("Position not yet confirmed by back-office");
      return;
    }
    if (availableNUMI <= 0) {
      toast.error("No NUMI available to sell");
      return;
    }
    setSellDialogOpen(true);
  };

  const handleMaxClick = () => {
    setSellAmount(availableNUMI.toString());
  };

  const handleSellAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const regex = /^\d*\.?\d*$/;
    if (regex.test(value) || value === "") {
      setSellAmount(value);
    }
  };

  const handleConfirmSell = () => {
    const amount = parseFloat(sellAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (amount > availableNUMI) {
      toast.error(`Insufficient NUMI. Available: ${availableNUMI.toFixed(2)} NUMI`);
      return;
    }
    
    // Show slippage warning
    setSellDialogOpen(false);
    setSlippageDialogOpen(true);
  };

  const handleConfirmWithSlippage = async () => {
    setIsSubmitting(true);
    try {
      const amount = parseFloat(sellAmount);
      await createSellDelegation(position.id, amount);
      toast.success("Sell delegation submitted successfully");
      setSellDialogOpen(false);
      setSlippageDialogOpen(false);
      setSellAmount("");
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error("Error creating sell delegation:", error);
      toast.error(error.message || "Failed to submit sell delegation");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-refresh price on mount and periodically
  useEffect(() => {
    const refreshPrice = async () => {
      if (position.backofficeConfirmed) {
        const price = await getCachedNUMIPrice();
        if (price !== null) {
          setCurrentPrice(price);
          // Update in database if price changed significantly
          if (!position.currentPriceUSDT || Math.abs(price - position.currentPriceUSDT) > 0.001) {
            await updateSBAGPrice(position.id, price);
          }
        }
      }
    };

    refreshPrice();
    const interval = setInterval(refreshPrice, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [position.id, position.backofficeConfirmed]);

  const sellPNL = sellAmount ? calculatePNL(parseFloat(sellAmount) || 0) : { pnl: 0, percentage: 0 };

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">
                {position.projectName || "SBAG (Binance Alpha - NUMI)"}
              </CardTitle>
              {position.backofficeEnteredAt && (
                <CardDescription className="mt-1">
                  Backoffice entered: {new Date(position.backofficeEnteredAt).toLocaleString()}
                </CardDescription>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefreshPrice}
              disabled={isRefreshing || !position.backofficeConfirmed}
              className="shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Investment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Invested USDT</Label>
              <p className="text-lg font-semibold">{position.investedUSDT.toFixed(2)} USDT</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Holding NUMI</Label>
              <p className="text-lg font-semibold">
                {position.backofficeConfirmed ? position.purchasedNUMI.toFixed(2) : "Pending..."} NUMI
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Avg Price (USDT)</Label>
              <p className="text-lg font-semibold">
                {position.backofficeConfirmed && position.purchasePriceUSDT > 0
                  ? position.purchasePriceUSDT.toFixed(6)
                  : "-"} USDT
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Holding USDT</Label>
              <p className="text-lg font-semibold">{holdingValueUSDT.toFixed(2)} USDT</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Current Price (USDT)</Label>
              <p className="text-lg font-semibold">
                {currentPrice ? currentPrice.toFixed(6) : "Loading..."} USDT
              </p>
            </div>
            {position.backofficeConfirmed && (
              <div>
                <Label className="text-xs text-muted-foreground">Available NUMI</Label>
                <p className="text-lg font-semibold">{availableNUMI.toFixed(2)} NUMI</p>
              </div>
            )}
          </div>

          {/* Profit/Loss Display */}
          {position.backofficeConfirmed && currentPrice && position.purchasePriceUSDT > 0 && (
            <div className="p-4 rounded-lg border border-border/50 bg-background/50">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs text-muted-foreground">Unrealized P/L</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {totalPNL.pnl >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <p className={`text-lg font-bold ${totalPNL.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {totalPNL.pnl >= 0 ? "+" : ""}{totalPNL.pnl.toFixed(2)} USDT ({totalPNL.percentage >= 0 ? "+" : ""}{totalPNL.percentage.toFixed(2)}%)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sell Delegation Button */}
          {position.backofficeConfirmed && availableNUMI > 0 && (
            <Button
              variant="default"
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handleSellClick}
            >
              Sell Delegation <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {/* Pending Sells */}
          {position.sellDelegations.filter(sd => sd.status === "pending" || sd.status === "processing").length > 0 && (
            <div className="pt-4 border-t border-border/50">
              <Label className="text-xs text-muted-foreground mb-2 block">Pending Sells</Label>
              <div className="space-y-2">
                {position.sellDelegations
                  .filter(sd => sd.status === "pending" || sd.status === "processing")
                  .map((sd) => (
                    <div key={sd.id} className="p-2 rounded bg-background/50 border border-border/30">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{sd.numiAmount.toFixed(2)} NUMI</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          sd.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {sd.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sell Dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>SBAG (NUMI) Sell Delegation</DialogTitle>
            <DialogDescription>
              Enter the amount of NUMI you want to sell
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Holding Amount: {position.purchasedNUMI.toFixed(2)} NUMI</Label>
            </div>
            <div>
              <Label htmlFor="sell-amount">Sell Amount (NUMI)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="sell-amount"
                  type="text"
                  value={sellAmount}
                  onChange={(e) => handleSellAmountChange(e.target.value)}
                  placeholder="0.00"
                />
                <Button variant="outline" onClick={handleMaxClick}>
                  MAX
                </Button>
              </div>
            </div>
            {sellAmount && !isNaN(parseFloat(sellAmount)) && parseFloat(sellAmount) > 0 && (
              <div className="p-3 rounded-lg border border-border/50 bg-background/50">
                <Label className="text-xs text-muted-foreground">Estimated P/L</Label>
                <div className="flex items-center gap-2 mt-1">
                  {sellPNL.pnl >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <p className={`text-sm font-semibold ${sellPNL.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {sellPNL.pnl >= 0 ? "+" : ""}{sellPNL.pnl.toFixed(2)} USDT ({sellPNL.percentage >= 0 ? "+" : ""}{sellPNL.percentage.toFixed(2)}%)
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSellDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSell} disabled={!sellAmount || parseFloat(sellAmount) <= 0}>
              Confirm Sell Delegation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slippage Warning Dialog */}
      <Dialog open={slippageDialogOpen} onOpenChange={setSlippageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Slippage Warning
            </DialogTitle>
            <DialogDescription>
              Please review the slippage warning before confirming
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg border-2 border-yellow-500/50 bg-yellow-500/10">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-500 mb-1">
                    Slippage Warning
                  </p>
                  <p className="text-sm text-foreground">
                    A sell slippage of 5% to 10% may occur depending on market liquidity. Press Confirm to proceed with sell delegation.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg border border-border/50 bg-background/50">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sell Amount:</span>
                  <span className="font-semibold">{sellAmount} NUMI</span>
                </div>
                {currentPrice && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Value:</span>
                    <span className="font-semibold">
                      {(parseFloat(sellAmount) * currentPrice).toFixed(2)} USDT
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSlippageDialogOpen(false);
              setSellDialogOpen(true);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmWithSlippage} 
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Submitting..." : "Confirm Sell Delegation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
