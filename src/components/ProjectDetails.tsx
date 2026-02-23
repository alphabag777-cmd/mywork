import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, ChevronLeft, ChevronRight, X, AlertTriangle, Globe, Coins, Lock, DollarSign, Clock, RefreshCw, Percent, FileText, ShieldCheck, Users, BarChart3, Eye, Download } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { wasReferred } from "@/lib/referral";
import { translateContent } from "@/lib/translator";

interface ProjectDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    name: string;
    label: string;
    percentage?: number;
    dailyProfit?: string;
    focus?: string;
    description: string;
    tags?: string[];
    quickActionsDescription?: string;
    dappUrl?: string;
    youtubeUrl?: string;
    youtubeUrls?: Array<{ url: string; title: string }>;
    telegram?: string;
    telegramUrl?: string;
    twitter?: string;
    twitterUrl?: string;
    materials?: Array<{ title: string; url: string }>;
    // 세부 정보 필드
    detailImages?: Array<{ url: string; caption?: string }> | string[];
    highlights?: Array<{ icon: string; title: string; value: string }>;
    riskLevel?: "Low" | "Medium" | "High";
    network?: string;
    tokenSymbol?: string;
    lockupPeriod?: string;
    minInvestment?: string;
    detailDescription?: string;
    // 추가 세부 정보
    investmentPeriod?: string;
    profitCycle?: string;
    feeInfo?: string;
    contractAddress?: string;
    auditInfo?: string;
    totalCapacity?: string;
    currentParticipants?: string;
    noticeText?: string;
    pdfFiles?: Array<{ title: string; url: string }>;
  };
}

/* ── 이미지 데이터 정규화 ── */
function normalizeImages(imgs: Array<{ url: string; caption?: string }> | string[] | undefined): Array<{ url: string; caption: string }> {
  if (!imgs || imgs.length === 0) return [];
  return imgs.map((img) => {
    if (typeof img === "string") return { url: img, caption: "" };
    return { url: (img as any).url || "", caption: (img as any).caption || "" };
  });
}

/* ── 리스크 레벨 배지 ── */
function RiskBadge({ level }: { level: "Low" | "Medium" | "High" }) {
  const map = {
    Low:    { color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800",  label: "🟢 Low Risk" },
    Medium: { color: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800", label: "🟡 Medium Risk" },
    High:   { color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",    label: "🔴 High Risk" },
  };
  const { color, label } = map[level];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {label}
    </span>
  );
}

/* ── 이미지 갤러리 (캡션 지원) ── */
function ImageGallery({ images }: { images: Array<{ url: string; caption: string }> }) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images || images.length === 0) return null;

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <>
      <div className="space-y-2">
        {/* 메인 이미지 */}
        <div className="relative rounded-xl overflow-hidden bg-muted aspect-video cursor-pointer group" onClick={() => setLightbox(true)}>
          <img
            src={images[current].url}
            alt={images[current].caption || `detail-${current}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 text-white text-xs bg-black/50 px-2 py-1 rounded transition-opacity">
              클릭하여 확대
            </span>
          </div>
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i); }} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/50"}`} />
                ))}
              </div>
            </>
          )}
          {/* 캡션 오버레이 */}
          {images[current].caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
              <p className="text-white text-xs">{images[current].caption}</p>
            </div>
          )}
        </div>
        {/* 썸네일 */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-colors ${i === current ? "border-primary" : "border-transparent"}`}
                title={img.caption || `이미지 ${i + 1}`}
              >
                <img src={img.url} alt={img.caption || `thumb-${i}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 라이트박스 */}
      {lightbox && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => setLightbox(false)}>
            <X className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <img src={images[current].url} alt="lightbox" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            {images[current].caption && (
              <p className="text-white text-sm bg-black/50 px-3 py-1 rounded">{images[current].caption}</p>
            )}
          </div>
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

