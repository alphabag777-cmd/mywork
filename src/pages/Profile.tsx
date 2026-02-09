import { useAccount } from "wagmi";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Share2, Network, TrendingUp, Wallet, User, RefreshCw, Lock, ExternalLink, Users, ArrowLeft, Edit2, Save, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { generateReferralLink, getReferrerWallet, getOrCreateReferralCode } from "@/lib/referral";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUSDTToken, useUSDTDecimals, useTokenBalance, useUserNode, useUserInvestment, useSeparateInvestment, useUserVolume } from "@/hooks/useInvestment";
import { formatUnits } from "viem";
import { getUserNodePurchases } from "@/lib/nodePurchases";
import { getUserReferralCodes, updateNodeReferralCode } from "@/lib/userReferralCodes";
import { getUserInvestmentsByCategory, UserInvestment, InvestmentCategory, extractCategoryFromName } from "@/lib/userInvestments";
import { getUserSBAGPositions, SBAGPosition } from "@/lib/sbagPositions";
import { SBAGPositionComponent } from "@/components/SBAGPosition";
import { getSBAGUSDTTransfers, getSBAGTotalInvestment } from "@/lib/sbagWalletTransfers";
import { getAllPlans, InvestmentPlan } from "@/lib/plans";
import { getUSDTTransfers, getTotalInvestment, USDTTransfer } from "@/lib/walletTransfers";

// Node type interface
interface UserNode {
  id: string;
  name: string;
  price: number;
  color: string;
  purchaseDate: string;
  status: "Active" | "Pending" | "Expired";
  transactionHash?: string;
  nodeId?: number;
}

