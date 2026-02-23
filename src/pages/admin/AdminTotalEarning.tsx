import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, Loader2, Wallet, RefreshCw, Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getWalletBalances } from "@/lib/walletBalance";
import { formatAddress } from "@/lib/utils";
import { toast } from "sonner";

// ─── Persisted wallet list (localStorage) ─────────────────────────────────────
const STORAGE_KEY = "alphabag_tracked_wallets";

const DEFAULT_TRACKED_WALLETS = [
  "0xFdb440cA2285Ab6d09A88B13a4b49A0323C94CE6",
  "0x47975F7517419f57DCC77e89DDbF611021204127",
];

function loadWallets(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_TRACKED_WALLETS;
}

function saveWallets(wallets: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
}

interface WalletBalance {
  address: string;
  usdtBalance: string;
  bnbBalance: string;
}

export const AdminTotalEarning = () => {
  const [trackedWallets, setTrackedWallets] = useState<string[]>(loadWallets);
  const [newWallet, setNewWallet]           = useState("");
  const [balances, setBalances]             = useState<WalletBalance[]>([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);

  const loadBalances = async (wallets: string[] = trackedWallets) => {
    if (wallets.length === 0) {
      setBalances([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const walletBalances = await getWalletBalances(wallets);
      setBalances(walletBalances);
    } catch (error) {
      console.error("Error loading wallet balances:", error);
      toast.error("Failed to load balances");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadBalances();
  };

  const handleAddWallet = () => {
    const addr = newWallet.trim();
    if (!addr) return;
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
      toast.error("Invalid Ethereum address format");
      return;
    }
    if (trackedWallets.some(w => w.toLowerCase() === addr.toLowerCase())) {
      toast.error("Wallet already tracked");
      return;
    }
    const updated = [...trackedWallets, addr];
    setTrackedWallets(updated);
    saveWallets(updated);
    setNewWallet("");
    toast.success("Wallet added");
    // Fetch balance for the new wallet immediately
    setRefreshing(true);
    loadBalances(updated);
  };

  const handleRemoveWallet = (addr: string) => {
    const updated = trackedWallets.filter(w => w.toLowerCase() !== addr.toLowerCase());
    setTrackedWallets(updated);
    saveWallets(updated);
    setBalances(prev => prev.filter(b => b.address.toLowerCase() !== addr.toLowerCase()));
    toast.success("Wallet removed");
  };

  const totalUSDT = balances.reduce((sum, b) => sum + parseFloat(b.usdtBalance || "0"), 0);
  const totalBNB  = balances.reduce((sum, b) => sum + parseFloat(b.bnbBalance  || "0"), 0);

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Total Earnings
              </CardTitle>
              <CardDescription>Wallet balances on BSC chain</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Total USDT</p>
                      <div className="text-3xl font-bold">${totalUSDT.toFixed(2)}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Total BNB</p>
                      <div className="text-3xl font-bold">{totalBNB.toFixed(4)} BNB</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Wallet Balances Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Wallet Balances
                </h3>
                {balances.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No wallets tracked yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Wallet Address</TableHead>
                        <TableHead className="text-right">USDT Balance</TableHead>
                        <TableHead className="text-right">BNB Balance</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balances.map((balance) => (
                        <TableRow key={balance.address}>
                          <TableCell className="font-mono text-xs">
                            <div className="flex items-center gap-2">
                              {formatAddress(balance.address)}
                              <a
                                href={`https://bscscan.com/address/${balance.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ${parseFloat(balance.usdtBalance).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {parseFloat(balance.bnbBalance).toFixed(4)} BNB
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveWallet(balance.address)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Wallet Card */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Add Tracked Wallet
          </CardTitle>
          <CardDescription className="text-xs">Enter a BSC wallet address to track its balance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="0x..."
              value={newWallet}
              onChange={(e) => setNewWallet(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddWallet()}
              className="font-mono text-sm"
            />
            <Button onClick={handleAddWallet} disabled={!newWallet.trim()} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
          {/* Wallet list quick view */}
          {trackedWallets.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs text-muted-foreground mb-1">Tracked wallets ({trackedWallets.length})</p>
              {trackedWallets.map(addr => (
                <div key={addr} className="flex items-center justify-between px-2 py-1 rounded bg-muted/40">
                  <span className="font-mono text-xs text-muted-foreground">{formatAddress(addr)}</span>
                  <Button
                    variant="ghost" size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveWallet(addr)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTotalEarning;
