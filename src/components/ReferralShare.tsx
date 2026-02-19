/**
 * ReferralShare Component
 *
 * Displays the user's referral code + a shareable link that:
 * - Includes the user's wallet address as the referral parameter
 * - Deep-links directly to the user's selected plans (via ?plans=id1,id2,id3)
 *
 * Usage: <ReferralShare />
 */

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Share2, ExternalLink, Info } from "lucide-react";
import { toast } from "sonner";
import { getUserSelectedPlans, UserSelectedPlans } from "@/lib/userSelectedPlans";
import { getAllPlans, InvestmentPlan } from "@/lib/plans";

const ReferralShare = () => {
  const { address, isConnected } = useAccount();
  const [userSelection, setUserSelection] = useState<UserSelectedPlans | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<InvestmentPlan[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const [sel, allPlans] = await Promise.all([
          getUserSelectedPlans(address),
          getAllPlans(),
        ]);
        setUserSelection(sel);
        if (sel && sel.planIds.length > 0) {
          setSelectedPlans(allPlans.filter(p => sel.planIds.includes(p.id)));
        } else {
          setSelectedPlans([]);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [address]);

  if (!isConnected || !address) return null;

  /* ── Referral link ─────────────────────────────── */
  const base = typeof window !== "undefined" ? window.location.origin : "https://mywork-alpha.netlify.app";
  const planParam = userSelection && userSelection.planIds.length > 0
    ? `&plans=${userSelection.planIds.join(",")}`
    : "";
  const referralLink = `${base}/?referral=${address}${planParam}`;

  /* ── Copy helpers ──────────────────────────────── */
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      toast.success("레퍼럴 링크가 복사되었습니다!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("복사 실패");
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedCode(true);
      toast.success("지갑 주소가 복사되었습니다!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("복사 실패");
    }
  };

  /* ── Share via Web Share API ───────────────────── */
  const share = async () => {
    if (navigator.share) {
      try {
        const planNames = selectedPlans.map(p => p.name).join(", ");
        await navigator.share({
          title: "AlphaBag 투자상품 추천",
          text: planNames
            ? `제가 선택한 투자상품(${planNames})을 확인해보세요!`
            : "AlphaBag 투자 플랫폼에 참여해보세요!",
          url: referralLink,
        });
      } catch {
        // user cancelled or not supported — fall back to copy
        await copyLink();
      }
    } else {
      await copyLink();
    }
  };

  const hasSelection = userSelection && userSelection.planIds.length > 0;

  return (
    <Card className="mb-6 border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="w-4 h-4 text-primary" />
          레퍼럴 링크 공유
        </CardTitle>
        <CardDescription className="text-xs">
          {hasSelection
            ? `선택하신 ${userSelection!.mode === "portfolio" ? "포트폴리오" : "단일상품"}을 포함한 레퍼럴 링크입니다.`
            : "투자상품을 선택하면 해당 상품이 포함된 링크가 생성됩니다."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Selected Plans Preview */}
        {loading ? (
          <p className="text-xs text-muted-foreground">불러오는 중…</p>
        ) : hasSelection ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">선택된 상품</p>
            <div className="flex flex-wrap gap-2">
              {selectedPlans.map(p => (
                <div key={p.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background border border-border text-xs">
                  {p.logo && <img src={p.logo} alt={p.label} className="w-4 h-4 object-contain" />}
                  <span className="font-medium">{p.name}</span>
                  {userSelection?.mode === "portfolio" && (
                    <span className="text-muted-foreground">
                      ({userSelection.planIds.indexOf(p.id) === 0 ? "40%" :
                        userSelection.planIds.indexOf(p.id) === 1 ? "40%" : "20%"})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 text-xs text-yellow-700 dark:text-yellow-400">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p>아직 투자상품을 선택하지 않았습니다. 프로필 페이지에서 상품을 선택하면 해당 상품 전용 링크가 생성됩니다.</p>
          </div>
        )}

        {/* Referral Link */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">레퍼럴 링크</label>
          <div className="flex items-center gap-2">
            <Input
              value={referralLink}
              readOnly
              className="font-mono text-xs h-8"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={copyLink}
              title="링크 복사"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => window.open(referralLink, "_blank")}
              title="링크 열기"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Wallet Address (referral code) */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">내 지갑 주소 (레퍼럴 코드)</label>
          <div className="flex items-center gap-2">
            <Input
              value={address}
              readOnly
              className="font-mono text-xs h-8"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={copyAddress}
              title="주소 복사"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* Share Button */}
        <Button variant="gold" className="w-full gap-2" onClick={share}>
          <Share2 className="w-4 h-4" />
          공유하기
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReferralShare;
