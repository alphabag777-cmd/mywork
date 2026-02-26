/**
 * ReferralShare Component
 *
 * ■ 링크 구조
 *   ① 초대 링크 (회원가입용):  /?referral=0x지갑주소
 *      - 이 링크로 가입하면 referrerWallet = 0x지갑주소 로 저장
 *      - &plans= 없음 → 추천인만 정확히 등록
 *
 *   ② 홍보 링크 (상품 포함):  /?referral=0x지갑주소&plans=plan_a,plan_b
 *      - 이 링크로 접속해도 회원가입 시 referrerWallet = 0x지갑주소 만 저장
 *        (LoomxReferralGuard / Onboarding 모두 getReferralFromURL()로 ?referral= 만 추출)
 *      - &plans= 는 별도 처리: 가입 완료 후 투자상품 페이지로 자동 이동
 *      - 상품을 선택한 경우에만 이 섹션 표시
 */

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Copy, Check, Share2, ExternalLink, Info,
  Send, Twitter, MessageCircle, QrCode, Download,
  UserPlus, Megaphone,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { getUserSelectedPlans, UserSelectedPlans } from "@/lib/userSelectedPlans";
import { getAllPlans, InvestmentPlan } from "@/lib/plans";
import { logActivity } from "@/lib/userActivityLog";

/* ── 공유 텍스트 ───────────────────────────────────── */
function buildShareText(planNames: string): string {
  return planNames
    ? `AlphaBag 투자 플랫폼 — 제가 선택한 상품(${planNames})을 확인해보세요! 🚀`
    : "AlphaBag 투자 플랫폼에 참여해보세요! 🚀";
}

/* ── SNS URL 생성 ──────────────────────────────────── */
function telegramUrl(text: string, url: string) {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}
function twitterUrl(text: string, url: string) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + "\n" + url)}`;
}
function kakaoUrl(url: string) {
  return `kakaotalk://send?msg=${encodeURIComponent(url)}`;
}

