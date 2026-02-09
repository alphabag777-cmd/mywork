import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Loader2, ChevronLeft, ChevronRight, Eye, Edit, Plus, Trash2, Save, X, Search, XCircle } from "lucide-react";
import { getUsersPaginated, getUsersCount, User, updateUserReferrer, searchUsers } from "@/lib/users";
import { getAllReferralCounts, getReferralsByReferrer, getReferralByReferred, Referral } from "@/lib/referrals";
import { getUserNodePurchases, saveNodePurchase, deleteNodePurchase, updateNodePurchase, NodePurchase } from "@/lib/nodePurchases";
import { getUserInvestments, saveUserInvestment, updateUserInvestment, deleteUserInvestment, UserInvestment } from "@/lib/userInvestments";
import { getAllNodes, NodeType } from "@/lib/nodes";
import { getAllPlans, InvestmentPlan } from "@/lib/plans";
import { getUserSBAGPositions, confirmSBAGPurchase, getAllSBAGPositions, SBAGPosition, updateSellDelegation } from "@/lib/sbagPositions";
import { NodeId } from "@/lib/contract";
import { formatAddress } from "@/lib/utils";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PAGE_SIZE = 20;

interface UserDetailData {
  user: User;
  referrals: Referral[];
  nodePurchases: NodePurchase[];
  investments: UserInvestment[];
  referralCount: number;
  sbagPositions: SBAGPosition[];
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralCounts, setReferralCounts] = useState<{ [key: string]: number }>({});
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageHistory, setPageHistory] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  
  // Search state
  const [searchWalletAddress, setSearchWalletAddress] = useState("");
  const [searchReferralCode, setSearchReferralCode] = useState("");
  const [searchReferrer, setSearchReferrer] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchParams, setActiveSearchParams] = useState<{ walletAddress?: string; referralCode?: string; referrer?: string } | null>(null);
  
  // User detail dialog state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailData, setUserDetailData] = useState<UserDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  // Edit states
  const [editingReferrer, setEditingReferrer] = useState(false);
  const [newReferrerWallet, setNewReferrerWallet] = useState("");
  const [newReferrerCode, setNewReferrerCode] = useState("");
  const [editingNodePurchase, setEditingNodePurchase] = useState<NodePurchase | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<UserInvestment | null>(null);
  const [addingNodePurchase, setAddingNodePurchase] = useState(false);
  const [addingInvestment, setAddingInvestment] = useState(false);
  
  // Data for forms
  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  
  // SBAG positions state
  const [userSBAGPositions, setUserSBAGPositions] = useState<SBAGPosition[]>([]);
  const [editingSBAGPosition, setEditingSBAGPosition] = useState<SBAGPosition | null>(null);
  const [confirmingSBAG, setConfirmingSBAG] = useState(false);
  const [purchasedNUMI, setPurchasedNUMI] = useState<string>("");
  const [purchasePriceUSDT, setPurchasePriceUSDT] = useState<string>("");

  // Load referral counts once on mount
  useEffect(() => {
    const loadReferralCounts = async () => {
      try {
        const counts = await getAllReferralCounts();
        setReferralCounts(counts);
      } catch (error) {
        console.error("Error loading referral counts:", error);
      }
    };
    loadReferralCounts();
  }, []);

  // Load nodes and plans
  useEffect(() => {
    const loadData = async () => {
      try {
        const [nodesData, plansData] = await Promise.all([
          getAllNodes(),
          getAllPlans(),
        ]);
        setNodes(nodesData);
        setPlans(plansData);
      } catch (error) {
        console.error("Error loading nodes/plans:", error);
      }
    };
    loadData();
  }, []);

  const loadUsers = useCallback(async (
    pageIndex: number = 0, 
    lastDocSnapshot: QueryDocumentSnapshot<DocumentData> | null = null
  ) => {
    setLoading(true);
    try {
      // Use active search params if available
      const activeSearch = activeSearchParams || {};
      
      // Check if we have any search criteria
      const hasSearch = activeSearch.walletAddress || activeSearch.referralCode || activeSearch.referrer;
      
      let result;
      if (hasSearch) {
        setIsSearching(true);
        result = await searchUsers(
          activeSearch,
          PAGE_SIZE,
          lastDocSnapshot
        );
      } else {
        setIsSearching(false);
        result = await getUsersPaginated(PAGE_SIZE, lastDocSnapshot);
      }
      
      setUsers(result.users);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);

      if (pageIndex === 0 && !hasSearch) {
        const total = await getUsersCount();
        setTotalUsers(total);
      } else if (hasSearch) {
        // For search results, show the count of filtered results
        setTotalUsers(result.users.length + (result.hasMore ? 1 : 0));
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [activeSearchParams]);

  useEffect(() => {
    loadUsers(0, null);
  }, [loadUsers]);

  const handleNextPage = async () => {
    if (hasMore && lastDoc) {
      const newPageHistory = [...pageHistory.slice(0, currentPage + 1), lastDoc];
      setPageHistory(newPageHistory);
      const nextPageIndex = currentPage + 1;
      setCurrentPage(nextPageIndex);
      
      setLoading(true);
      try {
        const hasSearch = activeSearchParams && (activeSearchParams.walletAddress || activeSearchParams.referralCode || activeSearchParams.referrer);
        let result;
        
        if (hasSearch && activeSearchParams) {
          result = await searchUsers(activeSearchParams, PAGE_SIZE, lastDoc);
        } else {
          result = await getUsersPaginated(PAGE_SIZE, lastDoc);
        }
        
        setUsers(result.users);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      } catch (error) {
        console.error("Error loading next page:", error);
        toast.error("Failed to load next page");
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePreviousPage = async () => {
    if (currentPage > 0) {
      const prevPageIndex = currentPage - 1;
      const prevLastDoc = prevPageIndex === 0 ? null : pageHistory[prevPageIndex - 1];
      const newPageHistory = pageHistory.slice(0, prevPageIndex);
      setPageHistory(newPageHistory);
      setCurrentPage(prevPageIndex);
      
      setLoading(true);
      try {
        const hasSearch = activeSearchParams && (activeSearchParams.walletAddress || activeSearchParams.referralCode || activeSearchParams.referrer);
        let result;
        
        if (hasSearch && activeSearchParams) {
          result = await searchUsers(activeSearchParams, PAGE_SIZE, prevLastDoc);
        } else {
          result = await getUsersPaginated(PAGE_SIZE, prevLastDoc);
        }
        
        setUsers(result.users);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      } catch (error) {
        console.error("Error loading previous page:", error);
        toast.error("Failed to load previous page");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearch = async () => {
    // Reset pagination when searching
    setCurrentPage(0);
    setPageHistory([]);
    const searchParams = {
      walletAddress: searchWalletAddress.trim() || undefined,
      referralCode: searchReferralCode.trim() || undefined,
      referrer: searchReferrer.trim() || undefined,
    };
    setActiveSearchParams(searchParams);
    
    // Load users with search
    setLoading(true);
    try {
      const hasSearch = searchParams.walletAddress || searchParams.referralCode || searchParams.referrer;
      let result;
      
      if (hasSearch) {
        setIsSearching(true);
        result = await searchUsers(searchParams, PAGE_SIZE, null);
      } else {
        setIsSearching(false);
        result = await getUsersPaginated(PAGE_SIZE, null);
      }
      
      setUsers(result.users);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      
      if (!hasSearch) {
        const total = await getUsersCount();
        setTotalUsers(total);
      } else {
        setTotalUsers(result.users.length + (result.hasMore ? 1 : 0));
      }
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = async () => {
    setSearchWalletAddress("");
    setSearchReferralCode("");
    setSearchReferrer("");
    setIsSearching(false);
    setActiveSearchParams(null);
    setCurrentPage(0);
    setPageHistory([]);
    
    // Load users without search
    setLoading(true);
    try {
      const result = await getUsersPaginated(PAGE_SIZE, null);
      setUsers(result.users);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      const total = await getUsersCount();
      setTotalUsers(total);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetail = async (user: User) => {
    setLoadingDetail(true);
    try {
      const [referrals, nodePurchases, investments, sbagPositions] = await Promise.all([
        getReferralsByReferrer(user.walletAddress),
        getUserNodePurchases(user.walletAddress),
        getUserInvestments(user.walletAddress),
        getUserSBAGPositions(user.walletAddress),
      ]);

      setUserDetailData({
        user,
        referrals,
        nodePurchases,
        investments,
        referralCount: referralCounts[user.walletAddress.toLowerCase()] || 0,
        sbagPositions,
      });
      setUserSBAGPositions(sbagPositions);
      setSelectedUser(user);
      setDetailDialogOpen(true);
    } catch (error) {
      console.error("Error loading user detail:", error);
      toast.error("Failed to load user details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateReferrer = async () => {
    if (!selectedUser) return;
    
    try {
      await updateUserReferrer(
        selectedUser.walletAddress,
        newReferrerWallet || null,
        newReferrerCode || null
      );
      toast.success("Referrer updated successfully");
      setEditingReferrer(false);
      setNewReferrerWallet("");
      setNewReferrerCode("");
      // Reload user detail
      if (selectedUser) {
        await loadUserDetail(selectedUser);
      }
      // Reload users list
      await loadUsers(currentPage, pageHistory[currentPage - 1] || null);
    } catch (error) {
      console.error("Error updating referrer:", error);
      toast.error("Failed to update referrer");
    }
  };

  const handleSaveNodePurchase = async () => {
    if (!selectedUser || !editingNodePurchase) return;
    
    try {
      // Check if this is an existing purchase (has a valid id and we're not in "adding" mode)
      const isExisting = editingNodePurchase.id && editingNodePurchase.id !== "" && !addingNodePurchase;
      
      if (isExisting) {
        // This is an existing purchase being edited
        await updateNodePurchase(editingNodePurchase.id, editingNodePurchase);
        toast.success("Node purchase updated successfully");
      } else {
        // This is a new purchase being added
        await saveNodePurchase({
          userId: selectedUser.walletAddress,
          nodeId: editingNodePurchase.nodeId || 0,
          nodeName: editingNodePurchase.nodeName || "",
          nodePrice: editingNodePurchase.nodePrice || 0,
          nodeColor: editingNodePurchase.nodeColor || "gold",
          transactionHash: editingNodePurchase.transactionHash || "",
          purchaseDate: editingNodePurchase.purchaseDate || Date.now(),
          status: editingNodePurchase.status || "completed",
        });
        toast.success("Node purchase added successfully");
      }
      setEditingNodePurchase(null);
      setAddingNodePurchase(false);
      if (selectedUser) {
        await loadUserDetail(selectedUser);
      }
    } catch (error) {
      console.error("Error saving node purchase:", error);
      toast.error("Failed to save node purchase");
    }
  };

  const handleDeleteNodePurchase = async (purchaseId: string) => {
    try {
      await deleteNodePurchase(purchaseId);
      toast.success("Node purchase deleted successfully");
      if (selectedUser) {
        await loadUserDetail(selectedUser);
      }
    } catch (error) {
      console.error("Error deleting node purchase:", error);
      toast.error("Failed to delete node purchase");
    }
  };

  const handleSaveInvestment = async () => {
    if (!selectedUser || !editingInvestment) return;
    
    try {
      // Check if this is an existing investment (has a valid id and we're not in "adding" mode)
      const isExisting = editingInvestment.id && editingInvestment.id !== "" && !addingInvestment;
      
      if (isExisting) {
        // This is an existing investment being edited
        await updateUserInvestment(editingInvestment.id, editingInvestment);
        toast.success("Investment updated successfully");
      } else {
        // This is a new investment being added
        await saveUserInvestment({
          userId: selectedUser.walletAddress,
          category: editingInvestment.category || "BBAG",
          projectId: editingInvestment.projectId || "",
          projectName: editingInvestment.projectName || "",
          amount: editingInvestment.amount || 0,
          ownershipPercentage: editingInvestment.ownershipPercentage || 0,
          transactionHash: editingInvestment.transactionHash || undefined,
          investedAt: editingInvestment.investedAt || Date.now(),
        });
        toast.success("Investment added successfully");
      }
      setEditingInvestment(null);
      setAddingInvestment(false);
      if (selectedUser) {
        await loadUserDetail(selectedUser);
      }
    } catch (error) {
      console.error("Error saving investment:", error);
      toast.error("Failed to save investment");
    }
  };

  const handleDeleteInvestment = async (investmentId: string) => {
    try {
      await deleteUserInvestment(investmentId);
      toast.success("Investment deleted successfully");
      if (selectedUser) {
        await loadUserDetail(selectedUser);
      }
    } catch (error) {
      console.error("Error deleting investment:", error);
      toast.error("Failed to delete investment");
    }
  };

  const handleConfirmSBAGPurchase = async () => {
    if (!editingSBAGPosition) return;
    
    const numi = parseFloat(purchasedNUMI);
    const price = parseFloat(purchasePriceUSDT);
    
    if (isNaN(numi) || numi <= 0) {
      toast.error("Please enter a valid NUMI amount");
      return;
    }
    
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid purchase price");
      return;
    }
    
    setConfirmingSBAG(true);
    try {
      await confirmSBAGPurchase(editingSBAGPosition.id, numi, price);
      toast.success("SBAG purchase confirmed successfully");
      setEditingSBAGPosition(null);
      setPurchasedNUMI("");
      setPurchasePriceUSDT("");
      if (selectedUser) {
        await loadUserDetail(selectedUser);
      }
    } catch (error) {
      console.error("Error confirming SBAG purchase:", error);
      toast.error("Failed to confirm SBAG purchase");
    } finally {
      setConfirmingSBAG(false);
    }
  };

  const handleUpdateSellDelegation = async (
    positionId: string,
    sellDelegationId: string,
    status: "pending" | "processing" | "completed" | "cancelled" | "failed",
    executedPriceUSDT?: number,
    transactionHash?: string,
    slippage?: number
  ) => {
    try {
      await updateSellDelegation(positionId, sellDelegationId, {
        status,
        executedPriceUSDT,
        transactionHash,
        slippage,
        executedAt: status === "completed" ? Date.now() : undefined,
      });
      toast.success("Sell delegation updated successfully");
      if (selectedUser) {
        await loadUserDetail(selectedUser);
      }
    } catch (error) {
      console.error("Error updating sell delegation:", error);
      toast.error("Failed to update sell delegation");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateTotalInvestment = (investments: UserInvestment[]) => {
    return investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  };

  const calculateTotalNodeValue = (purchases: NodePurchase[]) => {
    return purchases.reduce((sum, purchase) => sum + (purchase.nodePrice || 0), 0);
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          User Management System
        </CardTitle>
        <CardDescription>
          {isSearching 
            ? `Search results • Page ${currentPage + 1}`
            : totalUsers > 0 
              ? `${totalUsers.toLocaleString()} total users` 
              : "Loading users..."} • Page {currentPage + 1}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search Section */}
        <div className="mb-6 space-y-4 p-4 bg-background/50 rounded-lg border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Search Users</h3>
            {(searchWalletAddress || searchReferralCode || searchReferrer) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="ml-auto h-7 text-xs"
              >
                <XCircle className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-wallet" className="text-xs">Wallet Address</Label>
              <div className="relative">
                <Input
                  id="search-wallet"
                  placeholder="0x..."
                  value={searchWalletAddress}
                  onChange={(e) => setSearchWalletAddress(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className="pr-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search-referral-code" className="text-xs">Referral Code</Label>
              <Input
                id="search-referral-code"
                placeholder="Enter referral code"
                value={searchReferralCode}
                onChange={(e) => setSearchReferralCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="search-referrer" className="text-xs">Referrer</Label>
              <div className="flex gap-2">
                <Input
                  id="search-referrer"
                  placeholder="0x..."
                  value={searchReferrer}
                  onChange={(e) => setSearchReferrer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearch}
                  size="sm"
                  disabled={loading}
                  className="shrink-0"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID (Wallet Address)</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Referred</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">
                      {formatAddress(user.walletAddress)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{user.referralCode || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {user.referrerWallet ? formatAddress(user.referrerWallet) : "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.isRegistered
                            ? "bg-green-500/20 text-green-400 border border-green-500/50"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                        }`}
                      >
                        {user.isRegistered ? "Registered" : "Pending"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {referralCounts[user.walletAddress.toLowerCase()] || 0}
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadUserDetail(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(currentPage > 0 || hasMore) && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {currentPage + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasMore}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* User Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View and manage user information, investments, nodes, and referral relationships
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : userDetailData ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="nodes">Node Investments</TabsTrigger>
                <TabsTrigger value="investments">Investments</TabsTrigger>
                <TabsTrigger value="sbag">SBAG Positions</TabsTrigger>
                <TabsTrigger value="referrals">Referral Lines</TabsTrigger>
                <TabsTrigger value="relationships">Upline/Downline</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Wallet Address</Label>
                        <p className="font-mono text-sm">{userDetailData.user.walletAddress}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Referral Code</Label>
                        <p className="font-mono text-sm">{userDetailData.user.referralCode || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <p className="text-sm">{userDetailData.user.isRegistered ? "Registered" : "Pending"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Joined</Label>
                        <p className="text-sm">{formatDate(userDetailData.user.createdAt)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Total Investments</Label>
                        <p className="text-sm font-semibold">
                          ${calculateTotalInvestment(userDetailData.investments).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Total Node Value</Label>
                        <p className="text-sm font-semibold">
                          ${calculateTotalNodeValue(userDetailData.nodePurchases).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Referral Count</Label>
                        <p className="text-sm font-semibold">{userDetailData.referralCount}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Investment Products</Label>
                        <p className="text-sm font-semibold">{new Set(userDetailData.investments.map(i => i.projectId)).size}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Node Investments Tab */}
              <TabsContent value="nodes" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Node Investments</h3>
                  <Button
                    size="sm"
                    onClick={() => {
                      setAddingNodePurchase(true);
                      setEditingNodePurchase({
                        id: "",
                        userId: selectedUser?.walletAddress || "",
                        nodeId: 0,
                        nodeName: "",
                        nodePrice: 0,
                        nodeColor: "gold",
                        transactionHash: "",
                        purchaseDate: Date.now(),
                        status: "completed",
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Node Purchase
                  </Button>
                </div>

                {(addingNodePurchase || editingNodePurchase) && editingNodePurchase && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {editingNodePurchase ? "Edit Node Purchase" : "Add Node Purchase"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Node Type (NodeId)</Label>
                          <Select
                            value={editingNodePurchase?.nodeId !== undefined 
                              ? (() => {
                                  // Find a node that matches the current nodeId to use as the selected value
                                  const matchingNode = nodes.find(n => n.nodeId === editingNodePurchase?.nodeId);
                                  return matchingNode ? matchingNode.id : "";
                                })()
                              : ""}
                            onValueChange={(value) => {
                              // Find the node by its unique id
                              const node = nodes.find(n => n.id === value);
                              if (node && editingNodePurchase) {
                                setEditingNodePurchase({
                                  ...editingNodePurchase,
                                  nodeId: node.nodeId,
                                  // Only update nodeName if it's empty or if user wants to sync
                                  // Keep existing nodeName to preserve original mapping
                                  nodeColor: node.color,
                                });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select node type">
                                {editingNodePurchase?.nodeId !== undefined
                                  ? (() => {
                                      const nodeId = editingNodePurchase.nodeId;
                                      const node = nodes.find(n => n.nodeId === nodeId);
                                      return node 
                                        ? `${node.name} (NodeId: ${nodeId})`
                                        : `NodeId: ${nodeId}`;
                                    })()
                                  : "Select node type"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {/* Show all individual nodes - Use unique node.id as value to prevent all items showing as selected */}
                              {nodes.length > 0 ? (
                                nodes.map((node) => {
                                  // Check if this node's nodeId matches the currently selected nodeId
                                  const isSelected = editingNodePurchase?.nodeId === node.nodeId;
                                  
                                  const displayName = `${node.name} (NodeId: ${node.nodeId})`;
                                  
                                  return (
                                    <SelectItem 
                                      key={node.id} 
                                      value={node.id} // Use unique node.id instead of nodeId to prevent duplicate values
                                      className={isSelected ? "bg-primary/10 font-semibold" : ""}
                                    >
                                      {displayName}
                                    </SelectItem>
                                  );
                                })
                              ) : (
                                // Fallback: Show all possible NodeId enum values if no nodes exist
                                [NodeId.SUPER, NodeId.ALPHA, NodeId.T, NodeId.F].map((nodeId) => {
                                  const nodeIdNames: Record<number, string> = {
                                    [NodeId.SUPER]: "Super",
                                    [NodeId.ALPHA]: "Alpha",
                                    [NodeId.T]: "T",
                                    [NodeId.F]: "F",
                                  };
                                  const isSelected = editingNodePurchase?.nodeId === nodeId;
                                  
                                  return (
                                    <SelectItem 
                                      key={`nodeId-${nodeId}`} 
                                      value={nodeId.toString()}
                                      className={isSelected ? "bg-primary/10 font-semibold" : ""}
                                    >
                                      {nodeIdNames[nodeId] || "Unknown"} (NodeId: {nodeId}) - No nodes defined
                                    </SelectItem>
                                  );
                                })
                              )}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            NodeId: {NodeId.SUPER}=Super, {NodeId.ALPHA}=Alpha, {NodeId.T}=T, {NodeId.F}=F
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label>Node Name</Label>
                            {editingNodePurchase?.nodeId !== undefined && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => {
                                  const node = nodes.find(n => n.nodeId === editingNodePurchase.nodeId);
                                  if (node && editingNodePurchase) {
                                    setEditingNodePurchase({
                                      ...editingNodePurchase,
                                      nodeName: node.name,
                                    });
                                    toast.success(`Node name synced to "${node.name}"`);
                                  }
                                }}
                              >
                                Sync with Node Type
                              </Button>
                            )}
                          </div>
                          <Input
                            value={editingNodePurchase?.nodeName || ""}
                            onChange={(e) => {
                              if (editingNodePurchase) {
                                setEditingNodePurchase({
                                  ...editingNodePurchase,
                                  nodeName: e.target.value,
                                });
                              }
                            }}
                            placeholder="e.g. binance Alpha 1, Super NODE"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Display name (can differ from node type name). Use "Sync" to match selected node type.
                          </p>
                        </div>
                        <div>
                          <Label>Price (USDT)</Label>
                          <Input
                            type="number"
                            value={editingNodePurchase?.nodePrice || ""}
                            onChange={(e) => {
                              if (editingNodePurchase) {
                                setEditingNodePurchase({
                                  ...editingNodePurchase,
                                  nodePrice: parseFloat(e.target.value) || 0,
                                });
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label>Transaction Hash</Label>
                          <Input
                            value={editingNodePurchase?.transactionHash || ""}
                            onChange={(e) => {
                              if (editingNodePurchase) {
                                setEditingNodePurchase({
                                  ...editingNodePurchase,
                                  transactionHash: e.target.value,
                                });
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select
                            value={editingNodePurchase?.status || "completed"}
                            onValueChange={(value: "completed" | "pending" | "failed") => {
                              if (editingNodePurchase) {
                                setEditingNodePurchase({
                                  ...editingNodePurchase,
                                  status: value,
                                });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveNodePurchase}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAddingNodePurchase(false);
                            setEditingNodePurchase(null);
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  {userDetailData.nodePurchases.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No node purchases found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Node Type</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Purchase Date</TableHead>
                          <TableHead>Transaction Hash</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userDetailData.nodePurchases.map((purchase) => (
                          <TableRow key={purchase.id}>
                            <TableCell>{purchase.nodeName}</TableCell>
                            <TableCell>${purchase.nodePrice.toLocaleString()}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${
                                purchase.status === "completed" ? "bg-green-500/20 text-green-400" :
                                purchase.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-red-500/20 text-red-400"
                              }`}>
                                {purchase.status}
                              </span>
                            </TableCell>
                            <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {purchase.transactionHash ? formatAddress(purchase.transactionHash, 8) : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setAddingNodePurchase(false);
                                    setEditingNodePurchase(purchase);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteNodePurchase(purchase.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>

              {/* Investments Tab */}
              <TabsContent value="investments" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Investments</h3>
                  <Button
                    size="sm"
                    onClick={() => {
                      setAddingInvestment(true);
                      setEditingInvestment({
                        id: "",
                        userId: selectedUser?.walletAddress || "",
                        category: "BBAG",
                        projectId: "",
                        projectName: "",
                        amount: 0,
                        ownershipPercentage: 0,
                        transactionHash: undefined,
                        investedAt: Date.now(),
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Investment
                  </Button>
                </div>

                {(addingInvestment || editingInvestment) && editingInvestment && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {editingInvestment ? "Edit Investment" : "Add Investment"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Project</Label>
                          <Select
                            value={editingInvestment?.projectId || ""}
                            onValueChange={(value) => {
                              const plan = plans.find(p => p.id === value);
                              if (plan && editingInvestment) {
                                setEditingInvestment({
                                  ...editingInvestment,
                                  projectId: plan.id,
                                  projectName: plan.name,
                                });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                              {plans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Select
                            value={editingInvestment?.category || "BBAG"}
                            onValueChange={(value: "BBAG" | "SBAG" | "CBAG") => {
                              if (editingInvestment) {
                                setEditingInvestment({
                                  ...editingInvestment,
                                  category: value,
                                });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BBAG">BBAG</SelectItem>
                              <SelectItem value="SBAG">SBAG</SelectItem>
                              <SelectItem value="CBAG">CBAG</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Amount (USDT)</Label>
                          <Input
                            type="number"
                            value={editingInvestment?.amount || ""}
                            onChange={(e) => {
                              if (editingInvestment) {
                                setEditingInvestment({
                                  ...editingInvestment,
                                  amount: parseFloat(e.target.value) || 0,
                                });
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label>Ownership %</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={editingInvestment?.ownershipPercentage || ""}
                            onChange={(e) => {
                              if (editingInvestment) {
                                setEditingInvestment({
                                  ...editingInvestment,
                                  ownershipPercentage: parseFloat(e.target.value) || 0,
                                });
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label>Transaction Hash</Label>
                          <Input
                            value={editingInvestment?.transactionHash || ""}
                            onChange={(e) => {
                              if (editingInvestment) {
                                setEditingInvestment({
                                  ...editingInvestment,
                                  transactionHash: e.target.value,
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveInvestment}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAddingInvestment(false);
                            setEditingInvestment(null);
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  {userDetailData.investments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No investments found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Ownership %</TableHead>
                          <TableHead>Invested At</TableHead>
                          <TableHead>Transaction</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userDetailData.investments.map((investment) => (
                          <TableRow key={investment.id}>
                            <TableCell>{investment.projectName}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${
                                investment.category === "BBAG" ? "bg-blue-500/20 text-blue-400" :
                                investment.category === "SBAG" ? "bg-purple-500/20 text-purple-400" :
                                "bg-green-500/20 text-green-400"
                              }`}>
                                {investment.category}
                              </span>
                            </TableCell>
                            <TableCell>${investment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>{investment.ownershipPercentage.toFixed(2)}%</TableCell>
                            <TableCell>{formatDate(investment.investedAt)}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {investment.transactionHash ? formatAddress(investment.transactionHash, 8) : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setAddingInvestment(false);
                                    setEditingInvestment(investment);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteInvestment(investment.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>

              {/* SBAG Positions Tab */}
              <TabsContent value="sbag" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">SBAG Positions (NUMI)</h3>
                </div>

                {userDetailData.sbagPositions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No SBAG positions found</p>
                ) : (
                  <div className="space-y-4">
                    {userDetailData.sbagPositions.map((position) => (
                      <Card key={position.id} className="border-border/50">
                        <CardHeader>
                          <CardTitle className="text-sm">{position.projectName}</CardTitle>
                          <CardDescription>
                            Invested: {new Date(position.investedAt).toLocaleString()}
                            {position.transactionHash && (
                              <span className="ml-2 font-mono text-xs">
                                TX: {formatAddress(position.transactionHash, 8)}
                              </span>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">Invested USDT</Label>
                              <p className="text-sm font-semibold">{position.investedUSDT.toFixed(2)} USDT</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Back-Office Confirmed</Label>
                              <p className="text-sm font-semibold">
                                {position.backofficeConfirmed ? (
                                  <span className="text-green-500">Yes</span>
                                ) : (
                                  <span className="text-yellow-500">Pending</span>
                                )}
                              </p>
                            </div>
                            {position.backofficeConfirmed && (
                              <>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Purchased NUMI</Label>
                                  <p className="text-sm font-semibold">{position.purchasedNUMI.toFixed(2)} NUMI</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Purchase Price</Label>
                                  <p className="text-sm font-semibold">{position.purchasePriceUSDT.toFixed(6)} USDT</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Current Price</Label>
                                  <p className="text-sm font-semibold">
                                    {position.currentPriceUSDT ? position.currentPriceUSDT.toFixed(6) : "N/A"} USDT
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Back-Office Entered</Label>
                                  <p className="text-sm font-semibold">
                                    {position.backofficeEnteredAt
                                      ? new Date(position.backofficeEnteredAt).toLocaleString()
                                      : "N/A"}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>

                          {!position.backofficeConfirmed && (
                            <div className="pt-4 border-t border-border/50">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setEditingSBAGPosition(position);
                                  setPurchasedNUMI("");
                                  setPurchasePriceUSDT("");
                                }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Confirm Purchase
                              </Button>
                            </div>
                          )}

                          {position.sellDelegations.length > 0 && (
                            <div className="pt-4 border-t border-border/50">
                              <Label className="text-xs text-muted-foreground mb-2 block">Sell Delegations</Label>
                              <div className="space-y-2">
                                {position.sellDelegations.map((sd) => (
                                  <div key={sd.id} className="p-3 rounded bg-background/50 border border-border/30">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="text-sm font-semibold">{sd.numiAmount.toFixed(2)} NUMI</p>
                                        <p className="text-xs text-muted-foreground">
                                          Requested: {new Date(sd.requestedAt).toLocaleString()}
                                        </p>
                                      </div>
                                      <Select
                                        value={sd.status}
                                        onValueChange={(value: any) => {
                                          handleUpdateSellDelegation(position.id, sd.id, value);
                                        }}
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="processing">Processing</SelectItem>
                                          <SelectItem value="completed">Completed</SelectItem>
                                          <SelectItem value="cancelled">Cancelled</SelectItem>
                                          <SelectItem value="failed">Failed</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    {sd.executedAt && (
                                      <div className="text-xs text-muted-foreground">
                                        Executed: {new Date(sd.executedAt).toLocaleString()}
                                        {sd.executedPriceUSDT && (
                                          <span className="ml-2">@ {sd.executedPriceUSDT.toFixed(6)} USDT</span>
                                        )}
                                        {sd.slippage !== undefined && (
                                          <span className="ml-2">Slippage: {sd.slippage.toFixed(2)}%</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Confirm SBAG Purchase Dialog */}
                {editingSBAGPosition && (
                  <Card className="mt-4 border-primary/50">
                    <CardHeader>
                      <CardTitle className="text-sm">Confirm SBAG Purchase</CardTitle>
                      <CardDescription>
                        Enter the purchased NUMI amount and purchase price (USDT) as confirmed by back-office
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Purchased NUMI Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={purchasedNUMI}
                          onChange={(e) => setPurchasedNUMI(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Purchase Price (USDT per NUMI)</Label>
                        <Input
                          type="number"
                          step="0.000001"
                          value={purchasePriceUSDT}
                          onChange={(e) => setPurchasePriceUSDT(e.target.value)}
                          placeholder="0.000000"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleConfirmSBAGPurchase}
                          disabled={confirmingSBAG || !purchasedNUMI || !purchasePriceUSDT}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Confirm Purchase
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingSBAGPosition(null);
                            setPurchasedNUMI("");
                            setPurchasePriceUSDT("");
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Referral Lines Tab */}
              <TabsContent value="referrals" className="space-y-4">
                <h3 className="text-lg font-semibold">Referral Lines (Downlines)</h3>
                {userDetailData.referrals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No referrals found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Referred Wallet</TableHead>
                        <TableHead>Referral Code</TableHead>
                        <TableHead>Referred Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userDetailData.referrals.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell className="font-mono text-xs">
                            {formatAddress(referral.referredWallet)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{referral.referrerCode}</TableCell>
                          <TableCell>{formatDate(referral.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              {/* Upline/Downline Relationships Tab */}
              <TabsContent value="relationships" className="space-y-4">
                <h3 className="text-lg font-semibold">Upline/Downline Relationships</h3>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Current Referrer (Upline)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!editingReferrer ? (
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Referrer Wallet</Label>
                          <p className="font-mono text-sm">
                            {userDetailData.user.referrerWallet ? formatAddress(userDetailData.user.referrerWallet) : "None"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Referrer Code</Label>
                          <p className="font-mono text-sm">{userDetailData.user.referrerCode || "-"}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingReferrer(true);
                            setNewReferrerWallet(userDetailData.user.referrerWallet || "");
                            setNewReferrerCode(userDetailData.user.referrerCode || "");
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Referrer
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label>Referrer Wallet Address</Label>
                          <Input
                            value={newReferrerWallet}
                            onChange={(e) => setNewReferrerWallet(e.target.value)}
                            placeholder="0x..."
                          />
                        </div>
                        <div>
                          <Label>Referrer Code</Label>
                          <Input
                            value={newReferrerCode}
                            onChange={(e) => setNewReferrerCode(e.target.value)}
                            placeholder="Referral code"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleUpdateReferrer}>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingReferrer(false);
                              setNewReferrerWallet("");
                              setNewReferrerCode("");
                            }}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Downlines ({userDetailData.referralCount})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userDetailData.referrals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No downlines</p>
                    ) : (
                      <div className="space-y-2">
                        {userDetailData.referrals.slice(0, 10).map((referral) => (
                          <div key={referral.id} className="flex items-center justify-between py-2 border-b">
                            <span className="font-mono text-xs">
                              {formatAddress(referral.referredWallet)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(referral.createdAt)}
                            </span>
                          </div>
                        ))}
                        {userDetailData.referrals.length > 10 && (
                          <p className="text-xs text-muted-foreground text-center pt-2">
                            Showing first 10 of {userDetailData.referrals.length} downlines
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminUsers;
