import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Network, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { bsc } from "wagmi/chains";
import {
  useUSDTToken,
  useUSDTDecimals,
  useTokenBalance,
  useApproveToken,
  useBuyNode,
} from "@/hooks/useInvestment";
import { NEW_INVESTMENT_CONTRACT_ADDRESS } from "@/lib/contract";
import { isAddress } from "viem";
import { formatUnits, parseUnits } from "viem";
import { toast } from "sonner";
import { getAllNodes, NodeType } from "@/lib/nodes";
import { saveNodePurchase } from "@/lib/nodePurchases";
import { ERC20_ABI } from "@/lib/contract";
import { getOrCreateNodeReferralCode } from "@/lib/userReferralCodes";
import { useTranslate } from "@/hooks/useTranslate";
import { trackReferralActivity } from "@/lib/referralActivities";

const NodeSection = () => {
  const { t } = useLanguage();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const usdtToken = useUSDTToken();
  const decimals = useUSDTDecimals(usdtToken);
  const tokenBalance = useTokenBalance(usdtToken);
  const { approve, isPending: isApproving, isSuccess: isApproved } = useApproveToken();
  
  // Check allowance for new investment contract
  const { data: nodeWalletAllowance } = useReadContract({
    address: usdtToken,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && usdtToken ? [address, "0xAA01B013E7dB427dF2d00AEAa49a9F7417e3BA97"] : undefined,
    query: {
      enabled: !!usdtToken && !!address,
    },
  });
  const { buyNode, isPending: isBuying, isConfirming, isSuccess: isBuySuccess, error, hash } = useBuyNode();
  const [purchasedNode, setPurchasedNode] = useState<NodeType | null>(null);
  const [nodeTypes, setNodeTypes] = useState<NodeType[]>([]);
  const [translatedNodes, setTranslatedNodes] = useState<NodeType[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
  const pendingNodeRef = useRef<{ nodeId: number; priceWei: bigint; node: NodeType } | null>(null);
  const { translate } = useTranslate();

  // Load nodes from Firebase
  useEffect(() => {
    const loadNodes = async () => {
      setIsLoadingNodes(true);
      try {
        const nodes = await getAllNodes();
        setNodeTypes(nodes);
        
        // Translate only description — name is always shown in original (no translation)
        const translated = await Promise.all(
          nodes.map(async (node) => ({
            ...node,
            // name intentionally NOT translated — keep original text always
            description: await translate(node.description || ''),
          }))
        );
        setTranslatedNodes(translated);
      } catch (error) {
        console.error("Error loading nodes:", error);
        toast.error("Failed to load nodes");
      } finally {
        setIsLoadingNodes(false);
      }
    };
    
    loadNodes();
  }, [translate]);

  const balanceFormatted = tokenBalance ? formatUnits(tokenBalance, decimals) : "0";

  useEffect(() => {
    if (isApproved && pendingNodeRef.current) {
      const { nodeId, priceWei, node } = pendingNodeRef.current;
      // Get wallet address from node data, fallback to zero address if not set
      const payWallet = (node.walletAddress && isAddress(node.walletAddress)) 
        ? node.walletAddress as `0x${string}` 
        : "0x0000000000000000000000000000000000000000" as `0x${string}`;
      buyNode(nodeId, priceWei, payWallet);
    }
  }, [isApproved, buyNode]);

  const handleBuyNode = (node: NodeType) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (chainId !== bsc.id) {
      toast.error("Please switch to BSC Mainnet");
      return;
    }

    if (!usdtToken) {
      toast.error("Token not available");
      return;
    }

    // Convert price to wei
    const priceWei = parseUnits(node.price.toString(), decimals);

    // Check balance
    if (tokenBalance && priceWei > tokenBalance) {
      setShowInsufficientBalance(true);
      return;
    }

    // Get wallet address from node data, fallback to zero address if not set
    const payWallet = (node.walletAddress && isAddress(node.walletAddress)) 
      ? node.walletAddress as `0x${string}` 
      : "0x0000000000000000000000000000000000000000" as `0x${string}`;

    // Check if approval is needed (approve for the new investment contract)
    const needsApproval = nodeWalletAllowance ? priceWei > nodeWalletAllowance : true;

    if (needsApproval && usdtToken) {
      pendingNodeRef.current = { nodeId: node.nodeId, priceWei, node };
      setPurchasedNode(node);
      // Approve for the new investment contract
      approve(usdtToken, priceWei, NEW_INVESTMENT_CONTRACT_ADDRESS);
      return;
    }

    // Proceed with node purchase using new contract
    setPurchasedNode(node);
    buyNode(node.nodeId, priceWei, payWallet);
  };

  // Handle success/error
  useEffect(() => {
    if (isBuySuccess && address && purchasedNode && hash) {
      toast.success(`${purchasedNode.name} purchased successfully!`);
      
      // Save to Firebase and generate referral code
      const savePurchase = async () => {
        try {
          await saveNodePurchase({
            userId: address.toLowerCase(),
            nodeId: purchasedNode.nodeId,
            nodeName: purchasedNode.name,
            nodePrice: purchasedNode.price,
            nodeColor: purchasedNode.color,
            transactionHash: hash,
            purchaseDate: Date.now(),
            status: "completed",
          });
          
          // Generate referral code for this node
          try {
            await getOrCreateNodeReferralCode(
              address.toLowerCase(),
              purchasedNode.nodeId,
              purchasedNode.name
            );
          } catch (refError) {
            console.error("Failed to generate node referral code:", refError);
            // Don't show error to user, referral code generation is not critical
          }
          
          // Track referral activity
          if (address) {
            trackReferralActivity(address, {
              activityType: "node_purchased",
              nodeId: purchasedNode.nodeId,
              nodeName: purchasedNode.name,
              nodePrice: purchasedNode.price,
              transactionHash: hash,
            }).catch((error) => {
              console.error("Failed to track referral activity:", error);
            });
          }
        } catch (error) {
          console.error("Failed to save node purchase to Firebase:", error);
          toast.error("Purchase completed but failed to save record. Please contact support.");
        }
      };
      
      savePurchase();
      
      setPurchasedNode(null);
      pendingNodeRef.current = null;
    }
    if (error) {
      toast.error(`Node purchase failed: ${error.message}`);
      setPurchasedNode(null);
      pendingNodeRef.current = null;
    }
  }, [isBuySuccess, error, address, purchasedNode, hash]);

  const getColorClasses = (color: string) => {
    switch (color) {
      case "gold":
        return {
          border: "border-primary/50 shadow-[0_0_20px_hsl(45_93%_56%/0.3)]",
          text: "text-primary",
          button: "bg-gold-gradient text-primary-foreground hover:shadow-[0_0_30px_hsl(45_93%_56%/0.5)]",
          icon: "text-primary drop-shadow-[0_0_10px_hsl(45_93%_56%/0.8)]",
        };
      case "blue":
        return {
          border: "border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]",
          text: "text-blue-400",
          button: "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]",
          icon: "text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]",
        };
      case "green":
        return {
          border: "border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]",
          text: "text-green-400",
          button: "bg-green-500 text-white hover:bg-green-600 hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]",
          icon: "text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]",
        };
      case "orange":
        return {
          border: "border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.3)]",
          text: "text-orange-400",
          button: "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]",
          icon: "text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]",
        };
      default:
        return {
          border: "border-border",
          text: "text-foreground",
          button: "bg-secondary text-foreground",
          icon: "text-muted-foreground",
        };
    }
  };

  return (
    <section id="nodes" className="py-12 md:py-20 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-secondary/50 border border-border rounded-full px-4 py-2 mb-6">
            <Network className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Node Network</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-foreground">Purchase</span>
            <span className="text-gradient-gold"> Nodes</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-8">
            Join our network by purchasing nodes and unlock exclusive benefits and rewards.
          </p>
        </div>

        {/* Node Cards Grid */}
        {isLoadingNodes ? (
          <div className="text-center py-12">
            <Network className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50 animate-pulse" />
            <p className="text-muted-foreground">Loading nodes...</p>
          </div>
        ) : (translatedNodes.length > 0 ? translatedNodes : nodeTypes).length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
              {(translatedNodes.length > 0 ? translatedNodes : nodeTypes).map((node) => {
                const colors = getColorClasses(node.color);
                return (
                  <div
                    key={node.id}
                    className={`card-metallic rounded-xl p-4 sm:p-5 border-2 ${colors.border} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl flex flex-col items-center text-center relative overflow-hidden`}
                  >
                    {/* Node Icon */}
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 flex items-center justify-center ${colors.icon} relative z-10`}>
                      {node.icon ? (
                        <img src={node.icon} alt={node.name} className="w-full h-full object-contain" />
                      ) : (
                        <Network className="w-10 h-10 sm:w-14 sm:h-14" strokeWidth={1.5} />
                      )}
                    </div>

                    {/* Node Name */}
                    <h3 className="text-base sm:text-lg font-display font-bold text-foreground mb-2 sm:mb-3 relative z-10 break-words px-2">{node.name}</h3>

                    {/* Description */}
                    {node.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 px-2 line-clamp-2 relative z-10">
                        {node.description}
                      </p>
                    )}

                    {/* Tags */}
                    {node.tags && node.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center mb-2 sm:mb-3 px-2 relative z-10">
                        {node.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-full text-xs bg-secondary/50 text-secondary-foreground border border-border/50"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price */}
                    <div className={`text-2xl sm:text-3xl font-display font-bold ${colors.text} mb-4 sm:mb-5 relative z-10`}>
                      {node.price.toLocaleString()} USDT
                    </div>

                    {/* Buy Button */}
                    <Button
                      className={`w-full ${colors.button} transition-all duration-300 relative z-10`}
                      onClick={() => handleBuyNode(node)}
                      disabled={!isConnected || isBuying || isConfirming || isApproving || chainId !== bsc.id}
                    >
                      {isApproving ? "Approving..." : isBuying || isConfirming ? "Processing..." : "Buy Now"}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Balance Display */}
            {isConnected && (
              <div className="mb-4 sm:mb-6 pt-4 border-t border-border">
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground text-center">
                  Your Balance: <span className="font-bold text-foreground">{balanceFormatted} USDT</span>
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Network className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No nodes available at the moment</p>
          </div>
        )}
      </div>

      {/* Insufficient Balance Dialog */}
      <Dialog open={showInsufficientBalance} onOpenChange={setShowInsufficientBalance}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <DialogTitle className="text-2xl text-center">Insufficient Balance</DialogTitle>
            <DialogDescription className="text-center text-base pt-4">
              You don't have enough USDT in your wallet to complete this purchase.
              <br />
              <br />
              <span className="font-semibold text-foreground">
                Your Balance: {balanceFormatted} USDT
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button onClick={() => setShowInsufficientBalance(false)} className="min-w-[120px]">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default NodeSection;