/* ── 하이라이트 카드 그리드 ── */
function HighlightCards({ highlights }: { highlights: Array<{ icon: string; title: string; value: string }> }) {
  if (!highlights || highlights.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {highlights.map((h, i) => (
        <div key={i} className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors">
          <span className="text-2xl mb-1">{h.icon}</span>
          <span className="text-[10px] text-muted-foreground leading-tight">{h.title}</span>
          <span className="text-sm font-bold text-foreground mt-0.5 leading-tight">{h.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── 스펙 칩 ── */
function SpecChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/50 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground text-xs">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════ */
/*  메인 컴포넌트                                      */
/* ══════════════════════════════════════════════════ */
const ProjectDetails = ({ open, onOpenChange, project }: ProjectDetailsProps) => {
  const { address, isConnected } = useAccount();
  const { t, language } = useLanguage();

  /* ── 동적 번역 상태 ── */
  const [txDescription, setTxDescription] = useState(project.description || "");
  const [txFocus, setTxFocus] = useState(project.focus || "");
  const [txDetailDescription, setTxDetailDescription] = useState(project.detailDescription || "");
  const [txAuditInfo, setTxAuditInfo] = useState(project.auditInfo || "");
  const [txQuickActionsDesc, setTxQuickActionsDesc] = useState(project.quickActionsDescription || "");
  const [txHighlights, setTxHighlights] = useState<Array<{title:string; value:string; icon?:string}>>(project.highlights || []);
  const [txNoticeText, setTxNoticeText] = useState(project.noticeText || "");
  const prevLangRef = useRef(language);

  useEffect(() => {
    // 언어 변경 또는 팝업 열릴 때 번역 실행
    let cancelled = false;
    const run = async () => {
      const [desc, focus, detail, audit, qaDesc, notice] = await Promise.all([
        translateContent(project.description || "", language),
        translateContent(project.focus || "", language),
        translateContent(project.detailDescription || "", language),
        translateContent(project.auditInfo || "", language),
        translateContent(project.quickActionsDescription || "", language),
        translateContent(project.noticeText || "", language),
      ]);
      if (cancelled) return;
      setTxDescription(desc);
      setTxFocus(focus);
      setTxDetailDescription(detail);
      setTxAuditInfo(audit);
      setTxQuickActionsDesc(qaDesc);
      setTxNoticeText(notice);
      // highlights 번역
      if (project.highlights && project.highlights.length > 0) {
        const txd = await Promise.all(
          project.highlights.map(async (h) => ({
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
    prevLangRef.current = language;
    return () => { cancelled = true; };
  }, [language, open, project.id]);
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState("");

  /* ── 이미지 정규화 ── */
  const normalizedImages = normalizeImages(project.detailImages);

  /* ── i18n 헬퍼: 번역된 state 반환 ── */
  const getTranslated = useCallback((field: "focus" | "description" | "quickActionsDescription") => {
    if (field === "description") return txDescription;
    if (field === "focus") return txFocus;
    if (field === "quickActionsDescription") return txQuickActionsDesc;
    return "";
  }, [txDescription, txFocus, txQuickActionsDesc]);

  const getTranslatedTag = (tag: string) => {
    const tl = tag.toLowerCase();
    if (tl === "resources") return t.projectDetails.resources;
    if (tl === "video") return t.projectDetails.video;
    if (tl === "blog") return t.projectDetails.blog;
    return tag;
  };

  const getTagLink = (tag: string, idx: number) => {
    const tl = tag.toLowerCase();
    if (idx === 0 || tl === "resources") return project.materials?.[0]?.url || "#";
    if (idx === 1 || tl === "video") return project.youtubeUrl || "#";
    if (idx === 2 || tl === "blog") return project.twitterUrl || project.twitter || project.telegramUrl || project.telegram || "#";
    return "#";
  };

  /* ── 레퍼럴 / 투자 목록 ── */
  const addToInvestmentList = useCallback(() => {
    if (!address) return;
    const key = `investment_list_${address}`;
    let list: Array<{ id: string; name: string }> = [];
    try { list = JSON.parse(localStorage.getItem(key) || "[]"); } catch {}
    if (!list.some((i) => i.id === project.id)) {
      list.push({ id: project.id, name: project.name });
      localStorage.setItem(key, JSON.stringify(list));
      toast.success(t.staking.projectAddedToList);
    } else {
      toast.info(t.staking.projectAddedToListDesc);
    }
  }, [address, project, t]);

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

  /* ── 컨트랙트 주소 단축 표시 ── */
  const shortContract = (addr: string) =>
    addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

  /* ── YouTube URL → embed URL 변환 ── */
  const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    if (url.includes('youtube.com/embed/')) return url;
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    return null;
  };

  // 다중 YouTube 영상 목록 (youtubeUrls 우선, 없으면 youtubeUrl 단일 → 배열)
  const youtubeList: Array<{ url: string; title: string }> =
    project.youtubeUrls && project.youtubeUrls.length > 0
      ? project.youtubeUrls
      : project.youtubeUrl
        ? [{ url: project.youtubeUrl, title: "" }]
        : [];
  const youtubeEmbedList = youtubeList
    .map((item) => ({ ...item, embedUrl: getYoutubeEmbedUrl(item.url) }))
    .filter((item) => !!item.embedUrl);
  // 하위 호환용 단일 URL
  const youtubeEmbedUrl = youtubeEmbedList[0]?.embedUrl ?? null;

  const hasSpecChips =
    project.network || project.tokenSymbol || project.lockupPeriod || project.minInvestment ||
    project.investmentPeriod || project.profitCycle || project.feeInfo;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">

          {/* ── 주의사항 배너 (최상단) ── */}
          {txNoticeText && (
            <div className="flex gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 mb-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed whitespace-pre-line">{txNoticeText}</p>
            </div>
          )}

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
                  <span className="text-xs font-semibold text-primary">{t.staking.dailyProfit}: {project.dailyProfit || "N/A"}</span>
                </div>
                {project.riskLevel && <RiskBadge level={project.riskLevel} />}
                {/* auditInfo는 왼쪽 패널 전용 섹션에서만 표시 — 배지 중복 제거 */}
              </div>

              {/* 프로젝트명 */}
              <div>
                <h2 className="text-xl font-display font-bold text-foreground mb-1">{t.projectDetails.title}</h2>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground break-words">
                  {project.name}
                </h3>
                {project.focus && <p className="text-sm text-muted-foreground mt-1">{getTranslated("focus")}</p>}
              </div>

              {/* 스펙 칩 (확장됨) */}
              {hasSpecChips && (
                <div className="flex flex-wrap gap-2">
                  {project.network && <SpecChip icon={<Globe className="w-3.5 h-3.5" />} label="Network" value={project.network} />}
                  {project.tokenSymbol && <SpecChip icon={<Coins className="w-3.5 h-3.5" />} label="Token" value={project.tokenSymbol} />}
                  {project.lockupPeriod && <SpecChip icon={<Lock className="w-3.5 h-3.5" />} label="Lockup" value={project.lockupPeriod} />}
                  {project.minInvestment && <SpecChip icon={<DollarSign className="w-3.5 h-3.5" />} label="Min." value={project.minInvestment} />}
                  {project.investmentPeriod && <SpecChip icon={<Clock className="w-3.5 h-3.5" />} label="Period" value={project.investmentPeriod} />}
                  {project.profitCycle && <SpecChip icon={<RefreshCw className="w-3.5 h-3.5" />} label="Payout" value={project.profitCycle} />}
                  {project.feeInfo && <SpecChip icon={<Percent className="w-3.5 h-3.5" />} label="Fee" value={project.feeInfo} />}
                </div>
              )}

              {/* 총 모집 / 참여자 */}
              {(project.totalCapacity || project.currentParticipants) && (
                <div className="flex flex-wrap gap-2">
                  {project.totalCapacity && (
                    <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted/40 border border-border/50">
                      <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">총 한도:</span>
                      <span className="font-semibold">{project.totalCapacity}</span>
                    </div>
                  )}
                  {project.currentParticipants && (
                    <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted/40 border border-border/50">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">참여자:</span>
                      <span className="font-semibold">{project.currentParticipants}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 컨트랙트 주소 */}
              {project.contractAddress && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">Contract:</span>
                  <code className="text-xs font-mono text-foreground flex-1 truncate">{shortContract(project.contractAddress)}</code>
                  <a
                    href={`https://bscscan.com/address/${project.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 flex-shrink-0"
                    title="BSCScan에서 보기"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* 감사(Audit) 정보 — 전체 내용 표시 */}
              {txAuditInfo && (
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">{t.projectDetails.auditInfo ?? "감사(Audit) 정보"}</span>
                  </div>
                  <div className="space-y-1.5">
                    {txAuditInfo.split('\n').map((line, i) => {
                      const trimmed = line.trim();
                      if (!trimmed) return null;
                      const isNumbered = /^\d+\./.test(trimmed);
                      return (
                        <div key={i} className={`text-xs text-green-800 dark:text-green-300 leading-relaxed ${isNumbered ? 'flex gap-1.5' : ''}`}>
                          {isNumbered ? (
                            <>
                              <span className="font-bold flex-shrink-0">{trimmed.match(/^\d+\./)?.[0]}</span>
                              <span>{trimmed.replace(/^\d+\.\s*/, '')}</span>
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
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getTranslated("description")}
              </p>

              {/* 태그 */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, i) => (
                    <a
                      key={i}
                      href={getTagLink(tag, i)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-secondary/50 border border-border rounded-full text-xs text-muted-foreground hover:bg-secondary/70 hover:text-foreground transition-colors"
                    >
                      {getTranslatedTag(tag)}
                    </a>
                  ))}
                </div>
              )}

              {/* 이미지 갤러리 (캡션 포함) */}
              {normalizedImages.length > 0 && (
                <ImageGallery images={normalizedImages} />
              )}
            </div>

            {/* ── 오른쪽: 세부 정보 + Quick Actions ── */}
            <div className="space-y-5">

              {/* YouTube 영상 (다중 지원) */}
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
                      <div className="relative w-full rounded-xl overflow-hidden border border-border/50" style={{paddingBottom: '56.25%'}}>
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
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {txDetailDescription}
                  </p>
                </div>
              )}

              {/* PDF 첨부 파일 목록 */}
              {project.pdfFiles && project.pdfFiles.length > 0 && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-red-500" /> 📄 첨부 자료 ({project.pdfFiles.length}개)
                  </h4>
                  <div className="space-y-2">
                    {project.pdfFiles.map((pdf, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-background/60 border border-border/40 hover:border-primary/40 transition-colors">
                        <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-foreground flex-1 truncate">{pdf.title || `문서 ${i + 1}`}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* 보기: Firebase Storage URL은 직접 열기 가능 */}
                          <button
                            type="button"
                            onClick={() => window.open(pdf.url, "_blank", "noopener,noreferrer")}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium cursor-pointer"
                          >
                            <Eye className="w-3 h-3" /> 보기
                          </button>
                          {/* 저장: fetch blob 다운로드 */}
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await fetch(pdf.url);
                                if (!res.ok) throw new Error("다운로드 실패");
                                const blob = await res.blob();
                                const blobUrl = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = blobUrl;
                                a.download = (pdf.title || `문서_${i + 1}`) + ".pdf";
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(blobUrl);
                              } catch {
                                window.open(pdf.url, "_blank", "noopener,noreferrer");
                              }
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
                <p className="text-sm text-muted-foreground mb-4">
                  {getTranslated("quickActionsDescription")}
                </p>
                <div className="space-y-3">
                  <Button
                    variant="gold"
                    className="w-full gap-2"
                    onClick={() => project.dappUrl && window.open(project.dappUrl, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t.staking.goToWebsite}
                  </Button>
                  <Button variant="gold" className="w-full gap-2" onClick={handlePrepareParticipation}>
                    {t.staking.prepareParticipation}
                  </Button>
                </div>
              </div>

              {/* 참고 자료 링크 */}
              {project.materials && project.materials.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">🔗 {t.projectDetails.referenceMaterials ?? "참고 자료"}</h4>
                  <div className="flex flex-col gap-1.5">
                    {project.materials.map((m, i) => (
                      <a
                        key={i}
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                        {m.title || m.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* SNS 링크 */}
              {(project.telegram || project.telegramUrl || project.twitter || project.twitterUrl) && (
                <div className="flex gap-2 flex-wrap">
                  {(project.telegram || project.telegramUrl) && (
                    <a href={project.telegramUrl || project.telegram} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors">
                      <span>✈️</span> Telegram
                    </a>
                  )}
                  {(project.twitter || project.twitterUrl) && (
                    <a href={project.twitterUrl || project.twitter} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors">
                      <span>🐦</span> Twitter / X
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
};

export default ProjectDetails;
