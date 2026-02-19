import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useEffect, useState, useCallback } from "react";
import { Crown, Share2, User, RefreshCw, Copy, Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getReferralsByReferrer } from "@/lib/referrals";
import { getReferralActivitiesByReferrer, ReferralActivity } from "@/lib/referralActivities";
import { getUserInvestments } from "@/lib/userInvestments";
import { toast } from "sonner";
import { Leaderboard } from "@/components/Leaderboard";

interface DirectReferral {
  address: string;
  level: string;
  directPush: { current: number; required: number };
  personalPerformance: number;
  communityPerformance: number;
  thirtySky: number;
  totalTeamPerformance: number;
  totalTeamMembers: number;
}

interface TeamPerformance {
  marketLevel: string;
  teamNode: number;
  personalPerformance: number;
  regionalPerformance: number;
  communityPerformance: number;
  thirtySky: number;
  totalTeamPerformance: number;
  totalTeamMembers: number;
}

const Community = () => {
  const { address, isConnected } = useAccount();
  const { t } = useLanguage();
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance>({
    marketLevel: "W S0",
    teamNode: 0,
    personalPerformance: 0,
    regionalPerformance: 0,
    communityPerformance: 0,
    thirtySky: 0,
    totalTeamPerformance: 0,
    totalTeamMembers: 0,
  });
  const [directReferrals, setDirectReferrals] = useState<DirectReferral[]>([]);
  const [referredUsers, setReferredUsers] = useState<Array<{ wallet: string; joinedAt: number }>>([]);
  const [isLoadingReferred, setIsLoadingReferred] = useState(false);
  const [referralActivities, setReferralActivities] = useState<ReferralActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
  // 실시간 로딩 상태
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => {
      setCopied({ ...copied, [key]: false });
    }, 2000);
  };

  /**
   * Firebase Referrals 에서 실시간 팀 데이터 로드
   * localStorage 의존 제거 → 팟이 마운트/주소 변경 시에도 항상 정확한 데이터 표시
   */
  const loadTeamData = useCallback(async () => {
    if (!address) return;
    setIsLoadingTeam(true);
    setIsLoadingReferred(true);
    setIsLoadingActivities(true);
    try {
      const normalizedAddress = address.toLowerCase();

      // Firebase에서 직접 추청 연동 사용자 목록 + 활동 동시 요청
      const [referrals, activities] = await Promise.all([
        getReferralsByReferrer(normalizedAddress),
        getReferralActivitiesByReferrer(normalizedAddress),
      ]);

      const users = referrals.map((ref) => ({
        wallet: ref.referredWallet,
        joinedAt: ref.createdAt,
      }));
      setReferredUsers(users);
      setReferralActivities(activities);

      // 각 직접 추천 사용자의 투자 데이터를 받아 팀 퍼포먼스 쪼산
      const referralInvestments = await Promise.all(
        users.map((u) => getUserInvestments(u.wallet).catch(() => []))
      );

      let totalPersonalPerformance = 0;
      const builtDirectReferrals: DirectReferral[] = users.map((user, idx) => {
        const investments = referralInvestments[idx];
        const personalPerf = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        totalPersonalPerformance += personalPerf;
        return {
          address: user.wallet,
          level: "Direct",
          directPush: { current: 0, required: 1 },
          personalPerformance: personalPerf,
          communityPerformance: 0,
          thirtySky: 0,
          totalTeamPerformance: personalPerf,
          totalTeamMembers: 1,
        };
      });

      setDirectReferrals(builtDirectReferrals);
      setTeamPerformance((prev) => ({
        ...prev,
        teamNode: users.length,
        totalTeamMembers: users.length,
        totalTeamPerformance: totalPersonalPerformance,
      }));
    } catch (error) {
      console.error("Failed to load team data from Firebase:", error);
      setReferredUsers([]);
      setReferralActivities([]);
    } finally {
      setIsLoadingTeam(false);
      setIsLoadingReferred(false);
      setIsLoadingActivities(false);
    }
  }, [address]);

  useEffect(() => {
    if (!isConnected || !address) return;
    loadTeamData();
  }, [address, isConnected, loadTeamData]);

  if (!isConnected || !address) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20 sm:pt-24 lg:pt-32 pb-12 sm:pb-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="p-6 sm:p-8 text-center">
              <p className="text-muted-foreground">{t.profile.connectWallet}</p>
            </Card>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 sm:pt-24 lg:pt-32 pb-12 sm:pb-20 px-4">
          <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{t.community.title}</h1>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-card border border-border rounded-lg">
            <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
            <span className="text-xs sm:text-sm font-mono text-foreground">{formatAddress(address)}</span>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="mb-6 sm:mb-8">
          <Leaderboard />
        </div>

        {/* Overall Team Performance */}
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">
            {t.community.overallTeamPerformance}
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">{t.community.marketLevel}</span>
              <span className="text-foreground font-medium">{teamPerformance.marketLevel}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">{t.community.teamNode}</span>
              <span className="text-foreground font-medium">{teamPerformance.teamNode}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">{t.community.personalPerformance}</span>
              <span className="text-foreground font-medium">${teamPerformance.personalPerformance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">{t.community.regionalPerformance}</span>
              <span className="text-foreground font-medium">${teamPerformance.regionalPerformance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">
                {t.community.communityPerformance} / {t.community.thirtySky}
              </span>
              <span className="text-foreground font-medium">
                ${teamPerformance.communityPerformance.toFixed(2)} / ${teamPerformance.thirtySky.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">{t.community.totalTeamPerformance}</span>
              <span className="text-foreground font-medium">${teamPerformance.totalTeamPerformance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">{t.community.totalTeamMembers}</span>
              <span className="text-foreground font-medium">{teamPerformance.totalTeamMembers}</span>
            </div>
          </div>
        </Card>

        {/* My Share Section */}
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">
            {t.community.myShare}
          </h2>
          {directReferrals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t.community.noDirectReferrals}</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {directReferrals.map((referral, index) => (
                <div key={index} className="border border-border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
                  {/* Referral Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                    <span className="text-foreground font-medium font-mono text-xs sm:text-sm">
                      {formatAddress(referral.address)}
                    </span>
                    <span className="text-muted-foreground text-xs sm:text-sm">{referral.level}</span>
                  </div>

                  {/* Referral Details */}
                  <div className="space-y-2 pl-4 border-l-2 border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">{t.community.numberOfDirectPush}</span>
                      <span className="text-foreground font-medium text-sm">
                        {referral.directPush.current}/{referral.directPush.required}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">{t.community.personalPerformance}</span>
                      <span className="text-foreground font-medium text-sm">
                        ${referral.personalPerformance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">
                        {t.community.communityPerformance} / {t.community.thirtySky}
                      </span>
                      <span className="text-foreground font-medium text-sm">
                        ${referral.communityPerformance.toFixed(2)} / ${referral.thirtySky.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">{t.community.totalTeamPerformance}</span>
                      <span className="text-foreground font-medium text-sm">
                        ${referral.totalTeamPerformance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">{t.community.totalNumberOfTeamMembers}</span>
                      <span className="text-foreground font-medium text-sm">
                        {referral.totalTeamMembers}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Referred Users Section */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  My Referred Users
                </CardTitle>
                <CardDescription>
                  Users who joined using your referral link ({referredUsers.length})
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => loadTeamData()}
                disabled={isLoadingReferred || isLoadingTeam || !address}
                className="shrink-0 h-8 w-8 sm:h-10 sm:w-10"
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${(isLoadingReferred || isLoadingTeam) ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingReferred ? (
              <div className="text-center py-8">
                <RefreshCw className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50 animate-spin" />
                <p className="text-muted-foreground">Loading referred users...</p>
              </div>
            ) : referredUsers.length > 0 ? (
              <div className="space-y-4">
                {referredUsers.map((user, index) => {
                  // Get activities for this user
                  const userActivities = referralActivities.filter(
                    activity => activity.referredWallet.toLowerCase() === user.wallet.toLowerCase()
                  );
                  
                  return (
                    <div
                      key={index}
                      className="card-metallic rounded-xl p-4 border-2 border-border/50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-sm text-foreground truncate">
                              {user.wallet}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Joined: {new Date(user.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            handleCopy(user.wallet, `user-${index}`);
                          }}
                          className="shrink-0 h-7 w-7 sm:h-8 sm:w-8"
                        >
                          {copied[`user-${index}`] ? (
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                        </Button>
                      </div>
                      
                      {/* User Activities */}
                      {userActivities.length > 0 ? (
                        <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Activities:</p>
                          {userActivities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span className="text-primary mt-0.5">•</span>
                              <div className="flex-1 min-w-0">
                                {activity.activityType === "plan_added_to_cart" && (
                                  <span>
                                    Added plan <span className="font-semibold text-foreground">{activity.planName || activity.planId}</span> to cart
                                  </span>
                                )}
                                {activity.activityType === "plan_invested" && (
                                  <span>
                                    Invested {activity.amount ? `${activity.amount} USDT` : ""} in plan <span className="font-semibold text-foreground">{activity.planName || activity.planId}</span>
                                  </span>
                                )}
                                {activity.activityType === "node_purchased" && (
                                  <span>
                                    Purchased node <span className="font-semibold text-foreground">{activity.nodeName || `Node ${activity.nodeId}`}</span>
                                    {activity.nodePrice && ` (${activity.nodePrice} USDT)`}
                                  </span>
                                )}
                                <span className="text-[10px] text-muted-foreground/70 ml-1">
                                  {new Date(activity.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 pt-3 border-t border-border/30">
                          <p className="text-xs text-muted-foreground">No activities yet</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Share2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No referred users yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Share your referral link to invite others
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Community;