const Profile = () => {
  const { address, isConnected } = useAccount();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [referralLink, setReferralLink] = useState<string>("");
  const [referralCode, setReferralCode] = useState<string>("");
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
  const [referrerWallet, setReferrerWallet] = useState<string | null>(null);
  const [userNodes, setUserNodes] = useState<UserNode[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  
  // User investments by category
  const [investmentsByCategory, setInvestmentsByCategory] = useState<Record<InvestmentCategory, UserInvestment[]>>({
    BBAG: [],
    SBAG: [],
    CBAG: [],
  });
  const [isLoadingInvestments, setIsLoadingInvestments] = useState(false);
  
  // SBAG positions
  const [sbagPositions, setSbagPositions] = useState<SBAGPosition[]>([]);
  const [isLoadingSBAG, setIsLoadingSBAG] = useState(false);
  
  // SBAG wallet transfers
  const [sbagWalletInvestment, setSbagWalletInvestment] = useState<number>(0);
  const [sbagWalletTransfers, setSbagWalletTransfers] = useState<UserInvestment[]>([]);
  const [isLoadingSBAGWallet, setIsLoadingSBAGWallet] = useState(false);

  // Wallet data for BBAG, SBAG, CBAG (for specific plan)
  interface WalletData {
    address: string;
    transfers: USDTTransfer[];
    totalInvestment: number;
    totalProfit: number;
    isLoading: boolean;
  }

  const [bbagWallet, setBbagWallet] = useState<WalletData>({
    address: "",
    transfers: [],
    totalInvestment: 0,
    totalProfit: 0,
    isLoading: false,
  });
  const [sbagWallet, setSbagWallet] = useState<WalletData>({
    address: "",
    transfers: [],
    totalInvestment: 0,
    totalProfit: 0,
    isLoading: false,
  });
  const [cbagWallet, setCbagWallet] = useState<WalletData>({
    address: "",
    transfers: [],
    totalInvestment: 0,
    totalProfit: 0,
    isLoading: false,
  });
  const [targetPlan, setTargetPlan] = useState<InvestmentPlan | null>(null);
  
  // Node referral codes state
  const [nodeReferralCodes, setNodeReferralCodes] = useState<{ [nodeId: string]: string }>({});
  // Editing state for referral codes
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Community groups data
  const communityGroups = [
    {
      id: "telegram-global",
      name: "Telegram Global",
      url: "https://t.me/alphabagdao",
      icon: "telegram",
    },
    {
      id: "kakaotalk",
      name: "KakaoTalk OpenChat",
      url: "https://open.kakao.com/",
      icon: "kakao",
    },
    {
      id: "telegram-korea",
      name: "Telegram Korea",
      url: "https://t.me/alphabagdao",
      icon: "telegram",
    },
  ];

  // Get token balance
  const usdtToken = useUSDTToken();
  const decimals = useUSDTDecimals(usdtToken);
  const tokenBalance = useTokenBalance(usdtToken);

  // Get user node and investment from contract
  const userNodeData = useUserNode(address);
  const { investment: userInvestment, decimals: investmentDecimals } = useUserInvestment(address);
  const { volume: userVolume, decimals: volumeDecimals } = useUserVolume(address);
  const { investments: contractInvestments, isLoading: isLoadingContractInvestments } = useSeparateInvestment(address);

  // Load user investments by category (from Firebase and Contract)
  useEffect(() => {
    if (isConnected && address) {
      const loadUserInvestments = async () => {
        setIsLoadingInvestments(true);
        try {
          const normalizedAddress = address.toLowerCase();
          
          // Get investments from Firebase
          const firebaseInvestments = await getUserInvestmentsByCategory(normalizedAddress);
          
          // Convert contract investments to UserInvestment format
          const contractInvestmentsList: UserInvestment[] = [];
          if (contractInvestments && contractInvestments.length > 0 && decimals) {
            contractInvestments.forEach((contractInv, index) => {
              const amount = parseFloat(formatUnits(contractInv.amount, decimals));
              if (amount > 0) {
                // Determine project name based on transaction hash
                const projectName = contractInv.transactionHash 
                  ? `Investment (${new Date(contractInv.timestamp || Date.now()).toLocaleDateString()})`
                  : `Investment #${contractInv.investId.toString()}`;
                
                contractInvestmentsList.push({
                  id: `contract_${contractInv.investId.toString()}_${contractInv.transactionHash || index}`,
                  userId: normalizedAddress,
                  category: "BBAG" as InvestmentCategory, // Default category, can be enhanced
                  projectId: `contract_invest_${contractInv.investId.toString()}`,
                  projectName: projectName,
                  amount: amount,
                  ownershipPercentage: 0,
                  transactionHash: contractInv.transactionHash || undefined,
                  investedAt: contractInv.timestamp || Date.now(), // Use timestamp from block if available
                  createdAt: contractInv.timestamp || Date.now(),
                  updatedAt: Date.now(),
                });
              }
            });
          }
          
          // Get SBAG wallet transfers from Moralis API
          setIsLoadingSBAGWallet(true);
          let sbagWalletInvestments: UserInvestment[] = [];
          try {
            const transfers = await getSBAGUSDTTransfers(normalizedAddress);
            const totalSBAGWallet = await getSBAGTotalInvestment(normalizedAddress);
            setSbagWalletInvestment(totalSBAGWallet);
            
            // Convert transfers to UserInvestment format
            sbagWalletInvestments = transfers.map((transfer, index) => ({
              id: `sbag_wallet_${transfer.transactionHash}_${index}`,
              userId: normalizedAddress,
              category: "SBAG" as InvestmentCategory,
              projectId: `sbag_wallet_0xFdb440cA2285Ab6d09A88B13a4b49A0323C94CE6`,
              projectName: "SBAG Wallet (0xFdb440cA2285Ab6d09A88B13a4b49A0323C94CE6)",
              amount: Number(transfer.amount),
              ownershipPercentage: 0,
              transactionHash: transfer.transactionHash,
              investedAt: transfer.timestamp,
              createdAt: transfer.timestamp,
              updatedAt: transfer.timestamp,
            }));
            setSbagWalletTransfers(sbagWalletInvestments);
          } catch (error) {
            console.error("Error loading SBAG wallet transfers:", error);
            setSbagWalletInvestment(0);
            setSbagWalletTransfers([]);
          } finally {
            setIsLoadingSBAGWallet(false);
          }
          
          // Merge Firebase and Contract investments with SBAG wallet transfers
          // Note: SBAG category only shows wallet transfers, not Firebase investments
          const merged: Record<InvestmentCategory, UserInvestment[]> = {
            BBAG: [...firebaseInvestments.BBAG, ...contractInvestmentsList.filter(inv => inv.category === "BBAG")],
            SBAG: [...contractInvestmentsList.filter(inv => inv.category === "SBAG"), ...sbagWalletInvestments], // Exclude Firebase SBAG investments
            CBAG: [...firebaseInvestments.CBAG, ...contractInvestmentsList.filter(inv => inv.category === "CBAG")],
          };
          
          // Remove duplicates based on transaction hash or investId
          const uniqueInvestments: Record<InvestmentCategory, UserInvestment[]> = {
            BBAG: [],
            SBAG: [],
            CBAG: [],
          };
          
          const seenHashes = new Set<string>();
          const seenContractIds = new Set<string>();
          
          Object.keys(merged).forEach((category) => {
            const cat = category as InvestmentCategory;
            merged[cat].forEach((inv) => {
              // Check if it's a contract investment
              if (inv.id.startsWith("contract_")) {
                const contractId = inv.projectId;
                if (!seenContractIds.has(contractId)) {
                  seenContractIds.add(contractId);
                  uniqueInvestments[cat].push(inv);
                }
              } else if (inv.transactionHash) {
                // Firebase investment with transaction hash
                if (!seenHashes.has(inv.transactionHash)) {
                  seenHashes.add(inv.transactionHash);
                  uniqueInvestments[cat].push(inv);
                }
              } else {
                // Firebase investment without hash, add it
                uniqueInvestments[cat].push(inv);
              }
            });
          });
          
          setInvestmentsByCategory(uniqueInvestments);
        } catch (error) {
          console.error("Failed to load user investments:", error);
          setInvestmentsByCategory({ BBAG: [], SBAG: [], CBAG: [] });
        } finally {
          setIsLoadingInvestments(false);
        }
      };

      loadUserInvestments();
    }
  }, [isConnected, address, contractInvestments, decimals]);

  // Load SBAG positions
  useEffect(() => {
    if (isConnected && address) {
      const loadSBAGPositions = async () => {
        setIsLoadingSBAG(true);
        try {
          const normalizedAddress = address.toLowerCase();
          const positions = await getUserSBAGPositions(normalizedAddress);
          setSbagPositions(positions);
        } catch (error) {
          console.error("Failed to load SBAG positions:", error);
          setSbagPositions([]);
        } finally {
          setIsLoadingSBAG(false);
        }
      };

      loadSBAGPositions();
    }
  }, [isConnected, address]);

  // Load the target plan "BBAG BinanceAlpha+SBAG Numi+ CBAG" and wallet transfers
  useEffect(() => {
    if (!isConnected || !address) return;

    const loadPlanAndTransfers = async () => {
      try {
        const plans = await getAllPlans();
        // Find plan "BBAG BinanceAlpha+SBAG Numi+ CBAG" or similar
        const plan = plans.find(
          (p) => {
            const nameUpper = p.name.toUpperCase();
            return (
              nameUpper.includes("BBAG") &&
              nameUpper.includes("SBAG") &&
              nameUpper.includes("CBAG") &&
              (nameUpper.includes("BINANCEALPHA") || nameUpper.includes("NUMI"))
            );
          }
        );
        
        if (!plan) {
          console.log("Target plan not found");
          return;
        }

        setTargetPlan(plan);
        
        // Determine wallet addresses
        const wallet1Address = plan.useUserAddress1 && address ? address : plan.wallet1 || "";
        const wallet2Address = plan.useUserAddress2 && address ? address : plan.wallet2 || "";
        const wallet3Address = plan.useUserAddress3 && address ? address : plan.wallet3 || "";
        
        const normalizedAddress = address.toLowerCase();

        // Load BBAG wallet transfers
        if (wallet1Address) {
          setBbagWallet((prev) => ({ ...prev, address: wallet1Address, isLoading: true }));
          try {
            const transfers = await getUSDTTransfers(normalizedAddress, wallet1Address);
            const totalInvestment = await getTotalInvestment(normalizedAddress, wallet1Address);
            
            // Calculate profit based on token conversion rate and price
            // Profit = token value (total tokens * token price)
            let totalProfit = 0;
            if (plan.wallet1TokenConversionRate && plan.wallet1TokenPrice) {
              const totalTokens = totalInvestment * plan.wallet1TokenConversionRate;
              totalProfit = totalTokens * plan.wallet1TokenPrice;
            }
            
            setBbagWallet({
              address: wallet1Address,
              transfers,
              totalInvestment,
              totalProfit,
              isLoading: false,
            });
          } catch (error) {
            console.error("Error loading BBAG wallet transfers:", error);
            setBbagWallet((prev) => ({ ...prev, isLoading: false }));
          }
        }

        // Load SBAG wallet transfers
        if (wallet2Address) {
          setSbagWallet((prev) => ({ ...prev, address: wallet2Address, isLoading: true }));
          try {
            const transfers = await getUSDTTransfers(normalizedAddress, wallet2Address);
            const totalInvestment = await getTotalInvestment(normalizedAddress, wallet2Address);
            
            // Calculate profit based on token conversion rate and price
            // Profit = token value (total tokens * token price)
            let totalProfit = 0;
            if (plan.wallet2TokenConversionRate && plan.wallet2TokenPrice) {
              const totalTokens = totalInvestment * plan.wallet2TokenConversionRate;
              totalProfit = totalTokens * plan.wallet2TokenPrice;
            }
            
            setSbagWallet({
              address: wallet2Address,
              transfers,
              totalInvestment,
              totalProfit,
              isLoading: false,
            });
          } catch (error) {
            console.error("Error loading SBAG wallet transfers:", error);
            setSbagWallet((prev) => ({ ...prev, isLoading: false }));
          }
        }

        // Load CBAG wallet transfers
        if (wallet3Address) {
          setCbagWallet((prev) => ({ ...prev, address: wallet3Address, isLoading: true }));
          try {
            const transfers = await getUSDTTransfers(normalizedAddress, wallet3Address);
            const totalInvestment = await getTotalInvestment(normalizedAddress, wallet3Address);
            
            // CBAG typically doesn't have token conversion, profit is 0 or calculated differently
            setCbagWallet({
              address: wallet3Address,
              transfers,
              totalInvestment,
              totalProfit: 0, // CBAG profit calculation may differ
              isLoading: false,
            });
          } catch (error) {
            console.error("Error loading CBAG wallet transfers:", error);
            setCbagWallet((prev) => ({ ...prev, isLoading: false }));
          }
        }
      } catch (error) {
        console.error("Failed to load target plan and transfers:", error);
      }
    };

    loadPlanAndTransfers();
  }, [isConnected, address]);

  const handleSBAGRefresh = async () => {
    if (address) {
      setIsLoadingSBAG(true);
      try {
        const normalizedAddress = address.toLowerCase();
        const positions = await getUserSBAGPositions(normalizedAddress);
        setSbagPositions(positions);
      } catch (error) {
        console.error("Failed to refresh SBAG positions:", error);
      } finally {
        setIsLoadingSBAG(false);
      }
    }
  };

  useEffect(() => {
    if (isConnected && address && address !== null && address !== "0x0000000000000000000000000000000000000000") {
      // Generate referral link with wallet address
      const link = generateReferralLink("https://alphabag.net", address);
      setReferralLink(link);
      
      // Get or create referral code
      const code = getOrCreateReferralCode(address);
      setReferralCode(code ? `AB-REF-${code}` : "AB-REF-9X27K3");
      
      // Get referrer wallet if user was referred
      const referrer = getReferrerWallet();
      setReferrerWallet(referrer);

      // Load user nodes from Firebase
      const loadUserNodes = async () => {
        setIsLoadingNodes(true);
        try {
          // Normalize address to lowercase for query
          const normalizedAddress = address.toLowerCase();
          const purchases = await getUserNodePurchases(normalizedAddress);
          
          if (purchases && purchases.length > 0) {
            const nodes: UserNode[] = purchases.map((purchase) => ({
              id: purchase.id,
              name: purchase.nodeName,
              price: purchase.nodePrice,
              color: purchase.nodeColor,
              purchaseDate: new Date(purchase.purchaseDate).toISOString(),
              status: purchase.status === "completed" ? "Active" : purchase.status === "pending" ? "Pending" : "Expired",
              transactionHash: purchase.transactionHash,
              nodeId: purchase.nodeId,
            }));
            setUserNodes(nodes);
            console.log("Loaded nodes from Firebase:", nodes.length);
            
            // Load node referral codes
            try {
              const userCodes = await getUserReferralCodes(normalizedAddress);
              if (userCodes) {
                setNodeReferralCodes(userCodes.nodeCodes);
              }
            } catch (refError) {
              console.error("Failed to load node referral codes:", refError);
            }
          } else {
            setUserNodes([]);
            console.log("No nodes found in Firebase");
          }
        } catch (error) {
          console.error("Failed to load user nodes from Firebase:", error);
          // Fallback to localStorage if Firebase fails
      const storedNodes = localStorage.getItem(`user_nodes_${address}`);
      if (storedNodes) {
        try {
          setUserNodes(JSON.parse(storedNodes));
        } catch (e) {
          console.error("Failed to parse stored nodes:", e);
              setUserNodes([]);
            }
          } else {
            setUserNodes([]);
          }
        } finally {
          setIsLoadingNodes(false);
        }
      };
      
      loadUserNodes();
    } else {
      setReferralLink("");
      setReferrerWallet(null);
      setUserNodes([]);
    }
  }, [isConnected, address]);

  const handleCopy = async (text: string, projectId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied((prev) => ({ ...prev, [projectId]: true }));
      toast.success(t.profile.copiedToClipboard);
      setTimeout(() => {
        setCopied((prev) => ({ ...prev, [projectId]: false }));
      }, 2000);
    } catch (err) {
      toast.error(t.profile.failedToCopy);
    }
  };

  const handleEditNodeCode = (nodeId: number) => {
    const nodeIdStr = nodeId.toString();
    setEditingNodeId(nodeIdStr);
    setEditingCode(nodeReferralCodes[nodeIdStr] || "");
  };

  const handleCancelEdit = () => {
    setEditingNodeId(null);
    setEditingCode("");
  };

  const handleSaveNodeCode = async (nodeId: number) => {
    if (!address || !editingCode.trim()) {
      toast.error("Please enter a valid referral code");
      return;
    }

    setIsSaving(true);
    try {
      await updateNodeReferralCode(address, nodeId, editingCode.trim());
      setNodeReferralCodes((prev) => ({
        ...prev,
        [nodeId.toString()]: editingCode.trim(),
      }));
      setEditingNodeId(null);
      setEditingCode("");
      toast.success("Referral code updated successfully");
    } catch (error) {
      console.error("Failed to update referral code:", error);
      toast.error("Failed to update referral code");
    } finally {
      setIsSaving(false);
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "gold":
        return "border-primary/50 text-primary";
      case "blue":
        return "border-blue-500/50 text-blue-400";
      case "green":
        return "border-green-500/50 text-green-400";
      case "orange":
        return "border-orange-500/50 text-orange-400";
      default:
        return "border-border text-foreground";
    }
  };

  const balanceFormatted = tokenBalance ? formatUnits(tokenBalance, decimals) : "0";

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 sm:pt-20 pb-12">
          <div className="container mx-auto px-4 text-center">
            <Card className="max-w-md mx-auto mt-12">
              <CardContent className="pt-6">
                <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-2">{t.profile.connectWallet}</h2>
                <p className="text-muted-foreground">{t.profile.connectWalletDescription}</p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 sm:pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-display font-bold text-foreground">Community</h1>
                  {/* <p className="text-muted-foreground">
                    추천코드 관리 + 단톡방 초대
                  </p> */}
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Back Home</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
          </div>

          {/* Referral Link Section */}
          <Card className="mb-8 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                My Referral Link
              </CardTitle>
              <CardDescription>
                Share your referral link to invite others
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Referral Link */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Referral Link</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-background/50 rounded-lg border border-border/50 font-mono text-sm break-all">
                      {referralLink || "Loading..."}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(referralLink, "referral-link")}
                      disabled={!referralLink}
                      className="shrink-0 h-10 w-10"
                    >
                      {copied["referral-link"] ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Referral Code */}
                {referralCode && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Referral Code</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-background/50 rounded-lg border border-border/50 font-mono text-sm">
                        {referralCode}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(referralCode, "referral-code")}
                        className="shrink-0 h-10 w-10"
                      >
                        {copied["referral-code"] ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Community Groups */}
          <Card className="mb-8 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Community Groups
                  </CardTitle>
                </div>
              </div>
              {/* <CardDescription>
                카카오톡/텔레그램 단톡방 초대 링크
              </CardDescription> */}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {communityGroups.map((group) => (
                  <div
                    key={group.id}
                    className="card-metallic rounded-xl p-3 sm:p-4 border-2 border-border/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">{group.name}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground break-all break-words">{group.url}</p>
                      </div>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        window.open(group.url, "_blank", "noopener,noreferrer");
                      }}
                      className="text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-8 shrink-0 w-full sm:w-auto"
                    >
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* My Nodes Section */}
          <Card className="mb-8 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5 text-primary" />
                {t.profile.myNodes}
              </CardTitle>
              <CardDescription>
                {t.profile.myNodesDescription}
              </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    if (address) {
                      setIsLoadingNodes(true);
                      try {
                        const normalizedAddress = address.toLowerCase();
                        const purchases = await getUserNodePurchases(normalizedAddress);
                        if (purchases && purchases.length > 0) {
                          const nodes: UserNode[] = purchases.map((purchase) => ({
                            id: purchase.id,
                            name: purchase.nodeName,
                            price: purchase.nodePrice,
                            color: purchase.nodeColor,
                            purchaseDate: new Date(purchase.purchaseDate).toISOString(),
                            status: purchase.status === "completed" ? "Active" : purchase.status === "pending" ? "Pending" : "Expired",
                            transactionHash: purchase.transactionHash,
                            nodeId: purchase.nodeId,
                          }));
                          setUserNodes(nodes);
                          toast.success(`Loaded ${nodes.length} node(s)`);
                        } else {
                          setUserNodes([]);
                          toast.info("No nodes found");
                        }
                      } catch (error) {
                        console.error("Failed to refresh nodes:", error);
                        toast.error("Failed to refresh nodes");
                      } finally {
                        setIsLoadingNodes(false);
                      }
                    }
                  }}
                  disabled={isLoadingNodes || !address}
                  className="shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                >
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoadingNodes ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingNodes ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50 animate-spin" />
                  <p className="text-muted-foreground">Loading nodes...</p>
                </div>
              ) : userNodes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userNodes.map((node) => {
                    const colors = getColorClasses(node.color);
                    return (
                      <div
                        key={node.id}
                        className={`card-metallic rounded-xl p-4 border-2 ${colors} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-display font-bold text-lg">{node.name}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              node.status === "Active"
                                ? "bg-green-500/20 text-green-400"
                                : node.status === "Pending"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {node.status}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.profile.price}</span>
                            <span className="font-semibold">
                              {node.price.toLocaleString()} {t.common.usdt}
                            </span>
                          </div>
                          {node.nodeId !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t.profile.nodeId}</span>
                              <span className="font-semibold">{node.nodeId}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Purchase Date</span>
                            <span className="font-semibold text-xs">
                              {new Date(node.purchaseDate).toLocaleDateString()}
                            </span>
                          </div>
                          {node.transactionHash && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground text-xs">Tx Hash</span>
                              <a
                                href={`https://bscscan.com/tx/${node.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-xs text-primary hover:underline truncate max-w-[120px]"
                                title={node.transactionHash}
                              >
                                {node.transactionHash.slice(0, 6)}...{node.transactionHash.slice(-4)}
                              </a>
                            </div>
                          )}
                          {node.nodeId !== undefined && nodeReferralCodes[node.nodeId.toString()] && (
                            <div className="flex justify-between items-center pt-2 border-t border-border/50">
                              <span className="text-muted-foreground text-xs">Referral Code</span>
                              <div className="flex items-center gap-2">
                                {editingNodeId === node.nodeId.toString() ? (
                                  <>
                                    <Input
                                      value={editingCode}
                                      onChange={(e) => setEditingCode(e.target.value)}
                                      className="h-6 text-xs font-mono w-24 sm:w-32"
                                      placeholder="Enter code"
                                      disabled={isSaving}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 sm:h-6 sm:w-6"
                                      onClick={() => handleSaveNodeCode(node.nodeId!)}
                                      disabled={isSaving}
                                    >
                                      {isSaving ? (
                                        <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                                      ) : (
                                        <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 sm:h-6 sm:w-6"
                                      onClick={handleCancelEdit}
                                      disabled={isSaving}
                                    >
                                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-mono text-xs text-primary">
                                      {nodeReferralCodes[node.nodeId.toString()]}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 sm:h-6 sm:w-6"
                                      onClick={() => handleEditNodeCode(node.nodeId!)}
                                    >
                                      <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 sm:h-6 sm:w-6"
                                      onClick={() => {
                                        handleCopy(nodeReferralCodes[node.nodeId!.toString()], `node-${node.nodeId}`);
                                      }}
                                    >
                                      {copied[`node-${node.nodeId}`] ? (
                                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500" />
                                      ) : (
                                        <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                    </div>
              ) : (
                <div className="text-center py-8">
                  <Network className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">{t.profile.noNodesYet || "You haven't purchased any nodes yet"}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Node Referral Codes Section */}
          {userNodes.length > 0 && Object.keys(nodeReferralCodes).length > 0 && (
            <Card className="mb-8 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  Node Referral Codes
                </CardTitle>
                <CardDescription>
                  Your referral codes for purchased nodes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userNodes
                    .filter((node) => node.nodeId !== undefined && nodeReferralCodes[node.nodeId.toString()])
                    .map((node) => (
                      <div
                        key={node.id}
                        className="card-metallic rounded-xl p-4 border-2 border-border/50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ${getColorClasses(node.color)}`}>
                            <Network className="w-5 h-5" />
                          </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground mb-1">{node.name}</h4>
                          {editingNodeId === node.nodeId!.toString() ? (
                            <Input
                              value={editingCode}
                              onChange={(e) => setEditingCode(e.target.value)}
                              className="h-7 text-sm font-mono mt-1"
                              placeholder="Enter code"
                              disabled={isSaving}
                            />
                          ) : (
                            <p className="text-sm font-mono text-muted-foreground">
                              {nodeReferralCodes[node.nodeId!.toString()]}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {editingNodeId === node.nodeId!.toString() ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveNodeCode(node.nodeId!)}
                              disabled={isSaving}
                              className="shrink-0 h-7 w-7 sm:h-8 sm:w-8"
                            >
                              {isSaving ? (
                                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              className="shrink-0 h-7 w-7 sm:h-8 sm:w-8"
                            >
                              <X className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditNodeCode(node.nodeId!)}
                              className="shrink-0 h-7 w-7 sm:h-8 sm:w-8"
                            >
                              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                handleCopy(nodeReferralCodes[node.nodeId!.toString()], `node-ref-${node.nodeId}`);
                              }}
                              className="shrink-0 h-7 w-7 sm:h-8 sm:w-8"
                            >
                              {copied[`node-ref-${node.nodeId}`] ? (
                                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Investment Section */}
          <Card className="mb-8 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    {t.profile.myTotalInvestment}
                  </CardTitle>
                  <CardDescription>
                    {t.profile.myTotalInvestmentDescription} (Contract + Firebase)
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    if (address) {
                      setIsLoadingInvestments(true);
                      try {
                        const normalizedAddress = address.toLowerCase();
                        const firebaseInvestments = await getUserInvestmentsByCategory(normalizedAddress);
                        
                        // Convert contract investments
                        const contractInvestmentsList: UserInvestment[] = [];
                        if (contractInvestments && contractInvestments.length > 0 && decimals) {
                          contractInvestments.forEach((contractInv, index) => {
                            const amount = parseFloat(formatUnits(contractInv.amount, decimals));
                            if (amount > 0) {
                              contractInvestmentsList.push({
                                id: `contract_${contractInv.investId.toString()}_${contractInv.transactionHash || index}`,
                                userId: normalizedAddress,
                                category: "BBAG" as InvestmentCategory,
                                projectId: `contract_invest_${contractInv.investId.toString()}`,
                                projectName: contractInv.transactionHash 
                                  ? `Contract Investment #${contractInv.investId.toString()}`
                                  : `Investment #${contractInv.investId.toString()}`,
                                amount: amount,
                                ownershipPercentage: 0,
                                transactionHash: contractInv.transactionHash || undefined,
                                investedAt: contractInv.timestamp || Date.now(),
                                createdAt: contractInv.timestamp || Date.now(),
                                updatedAt: Date.now(),
                              });
                            }
                          });
                        }
                        
                        const merged: Record<InvestmentCategory, UserInvestment[]> = {
                          BBAG: [...firebaseInvestments.BBAG, ...contractInvestmentsList.filter(inv => inv.category === "BBAG")],
                          SBAG: [...firebaseInvestments.SBAG, ...contractInvestmentsList.filter(inv => inv.category === "SBAG")],
                          CBAG: [...firebaseInvestments.CBAG, ...contractInvestmentsList.filter(inv => inv.category === "CBAG")],
                        };
                        
                        const uniqueInvestments: Record<InvestmentCategory, UserInvestment[]> = {
                          BBAG: [],
                          SBAG: [],
                          CBAG: [],
                        };
                        
                        const seenHashes = new Set<string>();
                        const seenContractIds = new Set<string>();
                        
                        Object.keys(merged).forEach((category) => {
                          const cat = category as InvestmentCategory;
                          merged[cat].forEach((inv) => {
                            if (inv.id.startsWith("contract_")) {
                              const contractId = inv.projectId;
                              if (!seenContractIds.has(contractId)) {
                                seenContractIds.add(contractId);
                                uniqueInvestments[cat].push(inv);
                              }
                            } else if (inv.transactionHash) {
                              if (!seenHashes.has(inv.transactionHash)) {
                                seenHashes.add(inv.transactionHash);
                                uniqueInvestments[cat].push(inv);
                              }
                            } else {
                              uniqueInvestments[cat].push(inv);
                            }
                          });
                        });
                        
                        setInvestmentsByCategory(uniqueInvestments);
                        toast.success("Investments refreshed");
                      } catch (error) {
                        console.error("Failed to refresh investments:", error);
                        toast.error("Failed to refresh investments");
                      } finally {
                        setIsLoadingInvestments(false);
                      }
                    }
                  }}
                  disabled={isLoadingInvestments || isLoadingContractInvestments || !address}
                  className="shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingInvestments || isLoadingContractInvestments ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {userVolume 
                    ? formatUnits(userVolume, volumeDecimals || 18) 
                    : userInvestment 
                      ? formatUnits(userInvestment, investmentDecimals) 
                      : "0"
                  } {t.common.usdt}
                </div>
                <p className="text-muted-foreground mb-2">{t.profile.totalInvestedAmount}</p>
                {userVolume && (
                  <p className="text-xs text-muted-foreground mb-6">
                    From contract: {formatUnits(userVolume, volumeDecimals || 18)} {t.common.usdt} (investSplit)
                  </p>
                )}

                {/* Investment Breakdown by Category (BBAG, SBAG, CBAG) - Commented out */}
              </div>
            </CardContent>
          </Card>

          {/* SBAG Positions Section */}
          {/* <Card className="mb-8 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    SBAG Positions (NUMI)
                  </CardTitle>
                  <CardDescription>
                    Your SBAG positions with real-time NUMI price tracking
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSBAGRefresh}
                  disabled={isLoadingSBAG}
                  className="shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingSBAG ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSBAG ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50 animate-spin" />
                  <p className="text-muted-foreground">Loading SBAG positions...</p>
                </div>
              ) : sbagPositions.length > 0 ? (
                <div className="space-y-4">
                  {sbagPositions.map((position) => (
                    <SBAGPositionComponent
                      key={position.id}
                      position={position}
                      onRefresh={handleSBAGRefresh}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No SBAG positions found</p>
                </div>
              )}
            </CardContent>
          </Card> */}

          {/* Wallets Section - BBAG, SBAG, CBAG */}
          {targetPlan && (
            <Card className="mb-8 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Wallets - {targetPlan.name}
                </CardTitle>
                <CardDescription>
                  Transactions and profits for BBAG, SBAG, and CBAG wallets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* BBAG Wallet */}
                  <div className="border border-border/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">BBAG Wallet</h3>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Investment</p>
                        <p className="text-lg font-bold text-foreground">
                          {bbagWallet.totalInvestment.toFixed(2)} {t.common.usdt}
                        </p>
                        {bbagWallet.totalProfit !== 0 && (
                          <>
                            <p className="text-sm text-muted-foreground mt-1">Profit</p>
                            <p className={`text-lg font-bold ${bbagWallet.totalProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                              {bbagWallet.totalProfit >= 0 ? "+" : ""}{bbagWallet.totalProfit.toFixed(2)} {t.common.usdt}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground font-mono break-all">
                        {bbagWallet.address || "No wallet address configured"}
                      </p>
                    </div>
                    {bbagWallet.isLoading ? (
                      <div className="text-center py-4">
                        <RefreshCw className="w-6 h-6 mx-auto mb-2 text-muted-foreground opacity-50 animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading transactions...</p>
                      </div>
                    ) : bbagWallet.transfers.length > 0 ? (
                      <div className="space-y-2 mt-4">
                        <h4 className="text-sm font-semibold text-foreground mb-2">Transactions:</h4>
                        {bbagWallet.transfers.map((transfer, index) => {
                          // Calculate profit for this transaction
                          const transferAmount = Number(transfer.amount);
                          let transactionProfit = 0;
                          if (targetPlan?.wallet1TokenConversionRate && targetPlan?.wallet1TokenPrice) {
                            const tokens = transferAmount * targetPlan.wallet1TokenConversionRate;
                            transactionProfit = tokens * targetPlan.wallet1TokenPrice;
                          }
                          return (
                            <div
                              key={`${transfer.transactionHash}-${index}`}
                              className="flex items-center justify-between p-2 bg-background/50 rounded border border-border/30"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {transferAmount.toFixed(2)} {t.common.usdt}
                                  </p>
                                  {transactionProfit > 0 && (
                                    <p className={`text-sm font-semibold ${transactionProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                      Profit: {transactionProfit >= 0 ? "+" : ""}{transactionProfit.toFixed(2)} {t.common.usdt}
                                    </p>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(transfer.timestamp).toLocaleString()}
                                </p>
                                <a
                                  href={`https://bscscan.com/tx/${transfer.transactionHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline mt-1 block truncate"
                                >
                                  Tx: {transfer.transactionHash.slice(0, 6)}...{transfer.transactionHash.slice(-4)}
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">No transactions found</p>
                    )}
                  </div>

                  {/* SBAG NUMI */}
                  <div className="border border-border/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">SBAG NUMI</h3>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Investment</p>
                        <p className="text-lg font-bold text-foreground">
                          {sbagWallet.totalInvestment.toFixed(2)} {t.common.usdt}
                        </p>
                        {sbagWallet.totalProfit !== 0 && (
                          <>
                            <p className="text-sm text-muted-foreground mt-1">Profit</p>
                            <p className={`text-lg font-bold ${sbagWallet.totalProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                              {sbagWallet.totalProfit >= 0 ? "+" : ""}{sbagWallet.totalProfit.toFixed(2)} {t.common.usdt}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground font-mono break-all">
                        {sbagWallet.address || "No wallet address configured"}
                      </p>
                    </div>
                    {sbagWallet.isLoading ? (
                      <div className="text-center py-4">
                        <RefreshCw className="w-6 h-6 mx-auto mb-2 text-muted-foreground opacity-50 animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading transactions...</p>
                      </div>
                    ) : sbagWallet.transfers.length > 0 ? (
                      <div className="space-y-2 mt-4">
                        <h4 className="text-sm font-semibold text-foreground mb-2">Transactions:</h4>
                        {sbagWallet.transfers.map((transfer, index) => {
                          // Calculate profit for this transaction
                          const transferAmount = Number(transfer.amount);
                          let transactionProfit = 0;
                          if (targetPlan?.wallet2TokenConversionRate && targetPlan?.wallet2TokenPrice) {
                            const tokens = transferAmount * targetPlan.wallet2TokenConversionRate;
                            transactionProfit = tokens * targetPlan.wallet2TokenPrice;
                          }
                          return (
                            <div
                              key={`${transfer.transactionHash}-${index}`}
                              className="flex items-center justify-between p-2 bg-background/50 rounded border border-border/30"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {transferAmount.toFixed(2)} {t.common.usdt}
                                  </p>
                                  {transactionProfit > 0 && (
                                    <p className={`text-sm font-semibold ${transactionProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                      Profit: {transactionProfit >= 0 ? "+" : ""}{transactionProfit.toFixed(2)} {t.common.usdt}
                                    </p>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(transfer.timestamp).toLocaleString()}
                                </p>
                                <a
                                  href={`https://bscscan.com/tx/${transfer.transactionHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline mt-1 block truncate"
                                >
                                  Tx: {transfer.transactionHash.slice(0, 6)}...{transfer.transactionHash.slice(-4)}
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">No transactions found</p>
                    )}
                  </div>

                  {/* CBAG Wallet */}
                  <div className="border border-border/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">CBAG Wallet</h3>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Investment</p>
                        <p className="text-lg font-bold text-foreground">
                          {cbagWallet.totalInvestment.toFixed(2)} {t.common.usdt}
                        </p>
                        {cbagWallet.totalProfit !== 0 && (
                          <>
                            <p className="text-sm text-muted-foreground mt-1">Profit</p>
                            <p className={`text-lg font-bold ${cbagWallet.totalProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                              {cbagWallet.totalProfit >= 0 ? "+" : ""}{cbagWallet.totalProfit.toFixed(2)} {t.common.usdt}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground font-mono break-all">
                        {cbagWallet.address || "No wallet address configured"}
                      </p>
                    </div>
                    {cbagWallet.isLoading ? (
                      <div className="text-center py-4">
                        <RefreshCw className="w-6 h-6 mx-auto mb-2 text-muted-foreground opacity-50 animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading transactions...</p>
                      </div>
                    ) : cbagWallet.transfers.length > 0 ? (
                      <div className="space-y-2 mt-4">
                        <h4 className="text-sm font-semibold text-foreground mb-2">Transactions:</h4>
                        {cbagWallet.transfers.map((transfer, index) => {
                          // CBAG typically doesn't have token conversion, so no profit calculation
                          const transferAmount = Number(transfer.amount);
                          return (
                            <div
                              key={`${transfer.transactionHash}-${index}`}
                              className="flex items-center justify-between p-2 bg-background/50 rounded border border-border/30"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                  {transferAmount.toFixed(2)} {t.common.usdt}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(transfer.timestamp).toLocaleString()}
                                </p>
                                <a
                                  href={`https://bscscan.com/tx/${transfer.transactionHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline mt-1 block truncate"
                                >
                                  Tx: {transfer.transactionHash.slice(0, 6)}...{transfer.transactionHash.slice(-4)}
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">No transactions found</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wallet Balance Section */}
          <Card className="mb-8 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                {t.profile.walletBalance}
              </CardTitle>
              <CardDescription>
                {t.profile.walletBalanceDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {balanceFormatted} {t.common.usdt}
                </div>
                <p className="text-muted-foreground">{t.profile.availableForInvestment}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;

