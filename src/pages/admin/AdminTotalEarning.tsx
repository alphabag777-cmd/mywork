import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, Loader2, Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getWalletBalances } from "@/lib/walletBalance";
import { formatAddress } from "@/lib/utils";

// Wallet addresses to track.
// Override via VITE_TRACKED_WALLETS env var (comma-separated addresses).
// e.g. VITE_TRACKED_WALLETS=0xAbc...,0xDef...
const DEFAULT_TRACKED_WALLETS = [
  "0xFdb440cA2285Ab6d09A88B13a4b49A0323C94CE6",
  "0x47975F7517419f57DCC77e89DDbF611021204127",
];

const TRACKED_WALLETS: string[] = import.meta.env.VITE_TRACKED_WALLETS
  ? (import.meta.env.VITE_TRACKED_WALLETS as string)
      .split(",")
      .map((w: string) => w.trim())
      .filter(Boolean)
  : DEFAULT_TRACKED_WALLETS;

interface WalletBalance {
  address: string;
  usdtBalance: string;
  bnbBalance: string;
}

export const AdminTotalEarning = () => {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBalances = async () => {
    try {
      const walletBalances = await getWalletBalances(TRACKED_WALLETS);
      setBalances(walletBalances);
    } catch (error) {
      console.error("Error loading wallet balances:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBalances();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadBalances();
  };

  const totalUSDT = balances.reduce((sum, b) => sum + parseFloat(b.usdtBalance), 0);
  const totalBNB = balances.reduce((sum, b) => sum + parseFloat(b.bnbBalance), 0);

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Total Earnings
              </CardTitle>
              <CardDescription>Wallet balances on BSC chain</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
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
                      <div className="text-3xl font-bold text-foreground">
                        ${totalUSDT.toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Total BNB</p>
                      <div className="text-3xl font-bold text-foreground">
                        {totalBNB.toFixed(4)} BNB
                      </div>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wallet Address</TableHead>
                      <TableHead className="text-right">USDT Balance</TableHead>
                      <TableHead className="text-right">BNB Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balances.map((balance, index) => (
                      <TableRow key={balance.address}>
                        <TableCell className="font-mono text-xs">
                          {formatAddress(balance.address)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${parseFloat(balance.usdtBalance).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {parseFloat(balance.bnbBalance).toFixed(4)} BNB
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTotalEarning;


