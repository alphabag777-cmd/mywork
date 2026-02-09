import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Share2, Loader2 } from "lucide-react";
import { getAllReferrals, Referral } from "@/lib/referrals";
import { formatAddress } from "@/lib/utils";

export const AdminReferred = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReferrals = async () => {
      setLoading(true);
      try {
        const allReferrals = await getAllReferrals();
        setReferrals(allReferrals);
      } catch (error) {
        console.error("Error loading referrals:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReferrals();
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-primary" />
          Referred Users
        </CardTitle>
        <CardDescription>
          List of all referral relationships ({referrals.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No referrals found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer Wallet</TableHead>
                <TableHead>Referred Wallet</TableHead>
                <TableHead>Referral Code</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell className="font-mono text-xs">
                    {formatAddress(referral.referrerWallet)}
                  </TableCell>
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
      </CardContent>
    </Card>
  );
};

export default AdminReferred;


