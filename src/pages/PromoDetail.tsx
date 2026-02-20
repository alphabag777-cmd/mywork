/**
 * PromoDetail.tsx — BBAG 개별 프로젝트 집중 홍보 상세 페이지
 *
 * URL: /promo/:planId?ref=<walletAddress>
 * - Firebase에서 planId로 플랜 상세 로드
 * - 레퍼럴 주소(ref=) 자동 캡처 → 투자 버튼 클릭 시 메인 앱 이동
 * - 지갑 미연결 상태도 열람 가능
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAccount } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { getPlanById, InvestmentPlan } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Shield,
  Globe,
  ExternalLink,
  Copy,
  CheckCheck,
  Star,
  BarChart3,
  Clock,
  Layers,
  AlertTriangle,
  Youtube,
  Send,
  Twitter,
  Sparkles,
  Info,
  Wallet,
} from "lucide-react";
import Header from "@/components/Header";
import { toast } from "sonner";

/* ── 리스크 색상 ─────────────────────────────────────────────── */
const riskColor = (r?: string) =>
  r === "Low" ? "text-green-500 bg-green-500/10 border-green-500/30"
  : r === "High" ? "text-red-500 bg-red-500/10 border-red-500/30"
  : "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";

/* ── 클립보드 복사 ───────────────────────────────────────────── */
async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { return false; }
}

