import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { bsc } from "wagmi/chains";
import { Network, AlertCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import {
  useUSDTToken,
  useUSDTDecimals,
  useTokenBalance,
  useApproveToken,
  useBuyNode,
} from "@/hooks/useInvestment";
import { formatUnits, parseUnits } from "viem";
import { toast } from "sonner";
import { getAllNodes, NodeType } from "@/lib/nodes";
import { saveNodePurchase } from "@/lib/nodePurchases";
import { ERC20_ABI } from "@/lib/contract";

interface NodePurchaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NodePurchase = ({ open, onOpenChange }: NodePurchaseProps) => {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const usdtToken = useUSDTToken();
  const decimals = useUSDTDecimals(usdtToken);
  const tokenBalance = useTokenBalance(usdtToken);
  const { approve, isPending: isApproving, isSuccess: isApproved } = useApproveToken();
  
  // Check allowance for node purchase wallet
  const NODE_PURCHASE_WALLET = "0x5259ec6B9DdCB6213cf8350d92641623EA2a0C4F" as const;
  const { data: nodeWalletAllowance } = useReadContract({
    address: usdtToken,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && usdtToken ? [address, NODE_PURCHASE_WALLET] : undefined,
    query: {
      enabled: !!usdtToken && !!address,
    },
  });
  const { buyNode, isPending: isBuying, isConfirming, isSuccess: isBuySuccess, error, hash } = useBuyNode();
  const [purchasedNode, setPurchasedNode] = useState<NodeType | null>(null);
  const [nodeTypes, setNodeTypes] = useState<NodeType[]>([]);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
  const pendingNodeRef = useRef<{ nodeId: number; priceWei: bigint; node: NodeType } | null>(null);

  // Load nodes from Firebase
  useEffect(() => {
    const loadNodes = async () => {
      try {
        const nodes = await getAllNodes();
        setNodeTypes(nodes);
      } catch (error) {
        console.error("Error loading nodes:", error);
        toast.error("Failed to load nodes");
      }
    };
    
    if (open) {
      loadNodes();
    }
  }, [open]);

  const balanceFormatted = tokenBalance ? formatUnits(tokenBalance, decimals) : "0";

  useEffect(() => {
    if (isApproved && pendingNodeRef.current) {
      const { priceWei, node } = pendingNodeRef.current;
      if (usdtToken) {
        buyNode(usdtToken, priceWei);
      }
    }
  }, [isApproved, buyNode, usdtToken]);

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

    // Check if approval is needed (approve for the node purchase wallet)
    const needsApproval = nodeWalletAllowance ? priceWei > nodeWalletAllowance : true;

    if (needsApproval && usdtToken) {
      pendingNodeRef.current = { nodeId: node.nodeId, priceWei, node };
      setPurchasedNode(node);
      // Approve for the node purchase wallet
      approve(usdtToken, priceWei, NODE_PURCHASE_WALLET);
      return;
    }

    // Proceed with node purchase (direct transfer)
    setPurchasedNode(node);
    if (usdtToken) {
      buyNode(usdtToken, priceWei);
    }
  };

  // Handle success/error
  useEffect(() => {
    if (isBuySuccess && address && purchasedNode && hash) {
      toast.success(`${purchasedNode.name} purchased successfully!`);
      
      // Save to Firebase
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
        } catch (error) {
          console.error("Failed to save node purchase to Firebase:", error);
          toast.error("Purchase completed but failed to save record. Please contact support.");
        }
      };
      
      savePurchase();
      
      setPurchasedNode(null);
      pendingNodeRef.current = null;
      setTimeout(() => onOpenChange(false), 1500);
    }
    if (error) {
      toast.error(`Node purchase failed: ${error.message}`);
      setPurchasedNode(null);
      pendingNodeRef.current = null;
    }
  }, [isBuySuccess, error, address, purchasedNode, hash, onOpenChange]);

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
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 lg:p-8">
        <DialogHeader className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Network className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-foreground">
              Node Purchase
            </DialogTitle>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">Choose a Node to Purchase</p>
        </DialogHeader>

        {/* Node Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {nodeTypes.map((node) => {
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
        <div className="mb-4 sm:mb-6 pt-4 border-t border-border">
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground text-center">
            Your Balance: <span className="font-bold text-foreground">{balanceFormatted} USDT</span>
          </p>
        </div>

        {/* Close Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto min-w-[200px]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>

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
  </>
  );
};

export default NodePurchase;