const ReferralShare = () => {
  const { address, isConnected } = useAccount();
  const [userSelection, setUserSelection] = useState<UserSelectedPlans | null>(null);
  const [selectedPlans, setSelectedPlans]   = useState<InvestmentPlan[]>([]);
  const [copiedInvite, setCopiedInvite]     = useState(false);
  const [copiedPromo, setCopiedPromo]       = useState(false);
  const [copiedAddr, setCopiedAddr]         = useState(false);
  const [loading, setLoading]               = useState(true);
  const [showQR, setShowQR]                 = useState<"invite" | "promo" | null>(null);
  const qrRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!address) { setLoading(false); return; }
    setLoading(true);
    Promise.all([getUserSelectedPlans(address), getAllPlans()])
      .then(([sel, allPlans]) => {
        setUserSelection(sel);
        setSelectedPlans(
          sel && sel.planIds.length > 0
            ? allPlans.filter((p) => sel.planIds.includes(p.id))
            : [],
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [address]);

  // PlanSelector 저장 시 즉시 반영
  useEffect(() => {
    const handler = (e: Event) => {
      const saved = (e as CustomEvent).detail;
      if (!saved) return;
      setUserSelection(saved);
      getAllPlans().then((allPlans) => {
        setSelectedPlans(
          saved.planIds.length > 0
            ? allPlans.filter((p: any) => saved.planIds.includes(p.id))
            : [],
        );
      }).catch(() => {});
    };
    window.addEventListener("planSelectionChanged", handler);
    return () => window.removeEventListener("planSelectionChanged", handler);
  }, []);

  if (!isConnected || !address) return null;

  /* ── 링크 조합 ────────────────────────────────────────────────────────────
   *  ① inviteLink: /?referral=0x지갑주소
   *     → 회원가입 시 referrerWallet = 지갑주소 로 저장 (plans 없음)
   *  ② promoLink:  /?referral=0x지갑주소&plans=plan_a,plan_b
   *     → 접속 후 회원가입 시 referrerWallet은 동일하게 지갑주소만 저장,
   *       plans 파라미터는 별도 처리(가입 완료 후 투자상품 페이지 이동)
   * ─────────────────────────────────────────────────────────────────────── */
  const base        = typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink  = `${base}/?referral=${address}`;
  const planParam   = userSelection && userSelection.planIds.length > 0
    ? `&plans=${userSelection.planIds.join(",")}`
    : "";
  const promoLink   = `${base}/?referral=${address}${planParam}`;
  const planNames   = selectedPlans.map((p) => p.name).join(", ");
  const shareText   = buildShareText(planNames);
  const hasPlans    = selectedPlans.length > 0;

  /* ── 복사 핸들러 ── */
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedInvite(true);
      toast.success("초대 링크 복사됨!");
      if (address) logActivity(address.toLowerCase(), "referral_link_copy", { link: inviteLink.slice(0, 80) });
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch { toast.error("복사 실패"); }
  };

  const copyPromo = async () => {
    try {
      await navigator.clipboard.writeText(promoLink);
      setCopiedPromo(true);
      toast.success("홍보 링크 복사됨!");
      if (address) logActivity(address.toLowerCase(), "promo_link_copy", { link: promoLink.slice(0, 80) });
      setTimeout(() => setCopiedPromo(false), 2000);
    } catch { toast.error("복사 실패"); }
  };

  const copyAddr = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddr(true);
      toast.success("지갑 주소 복사됨!");
      setTimeout(() => setCopiedAddr(false), 2000);
    } catch { toast.error("복사 실패"); }
  };

  /* ── SNS 공유 (초대 링크 기준) ── */
  const openTelegram = () =>
    window.open(telegramUrl(shareText, inviteLink), "_blank", "noopener,noreferrer");
  const openTwitter = () =>
    window.open(twitterUrl(shareText, inviteLink), "_blank", "noopener,noreferrer");

  const shareKakao = async () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      try {
        const a = document.createElement("a");
        a.href = kakaoUrl(inviteLink);
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try { if (document.body.contains(a)) document.body.removeChild(a); } catch { /* ignore */ }
        }, 100);
      } catch { await copyInvite(); }
    } else {
      if (navigator.share) {
        try { await navigator.share({ title: "AlphaBag 투자상품 추천", text: shareText, url: inviteLink }); return; }
        catch { /* cancelled */ }
      }
      await copyInvite();
      toast.info("PC에서는 카카오 직접 공유가 어렵습니다. 링크를 복사했습니다.");
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "AlphaBag 투자상품 추천", text: shareText, url: inviteLink }); return; }
      catch { /* cancelled */ }
    }
    await copyInvite();
  };

  /* ── QR 다운로드 ── */
  const downloadQR = () => {
    const svg = qrRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement("canvas");
    const size = 300;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const a = document.createElement("a");
      a.download = "alphabag-referral-qr.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
  };

  const qrValue = showQR === "promo" ? promoLink : inviteLink;

  return (
    <>
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="w-4 h-4 text-primary" />
            레퍼럴 링크 공유
          </CardTitle>
          <CardDescription className="text-xs">
            초대 링크와 홍보 링크를 공유하세요.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">

          {/* ━━━━ ① 초대 링크 (회원가입용) ━━━━ */}
          <div className="rounded-xl border border-border bg-background/60 p-3 space-y-2">
            {/* 헤더 */}
            <div className="flex items-center gap-2">
              <UserPlus className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground">초대 링크</span>
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">회원가입용</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              이 링크로 가입하면 <strong>나를 추천인으로 자동 등록</strong>합니다.
            </p>
            {/* 입력 + 버튼 */}
            <div className="flex items-center gap-1.5">
              <Input value={inviteLink} readOnly className="font-mono text-xs h-8 bg-background" />
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0"
                onClick={copyInvite} title="복사">
                {copiedInvite ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0"
                onClick={() => window.open(inviteLink, "_blank")} title="열기">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0"
                onClick={() => setShowQR("invite")} title="QR">
                <QrCode className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* ━━━━ ② 홍보 링크 (상품 포함) ━━━━ */}
          <div className={`rounded-xl border p-3 space-y-2 ${
            hasPlans
              ? "border-primary/30 bg-primary/5"
              : "border-dashed border-border bg-muted/30"
          }`}>
            {/* 헤더 */}
            <div className="flex items-center gap-2">
              <Megaphone className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground">홍보 링크</span>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-primary/40 text-primary">
                상품 포함
              </Badge>
            </div>

            {hasPlans ? (
              <>
                {/* 선택된 상품 태그 */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedPlans.map((p, idx) => (
                    <div key={p.id}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border border-border text-xs">
                      <span className="text-primary/60 font-bold text-[10px]">#{idx + 1}</span>
                      {p.logo && <img src={p.logo} alt={p.label} className="w-3.5 h-3.5 object-contain" />}
                      <span className="font-medium">{p.name}</span>
                    </div>
                  ))}
                </div>
                {/* 설명 */}
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  이 링크로 가입해도 <strong>추천인 등록은 동일</strong>하게 처리됩니다.
                  <br />
                  <span className="text-primary/80">가입 완료 후 위 상품 페이지로 자동 이동합니다.</span>
                </p>
                {/* 입력 + 버튼 */}
                <div className="flex items-center gap-1.5">
                  <Input value={promoLink} readOnly className="font-mono text-xs h-8 bg-background" />
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0"
                    onClick={copyPromo} title="복사">
                    {copiedPromo ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0"
                    onClick={() => window.open(promoLink, "_blank")} title="열기">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0"
                    onClick={() => setShowQR("promo")} title="QR">
                    <QrCode className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </>
            ) : (
              /* 상품 미선택 안내 */
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p>
                  투자상품을 선택하면 <strong>상품이 포함된 홍보 링크</strong>가 생성됩니다.
                  <br />
                  홍보 링크로 가입해도 추천인 등록은 초대 링크와 동일합니다.
                </p>
              </div>
            )}
          </div>

          {/* ━━━━ 내 지갑 주소 ━━━━ */}
          {loading ? null : (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">내 지갑 주소</label>
              <div className="flex items-center gap-1.5">
                <Input value={address} readOnly className="font-mono text-xs h-8" />
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0"
                  onClick={copyAddr} title="복사">
                  {copiedAddr ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          )}

          {/* ━━━━ SNS 공유 ━━━━ */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">SNS 공유 <span className="font-normal">(초대 링크 기준)</span></p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline"
                className="gap-2 h-10 text-sm border-[#229ED9]/40 hover:bg-[#229ED9]/10 hover:border-[#229ED9] hover:text-[#229ED9] transition-colors"
                onClick={openTelegram}>
                <Send className="w-4 h-4" />텔레그램
              </Button>
              <Button variant="outline"
                className="gap-2 h-10 text-sm border-foreground/20 hover:bg-foreground/5 hover:border-foreground/40 transition-colors"
                onClick={openTwitter}>
                <Twitter className="w-4 h-4" />트위터 / X
              </Button>
              <Button variant="outline"
                className="gap-2 h-10 text-sm border-[#FAE100]/60 hover:bg-[#FAE100]/10 hover:border-[#FAE100] hover:text-[#3A1D1D] dark:hover:text-[#FAE100] transition-colors"
                onClick={shareKakao}>
                <span className="text-base leading-none">💬</span>카카오톡
              </Button>
              <Button variant="gold" className="gap-2 h-10 text-sm" onClick={shareNative}>
                <MessageCircle className="w-4 h-4" />기타 공유
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* ── QR 코드 모달 ── */}
      <Dialog open={!!showQR} onOpenChange={(o) => !o && setShowQR(null)}>
        <DialogContent className="max-w-xs w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <QrCode className="w-4 h-4 text-primary" />
              {showQR === "promo" ? "홍보 링크 QR" : "초대 링크 QR"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="p-4 bg-white rounded-xl border border-border shadow-sm">
              <QRCodeSVG
                ref={qrRef}
                value={qrValue}
                size={200}
                level="M"
                includeMargin={false}
                imageSettings={{
                  src: "/logo.png",
                  x: undefined, y: undefined,
                  height: 36, width: 36,
                  excavate: true,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center break-all px-2 max-w-[240px]">
              {qrValue}
            </p>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1 gap-2 text-sm"
                onClick={showQR === "promo" ? copyPromo : copyInvite}>
                {(showQR === "promo" ? copiedPromo : copiedInvite)
                  ? <Check className="w-4 h-4 text-green-500" />
                  : <Copy className="w-4 h-4" />}
                링크 복사
              </Button>
              <Button variant="default" className="flex-1 gap-2 text-sm" onClick={downloadQR}>
                <Download className="w-4 h-4" />PNG 저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReferralShare;