/* ────────────────────────────────────────────────────────────── */
export default function PromoDetail() {
  const { planId } = useParams<{ planId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();

  const [plan, setPlan] = useState<InvestmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  /* ref= 파라미터에서 레퍼럴 주소 추출 */
  const refAddress = searchParams.get("ref") || "";

  /* 플랜 로드 */
  useEffect(() => {
    if (!planId) return;
    setLoading(true);
    getPlanById(planId)
      .then((p) => setPlan(p ?? null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [planId]);

  /* 투자 페이지로 이동 (레퍼럴 포함) */
  const handleInvest = () => {
    if (!isConnected) { open(); return; }
    const params = new URLSearchParams({ plan: planId ?? "" });
    if (refAddress) params.set("referral", refAddress);
    navigate(`/investment?${params.toString()}`);
  };

  /* 공유 링크 */
  const shareUrl = `${window.location.origin}/promo/${planId}${address ? `?ref=${address}` : ""}`;
  const handleCopyShare = async () => {
    if (await copyText(shareUrl)) {
      setCopied(true);
      toast.success("홍보 링크가 복사되었습니다!", { description: "지인에게 공유하면 레퍼럴 보상을 받을 수 있어요." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /* 상세 이미지 배열 정규화 */
  const detailImages: { url: string; caption?: string }[] = (() => {
    if (!plan?.detailImages) return [];
    return (plan.detailImages as any[]).map((img) =>
      typeof img === "string" ? { url: img } : img
    );
  })();

  /* ── 로딩 스켈레톤 ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-28 pb-20 max-w-4xl space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="grid sm:grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  /* ── 플랜 없음 ─────────────────────────────────────────────── */
  if (!plan) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-28 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">프로젝트를 찾을 수 없습니다.</p>
          <Button variant="outline" onClick={() => navigate("/promo")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> 홍보 페이지로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 pt-28 pb-24 max-w-4xl space-y-8">

        {/* ── 뒤로가기 ─────────────────────────────────────────── */}
        <button
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => navigate("/promo")}
        >
          <ArrowLeft className="w-4 h-4" />
          모든 프로젝트 보기
        </button>

        {/* ── 헤더 카드 ─────────────────────────────────────────── */}
        <Card className="relative overflow-hidden border-primary/20 shadow-xl">
          {/* 배경 그라디언트 */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-yellow-400/5 pointer-events-none" />
          <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-primary to-yellow-300" />

          <CardContent className="p-6 md:p-8 relative z-10">
            <div className="flex flex-col sm:flex-row gap-6 items-start">

              {/* 로고 */}
              <div className="flex-shrink-0">
                {plan.logo ? (
                  <img
                    src={plan.logo}
                    alt={plan.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-border/60 shadow-lg"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <BarChart3 className="w-10 h-10 text-primary" />
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge className="bg-yellow-400/20 text-yellow-500 border-yellow-400/40 border text-xs">
                    <Star className="w-3 h-3 mr-1 fill-yellow-400" /> BBAG
                  </Badge>
                  {plan.status && (
                    <Badge variant="outline" className="text-xs">{plan.status}</Badge>
                  )}
                  {plan.riskLevel && (
                    <Badge variant="outline" className={`text-xs ${riskColor(plan.riskLevel)}`}>
                      Risk: {plan.riskLevel}
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold mb-1 leading-tight">{plan.name}</h1>
                <p className="text-muted-foreground text-sm mb-3">{plan.label}</p>

                {plan.focus && (
                  <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">{plan.focus}</p>
                )}
              </div>

              {/* 일일 수익률 하이라이트 */}
              <div className="flex-shrink-0 text-center bg-green-500/10 border border-green-500/20 rounded-2xl px-6 py-4 min-w-[120px]">
                <p className="text-xs text-muted-foreground mb-1">일일 수익률</p>
                <p className="text-3xl font-extrabold text-green-400 leading-none">{plan.dailyProfit}</p>
                <p className="text-[10px] text-muted-foreground mt-1">매일 지급</p>
              </div>
            </div>

            {/* 태그 */}
            {plan.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {plan.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── 핵심 지표 그리드 ──────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <TrendingUp className="w-4 h-4" />, label: "일일 수익률", value: plan.dailyProfit, color: "text-green-400" },
            { icon: <Clock className="w-4 h-4" />, label: "락업 기간", value: plan.lockupPeriod || "-" },
            { icon: <Wallet className="w-4 h-4" />, label: "최소 투자", value: plan.minInvestment || "-" },
            { icon: <Globe className="w-4 h-4" />, label: "네트워크", value: plan.network || "BSC" },
          ].map((item) => (
            <Card key={item.label} className="border-border/50">
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <span className={`${item.color || "text-primary"}`}>{item.icon}</span>
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
                <span className={`text-sm font-bold ${item.color || ""}`}>{item.value}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── 상세 설명 ─────────────────────────────────────────── */}
        {(plan.detailDescription || plan.description) && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                프로젝트 상세 설명
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                {plan.detailDescription || plan.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── 하이라이트 카드 ───────────────────────────────────── */}
        {plan.highlights && plan.highlights.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              핵심 지표
            </h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {plan.highlights.map((h, i) => (
                <Card key={i} className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-1">{h.icon}</div>
                    <p className="text-xs text-muted-foreground mb-1">{h.title}</p>
                    <p className="text-base font-bold">{h.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── 상세 이미지 갤러리 ────────────────────────────────── */}
        {detailImages.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              프로젝트 자료
            </h2>
            <div className="relative">
              <img
                src={detailImages[activeImg].url}
                alt={detailImages[activeImg].caption || `이미지 ${activeImg + 1}`}
                className="w-full rounded-xl object-cover max-h-80 border border-border/40"
              />
              {detailImages[activeImg].caption && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  {detailImages[activeImg].caption}
                </p>
              )}
              {detailImages.length > 1 && (
                <div className="flex gap-2 justify-center mt-3">
                  {detailImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === activeImg ? "bg-primary" : "bg-border"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 추가 정보 ─────────────────────────────────────────── */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              투자 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
              {[
                { label: "투자 기간",   value: plan.investmentPeriod },
                { label: "수익 지급 주기", value: plan.profitCycle },
                { label: "수수료",      value: plan.feeInfo },
                { label: "토큰 심볼",   value: plan.tokenSymbol },
                { label: "컨트랙트",    value: plan.contractAddress },
                { label: "감사 정보",   value: plan.auditInfo },
                { label: "총 모집 한도", value: plan.totalCapacity },
                { label: "참여자 수",   value: plan.currentParticipants },
              ]
                .filter(row => !!row.value)
                .map(row => (
                  <div key={row.label} className="flex justify-between items-start gap-4 py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground flex-shrink-0">{row.label}</span>
                    <span className="font-medium text-right break-all">
                      {row.label === "컨트랙트" && row.value ? (
                        <a
                          href={`https://bscscan.com/token/${row.value}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 justify-end"
                          onClick={e => e.stopPropagation()}
                        >
                          {row.value.slice(0, 8)}…{row.value.slice(-6)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : row.value}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* ── 주의사항 ─────────────────────────────────────────── */}
        {plan.noticeText && (
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-300/90 leading-relaxed whitespace-pre-line">
                {plan.noticeText}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── 소셜 링크 ─────────────────────────────────────────── */}
        {(plan.youtubeUrl || plan.telegram || plan.twitter || plan.dappUrl) && (
          <div className="flex flex-wrap gap-2">
            {plan.dappUrl && (
              <Button size="sm" variant="outline" className="gap-2" asChild>
                <a href={plan.dappUrl} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4" /> 공식 사이트
                </a>
              </Button>
            )}
            {plan.youtubeUrl && (
              <Button size="sm" variant="outline" className="gap-2" asChild>
                <a href={plan.youtubeUrl} target="_blank" rel="noopener noreferrer">
                  <Youtube className="w-4 h-4" /> YouTube
                </a>
              </Button>
            )}
            {plan.telegram && (
              <Button size="sm" variant="outline" className="gap-2" asChild>
                <a href={plan.telegram} target="_blank" rel="noopener noreferrer">
                  <Send className="w-4 h-4" /> Telegram
                </a>
              </Button>
            )}
            {plan.twitter && (
              <Button size="sm" variant="outline" className="gap-2" asChild>
                <a href={plan.twitter} target="_blank" rel="noopener noreferrer">
                  <Twitter className="w-4 h-4" /> X / Twitter
                </a>
              </Button>
            )}
          </div>
        )}

        <Separator />

        {/* ── 공유 + 투자 CTA ──────────────────────────────────── */}
        <div className="sticky bottom-20 md:bottom-6 z-40">
          <Card className="border-primary/30 bg-background/95 backdrop-blur-xl shadow-2xl shadow-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                {/* 공유 버튼 */}
                <Button
                  variant="outline"
                  className="gap-2 flex-1 sm:flex-none sm:w-auto"
                  onClick={handleCopyShare}
                >
                  {copied ? (
                    <><CheckCheck className="w-4 h-4 text-green-500" /> 복사됨!</>
                  ) : (
                    <><Copy className="w-4 h-4" /> 홍보 링크 복사</>
                  )}
                </Button>

                {/* 투자하기 */}
                <Button
                  className="flex-1 gap-2 bg-gradient-to-r from-yellow-500 to-primary hover:opacity-90 shadow-lg shadow-primary/25 text-base font-semibold h-11"
                  onClick={handleInvest}
                >
                  {isConnected ? (
                    <><ArrowRight className="w-5 h-5" /> 지금 투자하기</>
                  ) : (
                    <><Wallet className="w-5 h-5" /> 지갑 연결 후 투자</>
                  )}
                </Button>
              </div>

              {/* 레퍼럴 안내 */}
              {address && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  이 링크로 공유하면{" "}
                  <span className="text-primary font-medium">{address.slice(0, 6)}…{address.slice(-4)}</span>
                  님의 레퍼럴 보상이 적립됩니다
                </p>
              )}
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
