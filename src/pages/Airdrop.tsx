import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Header from "@/components/Header";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gift, Loader2, CheckCircle2, Clock, AlertCircle, Coins, ChevronRight, Trophy,
} from "lucide-react";
import { toast } from "sonner";
import {
  AirdropCampaign, AirdropClaim,
  subscribeCampaigns, getUserClaim, getUserAllClaims, claimAirdrop,
} from "@/lib/airdrop";
import { useTranslate } from "@/hooks/useTranslate";

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtDate(ts: number | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function timeLeft(endAt: number | null): string {
  if (!endAt) return "무제한";
  const diff = endAt - Date.now();
  if (diff <= 0) return "종료됨";
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}일 ${hours}시간 남음`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}시간 ${mins}분 남음`;
}

// ── Campaign Card ─────────────────────────────────────────────────────────────
interface CampaignCardProps {
  campaign: AirdropCampaign;
  claim: AirdropClaim | null | undefined; // undefined = loading
  onClaim: (id: string) => void;
  claiming: boolean;
}

function CampaignCard({ campaign, claim, onClaim, claiming }: CampaignCardProps) {
  const isClaimed  = claim?.status === "claimed";
  const isPending  = claim?.status === "pending";
  const isExpired  = claim?.status === "expired";
  const isEnded    = campaign.status === "ended" || (campaign.endAt !== null && campaign.endAt < Date.now());
  const isFull     = campaign.maxClaimCount !== null && campaign.claimedCount >= campaign.maxClaimCount;
  const canClaim   = !isClaimed && !isExpired && !isEnded && !isFull;
  const pct        = campaign.maxClaimCount
    ? Math.round((campaign.claimedCount / campaign.maxClaimCount) * 100)
    : campaign.totalBudget > 0
      ? Math.round((campaign.totalClaimed / campaign.totalBudget) * 100)
      : 0;

  return (
    <Card className={`relative overflow-hidden transition-all duration-200 hover:border-primary/40 ${isClaimed ? "border-green-500/40" : ""}`}>
      {/* Top gradient strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        isClaimed ? "bg-green-500" :
        isEnded   ? "bg-zinc-600"  :
        "bg-gradient-to-r from-primary to-primary/60"
      }`} />

      <CardHeader className="pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 ${
              isClaimed ? "bg-green-500/15 text-green-500" :
              isEnded   ? "bg-zinc-500/15 text-zinc-400"   :
              "bg-primary/15 text-primary"
            }`}>
              {isClaimed ? <CheckCircle2 className="w-6 h-6" /> : <Gift className="w-6 h-6" />}
            </div>
            <div>
              <CardTitle className="text-base leading-tight">{campaign.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{campaign.description}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 text-xs ${
              isClaimed  ? "bg-green-500/15 text-green-500 border-green-500/30" :
              isEnded    ? "bg-zinc-500/15  text-zinc-400  border-zinc-500/30"  :
              isPending  ? "bg-blue-500/15  text-blue-400  border-blue-500/30"  :
              "bg-primary/15 text-primary border-primary/30"
            }`}
          >
            {isClaimed ? "Claimed" : isEnded ? "Ended" : isPending ? "Pending" : "Available"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-5">
        {/* Token Reward */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-muted-foreground">에어드랍 수량</span>
          </div>
          <span className="text-lg font-bold">
            {campaign.tokenAmount.toLocaleString()}
            <span className="text-sm font-medium text-muted-foreground ml-1">{campaign.tokenSymbol}</span>
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">참여자</p>
            <p className="text-sm font-semibold">{campaign.claimedCount.toLocaleString()}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">총 배포</p>
            <p className="text-sm font-semibold">{campaign.totalClaimed.toLocaleString()}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">남은 시간</p>
            <p className="text-xs font-semibold text-primary">{timeLeft(campaign.endAt)}</p>
          </div>
        </div>

        {/* Progress bar */}
        {(campaign.maxClaimCount !== null || campaign.totalBudget > 0) && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>진행률</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 100 ? "bg-zinc-500" : "bg-gradient-to-r from-primary to-primary/70"
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            {campaign.maxClaimCount !== null && (
              <p className="text-xs text-muted-foreground text-right">
                {campaign.claimedCount.toLocaleString()} / {campaign.maxClaimCount.toLocaleString()} 클레임
              </p>
            )}
          </div>
        )}

        {/* Claim button */}
        {isClaimed ? (
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            {fmtDate(claim?.claimedAt ?? null)} 클레임 완료
          </div>
        ) : isEnded ? (
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 text-muted-foreground text-sm">
            <Clock className="w-4 h-4" /> 에어드랍이 종료되었습니다
          </div>
        ) : isFull ? (
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 text-muted-foreground text-sm">
            <AlertCircle className="w-4 h-4" /> 수량이 모두 소진되었습니다
          </div>
        ) : (
          <Button
            className="w-full gap-2"
            disabled={claiming || claim === undefined}
            onClick={() => onClaim(campaign.id)}
          >
            {claiming ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 클레임 중...</>
            ) : (
              <><Gift className="w-4 h-4" /> 에어드랍 클레임</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
const Airdrop = () => {
  const { address, isConnected } = useAccount();
  const { t } = useTranslate();

  const [campaigns, setCampaigns]     = useState<AirdropCampaign[]>([]);
  const [claimsMap, setClaimsMap]     = useState<Record<string, AirdropClaim | null>>({});
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimingId, setClaimingId]   = useState<string | null>(null);
  const [myHistory, setMyHistory]     = useState<AirdropClaim[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Subscribe to campaigns ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeCampaigns(setCampaigns);
    return () => unsub();
  }, []);

  // ── Load user's claim status for each campaign ──────────────────────────────
  useEffect(() => {
    if (!address || campaigns.length === 0) return;
    campaigns.forEach(async (c) => {
      if (claimsMap[c.id] !== undefined) return; // already loaded
      const claim = await getUserClaim(c.id, address);
      setClaimsMap(prev => ({ ...prev, [c.id]: claim }));
    });
  }, [campaigns, address]);

  // ── Load my claim history ───────────────────────────────────────────────────
  useEffect(() => {
    if (!address) return;
    setHistoryLoading(true);
    getUserAllClaims(address)
      .then(setMyHistory)
      .finally(() => setHistoryLoading(false));
  }, [address]);

  // ── Handle claim ────────────────────────────────────────────────────────────
  async function handleClaim(campaignId: string) {
    if (!address) { toast.error("지갑을 연결해 주세요."); return; }
    setClaimingId(campaignId);
    try {
      const result = await claimAirdrop(campaignId, address);
      if (result.ok) {
        toast.success(result.message);
        if (result.claim) {
          setClaimsMap(prev => ({ ...prev, [campaignId]: result.claim! }));
          setMyHistory(prev => [result.claim!, ...prev]);
        }
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("클레임 처리 중 오류가 발생했습니다.");
    } finally {
      setClaimingId(null);
    }
  }

  // ── Claimed count ──────────────────────────────────────────────────────────
  const myClaimedCount  = myHistory.filter(c => c.status === "claimed").length;
  const myClaimedTokens = myHistory
    .filter(c => c.status === "claimed")
    .reduce((s, c) => s + c.tokenAmount, 0);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[88px] sm:pt-20">
        <div className="container mx-auto px-4 py-8 max-w-5xl">

          {/* Page Header */}
          <div className="mb-8 text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3">
              <Gift className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Airdrop</h1>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              AlphaBag 에어드랍 이벤트에 참여하고 무료 토큰을 받아가세요!
            </p>
          </div>

          {/* Stats (only when connected) */}
          {isConnected && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Card className="text-center py-4">
                <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{myClaimedCount}</p>
                <p className="text-xs text-muted-foreground">클레임 완료</p>
              </Card>
              <Card className="text-center py-4">
                <Coins className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold">{myClaimedTokens.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">총 받은 토큰</p>
              </Card>
            </div>
          )}

          {/* Not connected warning */}
          {!isConnected && (
            <Card className="mb-8 border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="flex items-center gap-3 py-4">
                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  에어드랍을 클레임하려면 지갑을 연결해 주세요.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Active Campaigns */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                진행 중인 에어드랍 ({campaigns.length})
              </h2>
            </div>

            {campaigns.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Gift className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">현재 진행 중인 에어드랍이 없습니다.</p>
                  <p className="text-sm text-muted-foreground mt-1">새로운 에어드랍을 기대해 주세요!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {campaigns.map(c => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    claim={claimsMap[c.id]}
                    onClaim={handleClaim}
                    claiming={claimingId === c.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* My Claim History */}
          {isConnected && (
            <div className="mt-10 space-y-4">
              <h2 className="text-lg font-semibold">내 클레임 기록</h2>
              <Card>
                {historyLoading ? (
                  <CardContent className="flex justify-center py-10">
                    <Loader2 className="animate-spin" />
                  </CardContent>
                ) : myHistory.length === 0 ? (
                  <CardContent className="flex flex-col items-center py-10 text-center">
                    <Clock className="w-8 h-8 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">클레임 기록이 없습니다.</p>
                  </CardContent>
                ) : (
                  <div className="divide-y divide-border/50">
                    {myHistory.map(cl => (
                      <div key={cl.id} className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            cl.status === "claimed"
                              ? "bg-green-500/15 text-green-500"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {cl.status === "claimed"
                              ? <CheckCircle2 className="w-4 h-4" />
                              : <Clock className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{cl.campaignTitle}</p>
                            <p className="text-xs text-muted-foreground">{fmtDate(cl.claimedAt ?? cl.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">
                            +{cl.tokenAmount.toLocaleString()} {cl.tokenSymbol}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              cl.status === "claimed"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {cl.status === "claimed" ? "완료" : cl.status === "pending" ? "대기" : "만료"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Airdrop;
