import { Sparkles, Shield, ExternalLink, Eye, Plus, CheckCircle2, Wallet, Loader2, Zap } from "lucide-react";
import { useState, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { bsc } from "wagmi/chains";
import { parseUnits, formatUnits, isAddress } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useNavigate, Link } from "react-router-dom";
import { getOrCreateReferralCode, wasReferred, storeReferralFromURL } from "@/lib/referral";
import { trackReferralActivity } from "@/lib/referralActivities";
import { useTranslate } from "@/hooks/useTranslate";
import { isLoomxReferralRegistered, isNewWallet } from "@/lib/referralValidation";
import {
  useUSDTToken,
  useUSDTDecimals,
  useTokenBalance,
  useTokenAllowance,
  useApproveToken,
  useInvest,
} from "@/hooks/useInvestment";
import { NEW_INVESTMENT_CONTRACT_ADDRESS } from "@/lib/contract";
import { useRef, useEffect } from "react";
import ProjectDetails from "@/components/ProjectDetails";
import { getAllPlans, InvestmentPlan } from "@/lib/plans";
import { getFixedAd, getRotatingAds, AdImage } from "@/lib/ads";
import { getActiveNotice, Notice } from "@/lib/notices";
import { useCart } from "@/contexts/CartContext";

const StakingSection = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const navigate = useNavigate();
  const [amount, setAmount] = useState<string>("");
  const [allocationCards, setAllocationCards] = useState<InvestmentPlan[]>([]);
  const [fixedAd, setFixedAd] = useState<AdImage | null>(null);
  const [rotatingAds, setRotatingAds] = useState<AdImage[]>([]);
  const [translatedFixedAd, setTranslatedFixedAd] = useState<AdImage | null>(null);
  const [translatedRotatingAds, setTranslatedRotatingAds] = useState<AdImage[]>([]);
  const [currentRotatingIndex, setCurrentRotatingIndex] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [translatedNotice, setTranslatedNotice] = useState<Notice | null>(null);
  const [selectedProject, setSelectedProject] = useState<InvestmentPlan | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [projectToAdd, setProjectToAdd] = useState<InvestmentPlan | null>(null);
  const [referralCodeInput, setReferralCodeInput] = useState<string>("");
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [referralRequiredDialogOpen, setReferralRequiredDialogOpen] = useState(false);
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { translate } = useTranslate();
  
  // State for translated plans
  const [translatedPlans, setTranslatedPlans] = useState<InvestmentPlan[]>([]);

  // Note: Referral validation pop-up is handled by LoomxReferralGuard component
  // This prevents duplicate pop-ups and ensures consistent behavior

  // Load plans from Firebase
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plans = await getAllPlans();
        setAllocationCards(plans);
        
        // Translate plans if needed
        const translated = await Promise.all(
          plans.map(async (plan) => ({
            ...plan,
            name: await translate(plan.name),
            label: await translate(plan.label),
            description: await translate(plan.description),
            focus: await translate(plan.focus),
            quickActionsDescription: await translate(plan.quickActionsDescription || ''),
            tags: await Promise.all((plan.tags || []).map(tag => translate(tag))),
          }))
        );
        setTranslatedPlans(translated);
      } catch (error) {
        console.error("Error loading plans:", error);
        toast.error("Failed to load investment plans");
      }
    };
    
    loadPlans();
  }, [translate]);

  // Load notice from Firebase
  useEffect(() => {
    const loadNotice = async () => {
      try {
        const activeNotice = await getActiveNotice();
        setNotice(activeNotice);
        
        // Translate notice points if needed
        if (activeNotice) {
          const translatedPoints = await Promise.all(
            activeNotice.points.map(point => translate(point))
          );
          setTranslatedNotice({
            ...activeNotice,
            points: translatedPoints,
          });
        }
      } catch (error) {
        console.error("Error loading notice:", error);
      }
    };
    
    loadNotice();
  }, [translate]);

  // Load ad images from Firebase
  useEffect(() => {
    const loadAds = async () => {
      try {
        const fixed = await getFixedAd();
        const rotating = await getRotatingAds();
        setFixedAd(fixed);
        setRotatingAds(rotating);
        
        // Translate ads if needed
        if (fixed) {
          setTranslatedFixedAd({
            ...fixed,
            alt: await translate(fixed.alt),
          });
        }
        
        const translatedRotating = await Promise.all(
          rotating.map(async (ad) => ({
            ...ad,
            alt: await translate(ad.alt),
          }))
        );
        setTranslatedRotatingAds(translatedRotating);
      } catch (error) {
        console.error("Error loading ads:", error);
      }
    };
    
    loadAds();
  }, [translate]);

  // Rotate through rotating ads every 5 seconds
  useEffect(() => {
    if (rotatingAds.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentRotatingIndex((prev) => (prev + 1) % rotatingAds.length);
    }, 5000); // Change ad every 5 seconds

    return () => clearInterval(interval);
  }, [rotatingAds.length]);
  
  const usdtToken = useUSDTToken();
  const decimals = useUSDTDecimals(usdtToken);
  const tokenBalance = useTokenBalance(usdtToken);
  const allowance = useTokenAllowance(usdtToken, NEW_INVESTMENT_CONTRACT_ADDRESS);
  const { approve, isPending: isApproving, isSuccess: isApproved } = useApproveToken();
  const { invest, isPending: isInvesting, isConfirming, isSuccess: isInvestSuccess, error } = useInvest();

  const balanceFormatted = tokenBalance ? formatUnits(tokenBalance, decimals) : "0";
  const investAmountWei = amount && !isNaN(parseFloat(amount)) ? parseUnits(amount, decimals) : 0n;
  const needsApproval = allowance ? investAmountWei > allowance : true;
  const pendingInvestRef = useRef<bigint | null>(null);

  useEffect(() => {
    if (isInvestSuccess) {
      toast.success(`${t.staking.successfullyInvested} ${amount} ${t.common.usdt}!`);
      setAmount("");
      pendingInvestRef.current = null;
      // Redirect to investment page after successful investment
      setTimeout(() => {
        navigate("/investment");
      }, 1500);
    }
    if (error) {
      toast.error(`${t.staking.investmentFailed}: ${error.message}`);
    }
  }, [isInvestSuccess, error, amount, t, navigate]);

  useEffect(() => {
    if (isApproved && pendingInvestRef.current) {
      invest(pendingInvestRef.current);
      pendingInvestRef.current = null;
    }
  }, [isApproved, invest]);

  const handleInvest = useCallback(async () => {
    if (!isConnected) {
      toast.error(t.staking.pleaseConnectWallet);
      return;
    }

    if (!address) {
      toast.error("Wallet address not available");
      return;
    }

    // MANDATORY REFERRAL VALIDATION: Only check for NEW wallets (those without investments)
    try {
      // Check if wallet is new (has no investments in database)
      const isNew = await isNewWallet(address);
      
      // Only require referral registration for NEW wallets
      if (isNew && !isLoomxReferralRegistered()) {
        toast.error("Referral registration required. Please register your Loomx referral code before investing.");
        setReferralRequiredDialogOpen(true);
        return;
      }
    } catch (error) {
      console.error("Error checking new wallet status:", error);
      // On error, treat as new to be safe (require referral registration)
      if (!isLoomxReferralRegistered()) {
        toast.error("Referral registration required. Please register your Loomx referral code before investing.");
        setReferralRequiredDialogOpen(true);
        return;
      }
    }

    const investAmount = parseFloat(amount);
    if (!amount || isNaN(investAmount) || investAmount <= 0) {
      toast.error(t.staking.enterValidAmount);
      return;
    }
    
    // Minimum investment validation: $250
    if (investAmount < 0) {
      toast.error(t.projects.minInvestment);
      return;
    }
    if (tokenBalance && investAmountWei > tokenBalance) {
      toast.error(t.staking.insufficientBalance);
      return;
    }
    if (!usdtToken) {
      toast.error(t.staking.tokenNotAvailable);
      return;
    }
    if (!isAddress(usdtToken)) {
      toast.error(t.staking.tokenNotAvailable);
      return;
    }
    
    // Check if approval is needed
    if (needsApproval && usdtToken) {
      pendingInvestRef.current = investAmountWei;
      approve(usdtToken, investAmountWei, NEW_INVESTMENT_CONTRACT_ADDRESS);
      return;
    }

    // Proceed with investment
    invest(investAmountWei);
  }, [isConnected, amount, tokenBalance, usdtToken, needsApproval, invest, approve, investAmountWei, t]);

  const handleMax = () => {
    if (tokenBalance) {
      setAmount(balanceFormatted);
    }
  };

  const handleAddToCart = (card: InvestmentPlan) => {
    if (!isConnected || !address) {
      toast.error(t.staking.pleaseConnectWallet);
      return;
    }

    // Check if user was referred (has a referrer code)
    const hasReferrer = wasReferred();
    
    if (!hasReferrer) {
      // No referrer code registered, show dialog to enter one
      setProjectToAdd(card);
      setReferralDialogOpen(true);
    } else {
      // Referrer code exists, add to cart
      addToCart(card);
      
      // Track referral activity
      if (address) {
        trackReferralActivity(address, {
          activityType: "plan_added_to_cart",
          planId: card.id,
          planName: card.name,
        }).catch((error) => {
          console.error("Failed to track referral activity:", error);
        });
      }
      
      setSuccessMessage(`${card.label} added to cart!`);
      setSuccessDialogOpen(true);
    }
  };

  const addToInvestmentList = (card: InvestmentPlan) => {
    // Get existing investment list from localStorage
    const investmentListKey = `investment_list_${address}`;
    const existingList = localStorage.getItem(investmentListKey);
    let investmentList: Array<typeof allocationCards[0]> = [];
    
    if (existingList) {
      try {
        investmentList = JSON.parse(existingList);
      } catch (e) {
        console.error("Failed to parse investment list:", e);
      }
    }

    // Check if project is already in the list
    const isAlreadyAdded = investmentList.some(item => item.id === card.id);
    
    if (!isAlreadyAdded) {
      investmentList.push(card);
      localStorage.setItem(investmentListKey, JSON.stringify(investmentList));
      toast.success(t.staking.projectAddedToList);
    } else {
      toast.info(t.staking.projectAddedToListDesc);
    }
  };

  const handleRegisterReferralCode = () => {
    if (!referralCodeInput || referralCodeInput.trim() === "") {
      toast.error("Please enter a referral code");
      return;
    }

    // Store the referrer code
    if (address && typeof window !== "undefined") {
      const REFERRER_KEY = "alphabag_referrer_code";
      const existingRef = localStorage.getItem(REFERRER_KEY);
      
      // Only store if not already stored
      if (!existingRef) {
        localStorage.setItem(REFERRER_KEY, referralCodeInput.trim());
        
        // Add project to cart
        if (projectToAdd && address) {
          addToCart(projectToAdd);
          
          // Track referral activity
          trackReferralActivity(address, {
            activityType: "plan_added_to_cart",
            planId: projectToAdd.id,
            planName: projectToAdd.name,
          }).catch((error) => {
            console.error("Failed to track referral activity:", error);
          });
          
          setSuccessMessage(`${projectToAdd.label} added to cart!`);
          setSuccessDialogOpen(true);
        }
        setReferralDialogOpen(false);
        setReferralCodeInput("");
        setProjectToAdd(null);
      } else {
        // Already has a referrer, just add to list
        if (projectToAdd) {
          addToInvestmentList(projectToAdd);
        }
        setReferralDialogOpen(false);
        setReferralCodeInput("");
        setProjectToAdd(null);
      }
    }
  };

  return (
    <section id="staking" className="py-12 md:py-20 relative min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Ad Placements + Notice in One Row */}
      {((translatedFixedAd || fixedAd) || (translatedRotatingAds.length > 0 ? translatedRotatingAds : rotatingAds).length > 0 || (translatedNotice || notice)) && (
        <div className="container mx-auto px-2 md:px-4 mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-4">
            {/* Fixed Ad Placement */}
            {(translatedFixedAd || fixedAd) && (
              <a
                href={(translatedFixedAd || fixedAd)!.linkUrl || "#"}
                onClick={(e) => {
                  if (!(translatedFixedAd || fixedAd)!.linkUrl || (translatedFixedAd || fixedAd)!.linkUrl === "#") {
                    e.preventDefault();
                  }
                }}
                className="flex-1 min-w-0"
              >
                <img
                  src={(translatedFixedAd || fixedAd)!.imageUrl}
                  alt={(translatedFixedAd || fixedAd)!.alt}
                  className="w-full h-20 md:h-24 rounded-xl border border-border/60 object-cover bg-secondary/40 hover:opacity-90 transition-opacity"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              </a>
            )}

            {/* Rotating Ad Placement */}
            {(translatedRotatingAds.length > 0 ? translatedRotatingAds : rotatingAds).length > 0 && (
              <div className="flex-1 min-w-0 relative">
                {(translatedRotatingAds.length > 0 ? translatedRotatingAds : rotatingAds).map((ad, index) => (
                  <a
                    key={ad.id}
                    href={ad.linkUrl || "#"}
                    onClick={(e) => {
                      if (!ad.linkUrl || ad.linkUrl === "#") {
                        e.preventDefault();
                      }
                    }}
                    className={`block w-full transition-opacity duration-500 ${
                      index === currentRotatingIndex ? "opacity-100" : "opacity-0 absolute inset-0"
                    }`}
                  >
                    <img
                      src={ad.imageUrl}
                      alt={ad.alt}
                      className="w-full h-20 md:h-24 rounded-xl border border-border/60 object-cover bg-secondary/40 hover:opacity-90 transition-opacity"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </a>
                ))}
                {/* Rotation indicator dots */}
                {(translatedRotatingAds.length > 0 ? translatedRotatingAds : rotatingAds).length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {(translatedRotatingAds.length > 0 ? translatedRotatingAds : rotatingAds).map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentRotatingIndex
                            ? "bg-primary w-6"
                            : "bg-primary/30"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notice Section */}
            {(translatedNotice || notice) && (
              <div className="flex-1 min-w-0 bg-card/50 backdrop-blur-sm border border-border/60 rounded-xl p-3 md:p-6">
                <div className="flex items-center justify-between mb-2 md:mb-3 gap-2">
                  <h3 className="text-sm md:text-lg font-semibold text-foreground whitespace-nowrap">
                    Notice
                  </h3>
                  <Button variant="outline" size="sm" className="h-6 md:h-7 text-[10px] md:text-xs px-2 md:px-3 shrink-0">
                    NOTICE
                  </Button>
                </div>
                <ul className="space-y-1.5 md:space-y-2">
                  {(translatedNotice || notice)!.points.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground break-words">
                      <span className="text-primary mt-0.5 md:mt-1 shrink-0">•</span>
                      <span className="flex-1 min-w-0">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-secondary/50 border border-border rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">{t.staking.investmentPlatform}</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-foreground">{t.staking.title}</span>
            <span className="text-gradient-gold">{t.staking.titleHighlight}</span>
            <span className="text-foreground"> Treasury Management Protocol</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-6">
            {t.staking.description}
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            {t.staking.investmentStrategy}
          </p>
        </div>

        {/* Ads images above buttons */}
      

        {/* CTA buttons row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Button variant="outline" className="min-w-[180px]" asChild>
            <Link to="/introduction">AlphaBag Introduction</Link>
          </Button>
          <Button variant="outline" className="min-w-[180px]" asChild>
            <Link to="/tutorial">Usage Overview</Link>
          </Button>
          <Button variant="gold-outline" className="min-w-[180px]" asChild>
            <Link to="/profile">Register Referrer</Link>
          </Button>
        </div>

        {/* Allocation Cards Grid */}
        {allocationCards.length === 0 ? (
          <div className="text-center py-12 mb-8">
            <p className="text-muted-foreground text-lg">
              No investment plans available. Please check back later.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {(translatedPlans.length > 0 ? translatedPlans : allocationCards).map((card, index) => {
            return (
              <div 
                key={card.id}
                className="card-metallic rounded-2xl p-4 sm:p-6 transition-all duration-500 hover:border-primary/50 animate-fade-in flex flex-col"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Logo */}
                <div className="flex justify-center mb-3 sm:mb-4">
                  <img 
                    src={card.logo} 
                    alt={card.label} 
                    className="w-24 h-24 sm:w-32 sm:h-32 object-contain opacity-90"
                  />
                </div>

                {/* Top Section: BINANCE Alpha + Badge and DAILY PROFIT Button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                  <div className="bg-secondary/50 border border-border rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">{t.staking.binanceAlpha}</span>
                    <span className="mx-1">•</span>
                    <span className="hidden sm:inline">{t.staking.insuranceHedge} • {t.staking.chooseLikeCart}</span>
                    <span className="sm:hidden">{t.staking.insuranceHedge}</span>
                  </div>
                  <div className="bg-primary/20 border border-primary/50 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-1.5">
                    <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-primary"></div>
                    <span className="text-[10px] sm:text-xs font-semibold text-primary uppercase">{card.status || "Daily profit"}</span>
                  </div>
                </div>

                {/* Product Title with Allocation Breakdown */}
                <div className="mb-3">
                  <h3 className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-2 break-words">
                    {card.name}
                  </h3>
                  {/* Allocation Breakdown - 40% 40% 20% */}
                  <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-red-500/10 border-2 border-red-500/30 rounded-full">
                    <span className="text-sm sm:text-base lg:text-lg font-bold text-red-500">40%</span>
                    <span className="text-sm sm:text-base lg:text-lg font-bold text-red-500">40%</span>
                    <span className="text-sm sm:text-base lg:text-lg font-bold text-red-500">20%</span>
                  </div>
                </div>

                {/* Daily Profit */}
                <div className="mb-2">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">{t.staking.dailyProfit}: </span>
                  <span className="text-sm sm:text-base md:text-lg font-bold text-foreground">{card.dailyProfit}</span>
                </div>

                {/* Focus/Category */}
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{card.focus}</p>

                {/* Description */}
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed line-clamp-3 sm:line-clamp-none">
                  {card.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  {card.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 sm:px-3 py-0.5 sm:py-1 bg-secondary/50 border border-border rounded-full text-[10px] sm:text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Recommendation */}
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  <span className="font-semibold">{t.staking.recommended} </span>
                  <span>{card.recommendedAmount || "1,000"} {t.common.usdt}</span>
                </p>

                {/* Action Button: Details */}
                <div className="mb-3">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      setSelectedProject(card);
                      setDetailsOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    {t.staking.details}
                  </Button>
                </div>

                {/* Go to Website Button */}
                <Button
                  variant="gold-outline"
                  className="w-full gap-2 mb-3"
                  onClick={() => {
                    if (card.dappUrl) {
                      window.open(card.dappUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                  {t.staking.goToWebsite}
                </Button>

                {/* Add to Cart Button */}
                <Button
                  variant="gold"
                  className="w-full gap-2"
                  onClick={() => handleAddToCart(card)}
                >
                  <Plus className="w-4 h-4" />
                  Add to Cart
                </Button>
              </div>
            );
          })}
        </div>
        )}

      </div>
      
      {/* Project Details Dialog */}
      {selectedProject && (
        <ProjectDetails
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          project={selectedProject}
        />
      )}

      {/* Referral Code Dialog */}
      <Dialog open={referralDialogOpen} onOpenChange={setReferralDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.staking.referralCodeRequired}</DialogTitle>
            <DialogDescription>
              {t.staking.referralCodeRequiredDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t.staking.registerReferralCode}
              </label>
              <Input
                type="text"
                placeholder="Enter referral code"
                value={referralCodeInput}
                onChange={(e) => setReferralCodeInput(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              variant="gold"
              className="w-full"
              onClick={handleRegisterReferralCode}
            >
              {t.staking.registerReferralCode}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <DialogTitle className="text-center text-xl">Success!</DialogTitle>
            </div>
            <DialogDescription className="text-center pt-2 text-base">
              {successMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              variant="gold"
              className="w-full sm:flex-1"
              onClick={() => {
                setSuccessDialogOpen(false);
                navigate("/cart");
              }}
            >
              Go to Cart
            </Button>
            <Button
              variant="outline"
              className="w-full sm:flex-1"
              onClick={() => setSuccessDialogOpen(false)}
            >
              Continue Shopping
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mandatory Referral Registration Dialog */}
      <Dialog open={referralRequiredDialogOpen} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden" 
          onPointerDownOutside={(e) => e.preventDefault()} 
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <Shield className="w-12 h-12 text-red-500" />
              </div>
              <DialogTitle className="text-center text-2xl md:text-3xl font-bold text-red-500">
                Referral Registration Required
              </DialogTitle>
            </div>
            <DialogDescription className="text-center text-base md:text-lg pt-2 space-y-4">
              <p className="font-semibold text-foreground">
                You must register your Loomx referral code before making any investments.
              </p>
              <p className="text-muted-foreground">
                This is mandatory to ensure proper tracking of the referral hierarchy and sales attribution.
              </p>
              <p className="text-muted-foreground">
                Please visit the referral registration page to complete your registration before proceeding with any investment transactions.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3 pt-6">
            <Button
              variant="gold"
              className="w-full sm:w-auto min-w-[200px] text-base py-6"
              onClick={() => {
                setReferralRequiredDialogOpen(false);
                navigate("/community");
              }}
            >
              Go to Community
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default StakingSection;
