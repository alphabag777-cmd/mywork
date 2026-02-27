import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getAllPlans } from "@/lib/plans";
import { wasReferred } from "@/lib/referral";
import { translateContent } from "@/lib/translator";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ExternalLink, ChevronLeft, AlertTriangle, Globe, Coins, Lock,
  DollarSign, Clock, RefreshCw, Percent, FileText, ShieldCheck,
  Users, BarChart3, Eye, Download, BookOpen, Share2, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import Header from "@/components/Header";

/* ────────────────────────────────────────────────────────── */
/*  SpecChip                                                   */
/* ────────────────────────────────────────────────────────── */
function SpecChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted/40 border border-border/50">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  RiskBadge                                                  */
/* ────────────────────────────────────────────────────────── */
function RiskBadge({ level }: { level: "Low" | "Medium" | "High" }) {
  const map = {
    Low:    { color: "bg-green-100 text-green-700 border-green-200",  label: "🟢 Low Risk" },
    Medium: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "🟡 Medium Risk" },
    High:   { color: "bg-red-100 text-red-700 border-red-200",    label: "🔴 High Risk" },
  };
  const { color, label } = map[level];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {label}
    </span>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  HighlightCards                                             */
/* ────────────────────────────────────────────────────────── */
function HighlightCards({ highlights }: { highlights: Array<{ icon?: string; title: string; value: string }> }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {highlights.map((h, i) => (
        <div key={i} className="p-3 rounded-xl bg-primary/5 border border-primary/20">
          <div className="text-lg mb-1">{h.icon || "📊"}</div>
          <div className="text-xs text-muted-foreground">{h.title}</div>
          <div className="text-sm font-bold text-foreground">{h.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  normalizeImages                                            */
/* ────────────────────────────────────────────────────────── */
function normalizeImages(
  imgs: Array<{ url: string; caption?: string }> | string[] | undefined
): Array<{ url: string; caption: string }> {
  if (!imgs || imgs.length === 0) return [];
  return imgs.map((img) => {
    if (typeof img === "string") return { url: img, caption: "" };
    return { url: (img as any).url || "", caption: (img as any).caption || "" };
  });
}

/* ────────────────────────────────────────────────────────── */
/*  PlanDetail Page                                            */
/* ────────────────────────────────────────────────────────── */
export default function PlanDetail() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { t, language } = useLanguage();

  const [plan, setPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // 번역 상태
  const [txDescription, setTxDescription] = useState("");
  const [txFocus, setTxFocus] = useState("");
  const [txDetailDescription, setTxDetailDescription] = useState("");
  const [txAuditInfo, setTxAuditInfo] = useState("");
  const [txQuickActionsDesc, setTxQuickActionsDesc] = useState("");
  const [txHighlights, setTxHighlights] = useState<Array<{ title: string; value: string; icon?: string }>>([]);
  const [txNoticeText, setTxNoticeText] = useState("");

  // 모달 상태
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [copied, setCopied] = useState(false);

  /* ── 플랜 로드 ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const plans = await getAllPlans();
        const found = plans.find((p) => p.id === planId);
        if (cancelled) return;
        if (!found) { setNotFound(true); }
        else { setPlan(found); }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [planId]);

  /* ── 번역 ── */
  useEffect(() => {
    if (!plan) return;
    let cancelled = false;

    const lcKey = (language === "ko" ? "ko" : language === "en" ? "en" : language === "zh" ? "zh" : language === "ja" ? "ja" : null) as "ko" | "en" | "zh" | "ja" | null;
    const lcData = lcKey ? (plan.langContent?.[lcKey] ?? null) : null;

    // ── langContent에 설정된 값은 즉시(동기) 적용 ──
    if (lcData?.description)        setTxDescription(lcData.description);
    if (lcData?.detailDescription)  setTxDetailDescription(lcData.detailDescription);

    const run = async () => {
      // langContent에 없는 필드만 번역 API 호출
      const [desc, focus, detail, audit, qaDesc, notice] = await Promise.all([
        lcData?.description        ? Promise.resolve(lcData.description)        : translateContent(plan.description || "", language),
        translateContent(plan.focus || "", language),
        lcData?.detailDescription  ? Promise.resolve(lcData.detailDescription)  : translateContent(plan.detailDescription || "", language),
        translateContent(plan.auditInfo || "", language),
        translateContent(plan.quickActionsDescription || "", language),
        translateContent(plan.noticeText || "", language),
      ]);
      if (cancelled) return;
      setTxDescription(desc);
      setTxFocus(focus);
      setTxDetailDescription(detail);
      setTxAuditInfo(audit);
      setTxQuickActionsDesc(qaDesc);
      setTxNoticeText(notice);

      if (plan.highlights && plan.highlights.length > 0) {
        const txd = await Promise.all(
          plan.highlights.map(async (h: any) => ({
            ...h,
            title: await translateContent(h.title || "", language),
            value: await translateContent(h.value || "", language),
          }))
        );
        if (!cancelled) setTxHighlights(txd);
      } else {
        setTxHighlights([]);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [language, plan]);

  /* ── 언어별 콘텐츠 ── */
  const langKey = useMemo(
    () => (language === "ko" ? "ko" : language === "en" ? "en" : language === "zh" ? "zh" : language === "ja" ? "ja" : null) as "ko" | "en" | "zh" | "ja" | null,
    [language]
  );
  const lc = useMemo(() => (langKey ? (plan?.langContent?.[langKey] ?? null) : null), [langKey, plan]);

  const activePdfFiles = useMemo(
    () => (lc?.pdfFiles && lc.pdfFiles.length > 0 ? lc.pdfFiles : plan?.pdfFiles ?? []),
    [lc, plan]
  );
  const activeMaterials = useMemo(
    () => (lc?.materials && lc.materials.length > 0 ? lc.materials : plan?.materials ?? []),
    [lc, plan]
  );
  const activeLangYoutubeList = useMemo((): Array<{ url: string; title: string }> => {
    if (lc?.youtubeUrls && lc.youtubeUrls.length > 0) return lc.youtubeUrls;
    if (plan?.youtubeUrls && plan.youtubeUrls.length > 0) return plan.youtubeUrls;
    if (plan?.youtubeUrl) return [{ url: plan.youtubeUrl, title: "" }];
    return [];
  }, [lc, plan]);
  const normalizedImages = useMemo(
    () => (lc?.detailImages && lc.detailImages.length > 0 ? lc.detailImages : normalizeImages(plan?.detailImages)),
    [lc, plan]
  );

  /* ── YouTube embed ── */
  const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    if (url.includes("youtube.com/embed/")) return url;
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    return null;
  };
  const youtubeEmbedList = activeLangYoutubeList
    .map((item) => ({ ...item, embedUrl: getYoutubeEmbedUrl(item.url) }))
    .filter((item) => !!item.embedUrl);

  /* ── 참여 준비 ── */
  const addToInvestmentList = useCallback(() => {
    if (!address || !plan) return;
    const key = `investment_list_${address}`;
    let list: Array<{ id: string; name: string }> = [];
    try { list = JSON.parse(localStorage.getItem(key) || "[]"); } catch {}
    if (!list.some((i) => i.id === plan.id)) {
      list.push({ id: plan.id, name: plan.name });
      localStorage.setItem(key, JSON.stringify(list));
      toast.success(t.staking.projectAddedToList);
    } else {
      toast.info(t.staking.projectAddedToListDesc);
    }
  }, [address, plan, t]);

  const handlePrepareParticipation = () => {
    if (!isConnected || !address) { toast.error(t.staking.pleaseConnectWallet); return; }
    if (!wasReferred()) { setReferralDialogOpen(true); } else { addToInvestmentList(); }
  };

  const handleRegisterReferralCode = () => {
    if (!referralCodeInput.trim()) { toast.error("추천 코드를 입력해주세요"); return; }
    if (address) {
      const KEY = "alphabag_referrer_code";
      if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, referralCodeInput.trim());
      addToInvestmentList();
      setReferralDialogOpen(false);
      setReferralCodeInput("");
      toast.success("추천 코드가 등록되었습니다");
    }
  };

  /* ── 공유 링크 복사 ── */
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      toast.success("링크가 복사되었습니다");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("복사에 실패했습니다");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: plan?.name || "플랜 상세 정보",
          text: plan?.description || "",
          url: pageUrl,
        });
      } catch { /* 취소 */ }
    } else {
      handleCopyLink();
    }
  };

  /* ── 컨트랙트 주소 단축 ── */
  const shortContract = (addr: string) =>
    addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

  const hasSpecChips =
    plan?.network || plan?.tokenSymbol || plan?.lockupPeriod || plan?.minInvestment ||
    plan?.investmentPeriod || plan?.profitCycle || plan?.feeInfo;

  /* ────────── 렌더링 ────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !plan) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <p className="text-2xl font-bold text-foreground">플랜을 찾을 수 없습니다</p>
            <p className="text-muted-foreground">요청한 플랜 ID가 존재하지 않거나 삭제되었습니다.</p>
            <Button variant="gold" onClick={() => navigate("/")}>홈으로 돌아가기</Button>
          </div>
        </div>
      </div>
    );
  }

  const activeBlogLinks = (lc?.blogLinks && lc.blogLinks.length > 0)
    ? lc.blogLinks
    : (plan?.blogLinks ?? []);

  const typeEmoji = (type?: string) => {
    const map: Record<string, string> = {
      blog: "📝", medium: "📖", github: "🐙", linkedin: "💼",
      facebook: "📘", instagram: "📸", discord: "💬", reddit: "🔴", news: "📰", other: "🔗",
    };
    return map[type || "other"] || "🔗";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-20">
        {/* ── 상단 네비게이션 ── */}
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            뒤로 가기
          </button>

          {/* 공유 버튼 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors"
              title="링크 복사"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "복사됨" : "링크 복사"}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors"
              title="공유하기"
            >
              <Share2 className="w-3.5 h-3.5" />
              공유
            </button>
          </div>
        </div>

        {/* ── 주의사항 배너 ── */}
        {txNoticeText && (
          <div className="flex gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 mb-6">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed whitespace-pre-line">{txNoticeText}</p>
          </div>
        )}

        {/* ── 2컬럼 레이아웃 ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">

          {/* ── 왼쪽: 프로젝트 정보 ── */}
          <div className="space-y-5">
            {/* 배지 */}
            <div className="flex flex-wrap gap-2">
              <div className="bg-secondary/50 border border-border rounded-full px-3 py-1 text-xs text-muted-foreground inline-flex items-center gap-1">
                <span className="font-semibold text-primary">{t.staking.binanceAlpha}</span>
                <span>•</span>
                <span>{t.staking.insuranceHedge} • {t.staking.chooseLikeCart}</span>
              </div>
              <div className="bg-primary/20 border border-primary/50 rounded-full px-3 py-1 inline-flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-xs font-semibold text-primary">{t.staking.dailyProfit}: {plan.dailyProfit || "N/A"}</span>
              </div>
              {plan.riskLevel && <RiskBadge level={plan.riskLevel} />}
            </div>

            {/* 프로젝트명 */}
            <div>
              <h2 className="text-xl font-display font-bold text-foreground mb-1">{t.projectDetails.title}</h2>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground break-words">{plan.name}</h3>
              {plan.focus && <p className="text-sm text-muted-foreground mt-1">{txFocus}</p>}
            </div>

            {/* 스펙 칩 */}
            {hasSpecChips && (
              <div className="flex flex-wrap gap-2">
                {plan.network && <SpecChip icon={<Globe className="w-3.5 h-3.5" />} label="Network" value={plan.network} />}
                {plan.tokenSymbol && <SpecChip icon={<Coins className="w-3.5 h-3.5" />} label="Token" value={plan.tokenSymbol} />}
                {plan.lockupPeriod && <SpecChip icon={<Lock className="w-3.5 h-3.5" />} label="Lockup" value={plan.lockupPeriod} />}
                {plan.minInvestment && <SpecChip icon={<DollarSign className="w-3.5 h-3.5" />} label="Min." value={plan.minInvestment} />}
                {plan.investmentPeriod && <SpecChip icon={<Clock className="w-3.5 h-3.5" />} label="Period" value={plan.investmentPeriod} />}
                {plan.profitCycle && <SpecChip icon={<RefreshCw className="w-3.5 h-3.5" />} label="Payout" value={plan.profitCycle} />}
                {plan.feeInfo && <SpecChip icon={<Percent className="w-3.5 h-3.5" />} label="Fee" value={plan.feeInfo} />}
              </div>
            )}

            {/* 총 모집 / 참여자 */}
            {(plan.totalCapacity || plan.currentParticipants) && (
              <div className="flex flex-wrap gap-2">
                {plan.totalCapacity && (
                  <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted/40 border border-border/50">
                    <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">총 한도:</span>
                    <span className="font-semibold">{plan.totalCapacity}</span>
                  </div>
                )}
                {plan.currentParticipants && (
                  <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted/40 border border-border/50">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">참여자:</span>
                    <span className="font-semibold">{plan.currentParticipants}</span>
                  </div>
                )}
              </div>
            )}

            {/* 컨트랙트 주소 */}
            {plan.contractAddress && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground">Contract:</span>
                <code className="text-xs font-mono text-foreground flex-1 truncate">{shortContract(plan.contractAddress)}</code>
                <a
                  href={`https://bscscan.com/address/${plan.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 flex-shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* 감사(Audit) 정보 */}
            {txAuditInfo && (
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">{t.projectDetails.auditInfo ?? "감사(Audit) 정보"}</span>
                </div>
                <div className="space-y-1.5">
                  {txAuditInfo.split("\n").map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;
                    const isNumbered = /^\d+\./.test(trimmed);
                    return (
                      <div key={i} className={`text-xs text-green-800 dark:text-green-300 leading-relaxed ${isNumbered ? "flex gap-1.5" : ""}`}>
                        {isNumbered ? (
                          <>
                            <span className="font-bold flex-shrink-0">{trimmed.match(/^\d+\./)?.[0]}</span>
                            <span>{trimmed.replace(/^\d+\.\s*/, "")}</span>
                          </>
                        ) : (
                          <span>{trimmed}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 간략 설명 */}
            <p className="text-sm text-muted-foreground leading-relaxed">{txDescription}</p>

            {/* 이미지 갤러리 */}
            {normalizedImages.length > 0 && (
              <div className="space-y-3">
                {normalizedImages.map((img: any, i: number) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-border/50">
                    <img src={img.url} alt={img.caption || `Image ${i + 1}`} className="w-full object-cover" />
                    {img.caption && <p className="text-xs text-muted-foreground p-2 bg-muted/30">{img.caption}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── 오른쪽: 상세 정보 + Quick Actions ── */}
          <div className="space-y-5">
            {/* YouTube 영상 */}
            {youtubeEmbedList.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <span className="text-red-500">▶</span> {t.projectDetails.youtubeVideo ?? "YouTube 영상"}
                  {youtubeEmbedList.length > 1 && (
                    <span className="text-xs font-normal text-muted-foreground">({youtubeEmbedList.length}개)</span>
                  )}
                </h4>
                {youtubeEmbedList.map((item, idx) => (
                  <div key={idx}>
                    {item.title && (
                      <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                        <span className="text-red-400">▶</span> {item.title}
                      </p>
                    )}
                    <div className="relative w-full rounded-xl overflow-hidden border border-border/50" style={{ paddingBottom: "56.25%" }}>
                      <iframe
                        src={item.embedUrl!}
                        title={item.title || `YouTube ${idx + 1}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 하이라이트 카드 */}
            {txHighlights.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">📊 {t.projectDetails.keyMetrics ?? "핵심 지표"}</h4>
                <HighlightCards highlights={txHighlights} />
              </div>
            )}

            {/* 상세 설명 */}
            {txDetailDescription && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <h4 className="text-sm font-semibold mb-2">📋 {t.projectDetails.detailInfo ?? "상세 정보"}</h4>
                {txDetailDescription.trim().startsWith("<") ? (
                  <div
                    className="text-sm text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(txDetailDescription) }}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{txDetailDescription}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {/* PDF 첨부 파일 */}
            {activePdfFiles.length > 0 && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-red-500" /> 📄 첨부 자료 ({activePdfFiles.length}개)
                </h4>
                <div className="space-y-2">
                  {activePdfFiles.map((pdf: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-background/60 border border-border/40 hover:border-primary/40 transition-colors">
                      <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-foreground flex-1 truncate">{pdf.title || `문서 ${i + 1}`}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => window.open(pdf.url, "_blank", "noopener,noreferrer")}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> 보기
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await fetch(pdf.url);
                              if (!res.ok) throw new Error();
                              const blob = await res.blob();
                              const blobUrl = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = blobUrl; a.download = (pdf.title || `문서_${i + 1}`) + ".pdf";
                              a.style.display = "none"; document.body.appendChild(a); a.click();
                              setTimeout(() => { try { document.body.removeChild(a); } catch {} URL.revokeObjectURL(blobUrl); }, 100);
                            } catch { window.open(pdf.url, "_blank", "noopener,noreferrer"); }
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors font-medium cursor-pointer"
                        >
                          <Download className="w-3 h-3" /> 저장
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-display font-bold text-foreground mb-1">{t.projectDetails.quickActions}</h3>
              <p className="text-sm text-muted-foreground mb-4">{txQuickActionsDesc}</p>
              <div className="space-y-3">
                {plan.dappUrl && (
                  <Button
                    variant="gold"
                    className="w-full gap-2"
                    onClick={() => {
                      const url = /^https?:\/\//i.test(plan.dappUrl) ? plan.dappUrl : "https://" + plan.dappUrl;
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t.staking.goToWebsite}
                  </Button>
                )}
                <Button variant="gold" className="w-full gap-2" onClick={handlePrepareParticipation}>
                  {t.staking.prepareParticipation}
                </Button>
              </div>
            </div>

            {/* 참고 자료 링크 */}
            {activeMaterials.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">🔗 {t.projectDetails.referenceMaterials ?? "참고 자료"}</h4>
                <div className="flex flex-col gap-1.5">
                  {activeMaterials.map((m: any, i: number) => (
                    <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      {m.title || m.url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 외부 URL 링크 */}
            {plan.externalLinks && plan.externalLinks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-blue-500" /> 관련 링크
                </h4>
                <div className="flex flex-col gap-1.5">
                  {plan.externalLinks.map((link: any, i: number) => (
                    <a
                      key={i}
                      href={/^https?:\/\//i.test(link.url) ? link.url : "https://" + link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline truncate"
                    >
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
                      {link.title || link.url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 블로그/SNS 링크 */}
            {activeBlogLinks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-purple-500" /> 블로그 / 미디어
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeBlogLinks.map((link: any, i: number) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors"
                    >
                      <span>{typeEmoji(link.type)}</span>
                      {link.title || link.url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* SNS 링크 */}
            {(plan.telegram || plan.telegramUrl || plan.twitter || plan.twitterUrl) && (
              <div className="flex gap-2 flex-wrap">
                {(plan.telegram || plan.telegramUrl) && (
                  <a href={plan.telegramUrl || plan.telegram} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors">
                    <span>✈️</span> Telegram
                  </a>
                )}
                {(plan.twitter || plan.twitterUrl) && (
                  <a href={plan.twitterUrl || plan.twitter} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors">
                    <span>🐦</span> Twitter / X
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 추천 코드 Dialog */}
      <Dialog open={referralDialogOpen} onOpenChange={setReferralDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.staking.referralCodeRequired}</DialogTitle>
            <DialogDescription>{t.staking.referralCodeRequiredDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">{t.staking.registerReferralCode}</label>
              <Input type="text" placeholder="추천 코드 입력" value={referralCodeInput} onChange={(e) => setReferralCodeInput(e.target.value)} className="w-full" />
            </div>
            <Button variant="gold" className="w-full" onClick={handleRegisterReferralCode}>
              {t.staking.registerReferralCode}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
