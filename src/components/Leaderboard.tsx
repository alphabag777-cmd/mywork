import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAddress } from "@/lib/utils";
import { Trophy, Users, TrendingUp } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  value: number; // Investment amount or referral count
}

// Mock data - In production, fetch this from Firestore
const TOP_INVESTORS: LeaderboardEntry[] = [
  { rank: 1, wallet: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", value: 50000 },
  { rank: 2, wallet: "0x89205A3A3b2B69De6Dbf7f01ED13B2108B2c43e7", value: 35000 },
  { rank: 3, wallet: "0x3D2d4D9702221379f53831804B3392437632684D", value: 28000 },
  { rank: 4, wallet: "0x1234567890abcdef1234567890abcdef12345678", value: 15000 },
  { rank: 5, wallet: "0xabcdef1234567890abcdef1234567890abcdef12", value: 12000 },
];

const TOP_REFERRERS: LeaderboardEntry[] = [
  { rank: 1, wallet: "0x9876543210fedcba9876543210fedcba98765432", value: 150 },
  { rank: 2, wallet: "0x5555555555555555555555555555555555555555", value: 120 },
  { rank: 3, wallet: "0x4444444444444444444444444444444444444444", value: 85 },
  { rank: 4, wallet: "0x3333333333333333333333333333333333333333", value: 60 },
  { rank: 5, wallet: "0x2222222222222222222222222222222222222222", value: 45 },
];

export function Leaderboard() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Top Investors */}
      <Card className="border-primary/20 bg-card/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-yellow-500" />
            Top Investors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {TOP_INVESTORS.map((entry) => (
              <div key={entry.rank} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${entry.rank === 1 ? 'bg-yellow-500 text-black' : 
                      entry.rank === 2 ? 'bg-gray-300 text-black' : 
                      entry.rank === 3 ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {entry.rank}
                  </div>
                  <span className="font-mono text-sm">{formatAddress(entry.wallet)}</span>
                </div>
                <span className="font-semibold text-sm">{entry.value.toLocaleString()} USDT</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Referrers */}
      <Card className="border-primary/20 bg-card/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-blue-500" />
            Top Referrers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {TOP_REFERRERS.map((entry) => (
              <div key={entry.rank} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${entry.rank === 1 ? 'bg-yellow-500 text-black' : 
                      entry.rank === 2 ? 'bg-gray-300 text-black' : 
                      entry.rank === 3 ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {entry.rank}
                  </div>
                  <span className="font-mono text-sm">{formatAddress(entry.wallet)}</span>
                </div>
                <span className="font-semibold text-sm">{entry.value} Invites</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
