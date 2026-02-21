import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCart } from "@/contexts/CartContext";
import { getPlanById } from "@/lib/plans";
import { saveUserInvestment, extractCategoryFromName } from "@/lib/userInvestments";
import { Trash2, ShoppingCart, Plus, Minus, Wallet, Loader2, Zap, Check, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAccount, useChainId } from "wagmi";
import { bsc } from "wagmi/chains";
import { parseUnits, formatUnits } from "viem";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  useUSDTToken,
  useUSDTDecimals,
  useTokenBalance,
  useTokenAllowance,
  useApproveToken,
  useInvest,
  useInvestSplit,
} from "@/hooks/useInvestment";
import { NEW_INVESTMENT_CONTRACT_ADDRESS } from "@/lib/contract";
import { isAddress } from "viem";
import { isLoomxReferralRegistered } from "@/lib/referralValidation";
import { isNewWallet } from "@/lib/users";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, clearCart } = useCart();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Investment hooks
  const usdtToken = useUSDTToken();
  const decimals = useUSDTDecimals(usdtToken);
  const tokenBalance = useTokenBalance(usdtToken);
  const allowance = useTokenAllowance(usdtToken, NEW_INVESTMENT_CONTRACT_ADDRESS);
  const { approve, isPending: isApproving, isSuccess: isApproveSuccess } = useApproveToken();
  const { invest, isPending: isInvesting, isConfirming, isSuccess: isInvestSuccess, hash: investHash } = useInvest();
  const { investSplit, isPending: isInvestSplitPending, isConfirming: isInvestSplitConfirming, isSuccess: isInvestSplitSuccess, hash: investSplitHash } = useInvestSplit();
  const [amount, setAmount] = useState<string>("1000");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const pendingInvestRef = useRef<{ plan: any; amount: bigint } | null>(null);
  const investedAmountRef = useRef<string>("");
  const investedPlanRef = useRef<{ id: string; name: string; dappUrl: string } | null>(null);

  // Calculate invest amount in wei
  const investAmountWei = amount && decimals ? parseUnits(amount, decimals) : 0n;
  
  // Check if approval is needed
  const needsApproval = allowance !== undefined && investAmountWei > 0n && allowance < investAmountWei;

  // Calculate balance formatted
  const balanceFormatted = tokenBalance && decimals
    ? parseFloat(formatUnits(tokenBalance, decimals)).toFixed(6)
    : "0.000000";

  // Handle max button
  const handleMax = () => {
    if (tokenBalance && decimals) {
      setAmount(balanceFormatted);
    }
  };

  // Handle investment
  const handleInvest = async () => {
    if (!isConnected || !address) {
      toast.error(t.staking.pleaseConnectWallet);
      return;
    }

    // MANDATORY REFERRAL VALIDATION: Check if wallet is new and Loomx referral is registered
    try {
      const walletIsNew = await isNewWallet(address);
      
      // Only enforce referral requirement for NEW wallets
      if (walletIsNew) {
        const referralRegistered = isLoomxReferralRegistered();
        if (!referralRegistered) {
          toast.error("Referral registration required. Please register your Loomx referral code before investing.");
          // Redirect to community page
          navigate("/community");
          return;
        }
      }
    } catch (error) {
      console.error("Error checking wallet status:", error);
      // In case of error, don't block the user
    }

    if (chainId !== bsc.id) {
      toast.error(t.staking.switchToBSC);
      return;
    }

    if (!usdtToken) {
      toast.error(t.staking.tokenNotAvailable);
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const minInvestment = 0;
    if (parseFloat(amount) < minInvestment) {
      toast.error(`Minimum investment is $${minInvestment}`);
      return;
    }

    // Store the invested amount for the success message
    investedAmountRef.current = amount;

    if (!decimals) {
      toast.error("Token decimals not available");
      return;
    }

    if (tokenBalance && investAmountWei > tokenBalance) {
      toast.error(t.staking.insufficientBalance);
      return;
    }

    // Get the first plan from cart (or use selected project)
    let plan = items.length > 0 
      ? (selectedProject ? items.find(item => item.plan.id === selectedProject)?.plan : items[0].plan)
      : null;

    // If plan exists but doesn't have wallet1 data, try to reload from Firestore
    if (plan && !plan.wallet1 && !plan.useUserAddress1) {
      console.log("Plan missing wallet data, reloading from Firestore...");
      try {
        const freshPlan = await getPlanById(plan.id);
        if (freshPlan) {
          plan = freshPlan;
          console.log("Reloaded plan from Firestore:", {
            wallet1: plan.wallet1,
            wallet2: plan.wallet2,
            wallet3: plan.wallet3,
            p1: plan.wallet1Percentage,
            p2: plan.wallet2Percentage,
            p3: plan.wallet3Percentage,
          });
        }
      } catch (error) {
        console.error("Failed to reload plan from Firestore:", error);
      }
    }

    // Store the plan info for the success message (after plan is retrieved)
    if (plan) {
      investedPlanRef.current = {
        id: plan.id,
        name: plan.name,
        dappUrl: plan.dappUrl || "http://maxfi.io/",
      };
    }

    console.log("Cart handleInvest - plan check:", {
      hasPlan: !!plan,
      planId: plan?.id,
      wallet1: plan?.wallet1,
      wallet2: plan?.wallet2,
      wallet3: plan?.wallet3,
      p1: plan?.wallet1Percentage,
      p2: plan?.wallet2Percentage,
      p3: plan?.wallet3Percentage,
      itemsLength: items.length,
    });

    // Check if plan has at least wallet1 configured
    // wallet2/wallet3 are optional — if empty, wallet1 receives 100%
    const hasWallet1 = (plan?.wallet1 && plan.wallet1.trim() !== "") || (plan?.useUserAddress1 && address);
    const hasWallet2 = (plan?.wallet2 && plan.wallet2.trim() !== "") || (plan?.useUserAddress2 && address);
    const hasWallet3 = (plan?.wallet3 && plan.wallet3.trim() !== "") || (plan?.useUserAddress3 && address);

    console.log("Wallet configuration check:", {
      hasWallet1,
      hasWallet2,
      hasWallet3,
      wallet1Value: plan?.wallet1,
      wallet2Value: plan?.wallet2,
      wallet3Value: plan?.wallet3,
      p1Value: plan?.wallet1Percentage,
      p2Value: plan?.wallet2Percentage,
      p3Value: plan?.wallet3Percentage,
    });

    if (plan && hasWallet1) {
      // Determine wallet addresses (use user address if flag is set)
      const wallet1Address = plan.useUserAddress1 ? address! : plan.wallet1!;

      // wallet2/wallet3: fall back to wallet1 if empty → full amount goes to wallet1
      const wallet2Address = hasWallet2
        ? (plan.useUserAddress2 ? address! : plan.wallet2!)
        : wallet1Address;
      const wallet3Address = hasWallet3
        ? (plan.useUserAddress3 ? address! : plan.wallet3!)
        : wallet1Address;

      // Compute percentages: if wallet2/wallet3 are absent, wallet1 gets 100%
      let p1 = plan.wallet1Percentage ?? 0;
      let p2 = hasWallet2 ? (plan.wallet2Percentage ?? 0) : 0;
      let p3 = hasWallet3 ? (plan.wallet3Percentage ?? 0) : 0;

      // Auto-assign 100% to wallet1 when wallet2 & wallet3 are both absent
      if (!hasWallet2 && !hasWallet3) {
        p1 = 100;
        p2 = 0;
        p3 = 0;
      }

      // If percentages are all 0 (misconfigured), default wallet1 to 100%
      if (p1 === 0 && p2 === 0 && p3 === 0) {
        p1 = 100;
      }

      // Validate wallet addresses
      if (!isAddress(wallet1Address) || !isAddress(wallet2Address) || !isAddress(wallet3Address)) {
        toast.error("Invalid wallet addresses in plan configuration");
        return;
      }

      // Check if approval is needed
      if (needsApproval && usdtToken) {
        // Store plan info for after approval
        pendingInvestRef.current = { plan, amount: investAmountWei };
        approve(usdtToken, investAmountWei, NEW_INVESTMENT_CONTRACT_ADDRESS);
        return;
      }

      // Use investSplit with resolved addresses and percentages
      try {
        console.log("Calling investSplit directly (no approval needed):", {
          amount: investAmountWei.toString(),
          wallet1: wallet1Address,
          wallet2: wallet2Address,
          wallet3: wallet3Address,
          p1,
          p2,
          p3,
        });
        investSplit(
          investAmountWei,
          wallet1Address as `0x${string}`,
          wallet2Address as `0x${string}`,
          wallet3Address as `0x${string}`,
          p1,
          p2,
          p3
        );
      } catch (error: any) {
        console.error("Error calling investSplit:", error);
        toast.error(`Investment failed: ${error.message}`);
      }
      return;
    }

    // Fallback to old invest method if wallet1 is not configured
    console.log("Falling back to legacy invest method - wallet1 not configured:", {
      hasPlan: !!plan,
      hasWallet1: !!(plan?.wallet1 || plan?.useUserAddress1),
    });
    // Check if approval is needed
    if (needsApproval && usdtToken) {
      approve(usdtToken, investAmountWei);
      return;
    }

    // Proceed with investment (legacy method)
    invest(investAmountWei);
  };

  // Handle successful investment
  useEffect(() => {
    if (isInvestSuccess || isInvestSplitSuccess) {
      const saveInvestment = async () => {
        try {
          if (!address) return;

          // Get plan information
          let plan = items.length > 0 
            ? (selectedProject ? items.find(item => item.plan.id === selectedProject)?.plan : items[0].plan)
            : null;

          // If plan exists but doesn't have full data, try to reload from Firestore
          if (plan && (!plan.name || !plan.id)) {
            try {
              const freshPlan = await getPlanById(plan.id);
              if (freshPlan) {
                plan = freshPlan;
              }
            } catch (error) {
              console.error("Failed to reload plan from Firestore:", error);
            }
          }

          // Get invested amount
          const investedAmount = parseFloat(investedAmountRef.current || amount);
          const transactionHash = investHash || investSplitHash || undefined;

          if (plan && investedAmount > 0) {
            // Determine category from plan name
            const category = extractCategoryFromName(plan.name);

            // Calculate token amounts, values, and profits for BBAG and SBAG
            let tokenAmount: number | undefined;
            let tokenValueUSDT: number | undefined;
            let profit: number | undefined;

            if (category === "BBAG" && plan.wallet1Percentage && plan.wallet1Percentage > 0) {
              // Calculate split amount for BBAG (Wallet 1)
              const splitAmount = (investedAmount * plan.wallet1Percentage) / 100;
              
              // Calculate token amount if conversion rate is set
              if (plan.wallet1TokenConversionRate && plan.wallet1TokenConversionRate > 0) {
                tokenAmount = splitAmount * plan.wallet1TokenConversionRate;
                
                // Calculate token value if token price is set
                if (plan.wallet1TokenPrice && plan.wallet1TokenPrice > 0) {
                  tokenValueUSDT = tokenAmount * plan.wallet1TokenPrice;
                  // Profit is the token value (based on user's example)
                  profit = tokenValueUSDT;
                }
              }
            } else if (category === "SBAG" && plan.wallet2Percentage && plan.wallet2Percentage > 0) {
              // Calculate split amount for SBAG (Wallet 2)
              const splitAmount = (investedAmount * plan.wallet2Percentage) / 100;
              
              // Calculate token amount if conversion rate is set
              if (plan.wallet2TokenConversionRate && plan.wallet2TokenConversionRate > 0) {
                tokenAmount = splitAmount * plan.wallet2TokenConversionRate;
                
                // Calculate token value if token price is set
                if (plan.wallet2TokenPrice && plan.wallet2TokenPrice > 0) {
                  tokenValueUSDT = tokenAmount * plan.wallet2TokenPrice;
                  // Profit is the token value (based on user's example)
                  profit = tokenValueUSDT;
                }
              }
            }

            // Save investment to Firestore
            await saveUserInvestment({
              userId: address.toLowerCase(),
              category: category,
              projectId: plan.id,
              projectName: plan.name,
              amount: investedAmount,
              ownershipPercentage: 0, // Can be calculated later if needed
              transactionHash: transactionHash || undefined,
              investedAt: Date.now(),
              tokenAmount: tokenAmount,
              tokenValueUSDT: tokenValueUSDT,
              profit: profit,
            });

            console.log("Investment saved to Firestore:", {
              projectId: plan.id,
              projectName: plan.name,
              amount: investedAmount,
              category,
              tokenAmount,
              tokenValueUSDT,
              profit,
            });
          }
        } catch (error) {
          console.error("Failed to save investment to Firestore:", error);
          // Don't show error to user, investment was successful on-chain
        }
      };

      saveInvestment();
      setShowSuccessPopup(true);
      setAmount("1000");
      pendingInvestRef.current = null;
    }
  }, [isInvestSuccess, isInvestSplitSuccess, address, items, selectedProject, investHash, investSplitHash, amount]);

  // Handle successful approval
  useEffect(() => {
    if (isApproveSuccess && pendingInvestRef.current) {
      const { plan, amount } = pendingInvestRef.current;
      
      // Resolve wallet addresses (same logic as handleInvest)
      const hasWallet1 = (plan?.wallet1 && plan.wallet1.trim() !== "") || (plan?.useUserAddress1 && address);
      const hasWallet2 = (plan?.wallet2 && plan.wallet2.trim() !== "") || (plan?.useUserAddress2 && address);
      const hasWallet3 = (plan?.wallet3 && plan.wallet3.trim() !== "") || (plan?.useUserAddress3 && address);

      const wallet1Address = plan.useUserAddress1 ? address! : plan.wallet1!;
      const wallet2Address = hasWallet2
        ? (plan.useUserAddress2 ? address! : plan.wallet2!)
        : wallet1Address;
      const wallet3Address = hasWallet3
        ? (plan.useUserAddress3 ? address! : plan.wallet3!)
        : wallet1Address;

      let p1 = plan.wallet1Percentage ?? 0;
      let p2 = hasWallet2 ? (plan.wallet2Percentage ?? 0) : 0;
      let p3 = hasWallet3 ? (plan.wallet3Percentage ?? 0) : 0;

      if (!hasWallet2 && !hasWallet3) { p1 = 100; p2 = 0; p3 = 0; }
      if (p1 === 0 && p2 === 0 && p3 === 0) { p1 = 100; }

      if (hasWallet1 && wallet1Address && isAddress(wallet1Address) && isAddress(wallet2Address) && isAddress(wallet3Address)) {
        console.log("Calling investSplit after approval:", {
          amount: amount.toString(),
          wallet1: wallet1Address,
          wallet2: wallet2Address,
          wallet3: wallet3Address,
          p1, p2, p3,
        });
        investSplit(
          amount,
          wallet1Address as `0x${string}`,
          wallet2Address as `0x${string}`,
          wallet3Address as `0x${string}`,
          p1,
          p2,
          p3
        );
        pendingInvestRef.current = null;
      } else {
        // Fallback to old invest method
        invest(amount);
        pendingInvestRef.current = null;
      }
    }
  }, [isApproveSuccess, invest, investSplit]);

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-[88px] sm:pt-20 pb-12">
          <div className="container mx-auto px-4 text-center">
            <Card className="max-w-md mx-auto mt-12">
              <CardContent className="pt-6">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
                <p className="text-muted-foreground">Please connect your wallet to view your cart</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[88px] sm:pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {/* Left Panel: Cart */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Cart</span>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="text-lg font-semibold">{items.length}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">
                      Your cart is empty. Add a project from the cards above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.plan.id}
                        className="card-metallic rounded-xl p-4 border-2 border-border/50"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <img
                              src={item.plan.logo}
                              alt={item.plan.label}
                              className="w-12 h-12 object-contain rounded-lg border border-border/50 bg-secondary/20 p-2 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/logo.png";
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground mb-1 truncate">
                                {item.plan.name}
                              </h4>
                              <p className="text-sm text-muted-foreground truncate">
                                {item.plan.label}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 border border-border rounded-lg">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.plan.id, item.quantity - 1)}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-8 text-center font-semibold text-sm">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.plan.id, item.quantity + 1)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive h-8 w-8"
                              onClick={() => {
                                removeFromCart(item.plan.id);
                                toast.success("Removed from cart");
                                if (selectedProject === item.plan.id) {
                                  setSelectedProject(null);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right Panel: Invest / Participate */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Invest / Participate</CardTitle>
                <CardDescription>
                  Enter the amount(USDT) and click Participate. On-chain flow will be approve → deposit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Allocation Section */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Allocation</h3>
                  {(() => {
                    const activePlan = items.length > 0
                      ? (selectedProject ? items.find(i => i.plan.id === selectedProject)?.plan : items[0].plan)
                      : null;

                    // No plan in cart → show empty placeholder
                    if (!activePlan) {
                      return (
                        <div className="card-metallic rounded-lg p-3 border-2 border-border/50 text-center">
                          <p className="text-xs text-muted-foreground">Add a plan to see allocation</p>
                        </div>
                      );
                    }

                    const hasW2 = !!(activePlan.wallet2 && activePlan.wallet2.trim() !== "") || !!activePlan.useUserAddress2;
                    const hasW3 = !!(activePlan.wallet3 && activePlan.wallet3.trim() !== "") || !!activePlan.useUserAddress3;
                    const isSelfCol = activePlan.category === "SELF_COLLECTION" || (!hasW2 && !hasW3);

                    // Compute effective percentages
                    let p1 = isSelfCol ? 100 : (activePlan.wallet1Percentage ?? 0);
                    let p2 = hasW2 ? (activePlan.wallet2Percentage ?? 0) : 0;
                    let p3 = hasW3 ? (activePlan.wallet3Percentage ?? 0) : 0;
                    // Safety: if all 0 and multi-wallet → show as-is (admin should fix)
                    if (!isSelfCol && p1 === 0 && p2 === 0 && p3 === 0) { p1 = 100; }

                    const cols = isSelfCol ? "grid-cols-1" : hasW3 ? "grid-cols-3" : "grid-cols-2";

                    return (
                      <div className={`grid gap-3 ${cols}`}>
                        <div className={`card-metallic rounded-lg p-3 border-2 text-center ${isSelfCol ? "border-amber-500/50" : "border-border/50"}`}>
                          <p className="text-xs text-muted-foreground mb-1">
                            {isSelfCol ? "셀프컬렉션" : "Allocation B BAG"}
                          </p>
                          <p className="text-xs text-muted-foreground mb-1">
                            {isSelfCol ? "(Single Wallet 100%)" : "(Promising Projects)"}
                          </p>
                          <p className={`text-lg font-bold ${isSelfCol ? "text-amber-500" : "text-primary"}`}>{p1}%</p>
                        </div>
                        {hasW2 && (
                          <div className="card-metallic rounded-lg p-3 border-2 border-border/50 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Allocation S BAG</p>
                            <p className="text-xs text-muted-foreground mb-1">(Binance Alpha)</p>
                            <p className="text-lg font-bold text-primary">{p2}%</p>
                          </div>
                        )}
                        {hasW3 && (
                          <div className="card-metallic rounded-lg p-3 border-2 border-border/50 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Allocation C BAG</p>
                            <p className="text-xs text-muted-foreground mb-1">(Insurance)</p>
                            <p className="text-lg font-bold text-primary">{p3}%</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Current Pick */}
              
                {/* Amount Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground">Amount (USDT)</label>
                    {isConnected && (
                      <button
                        onClick={handleMax}
                        className="text-xs text-primary hover:underline"
                        type="button"
                      >
                        Max: {balanceFormatted}
                      </button>
                    )}
                  </div>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-secondary/50 border-border focus:border-primary"
                    disabled={!isConnected || isInvesting || isApproving}
                    min="0"
                  />
                </div>

                {/* Participate Button */}
                <Button
                  variant="gold"
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleInvest}
                  disabled={
                    !isConnected ||
                    !usdtToken ||
                    isInvesting ||
                    isInvestSplitPending ||
                    isApproving ||
                    isConfirming ||
                    isInvestSplitConfirming ||
                    items.length === 0
                  }
                >
                  {isApproving || isConfirming || isInvestSplitConfirming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isApproving ? t.staking.approving : t.staking.confirming}
                    </>
                  ) : isInvesting || isInvestSplitPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.staking.investing}
                    </>
                  ) : !isConnected ? (
                    <>
                      <Wallet className="w-4 h-4" />
                      {t.header.connectWallet}
                    </>
                  ) : chainId !== bsc.id ? (
                    t.staking.switchToBSC
                  ) : !usdtToken ? (
                    t.staking.tokenNotAvailable
                  ) : items.length === 0 ? (
                    "Cart is empty"
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Participate
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Success Investment Popup */}
      <Dialog open={showSuccessPopup} onOpenChange={setShowSuccessPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Investment Successful!</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Successfully invested <span className="font-bold text-foreground">{investedAmountRef.current || amount}</span> {t.common.usdt}!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              variant="gold"
              onClick={() => {
                setShowSuccessPopup(false);
                const planId = investedPlanRef.current?.id || "";
                investedAmountRef.current = "";
                setTimeout(() => {
                  navigate(`/investment${planId ? `?planId=${planId}` : ""}`);
                }, 300);
                investedPlanRef.current = null;
              }}
              className="w-full sm:w-auto"
            >
              View Investment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cart;
