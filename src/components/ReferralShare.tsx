/**
 * ReferralShare Component
 *
 * ■ 변경 사항
 *   - 도메인 하드코딩 제거: window.location.origin 우선, SSR fallback 제거
 *   - SNS 공유 버튼 추가: 텔레그램, 트위터/X, 카카오톡 (Web Share API), 복사
 *   - 선택 상품 미리보기 유지
 *   - QR 코드 모달 추가 (#26)
 */

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Copy, Check, Share2, ExternalLink, Info,
  Send, Twitter, MessageCircle, QrCode, Download,
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

/* ── 각 SNS URL 생성 ───────────────────────────────── */
function telegramUrl(text: string, url: string) {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}
function twitterUrl(text: string, url: string) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + "\n" + url)}`;
}
// 카카오: SDK 없이 카카오톡 공유는 deeplink 방식 (모바일에서만 동작)
function kakaoUrl(url: string) {
  return `kakaotalk://send?msg=${encodeURIComponent(url)}`;
}

const ReferralShare = () => {
  const { address, isConnected } = useAccount();
  const [userSelection, setUserSelection] = useState<UserSelectedPlans | null>(null);
  const [selectedPlans, setSelectedPlans]   = useState<InvestmentPlan[]>([]);
  const [copiedLink, setCopiedLink]         = useState(false);
  const [copiedAddr, setCopiedAddr]         = useState(false);
  const [loading, setLoading]               = useState(true);
  const [showQR, setShowQR]                 = useState(false);
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

  /* ── 링크 조합 ── */
  const base       = typeof window !== "undefined" ? window.location.origin : "";
  const planParam  = userSelection && userSelection.planIds.length > 0
    ? `&plans=${userSelection.planIds.join(",")}`
    : "";
  const referralLink = `${base}/?referral=${address}${planParam}`;
  const planNames    = selectedPlans.map((p) => p.name).join(", ");
  const shareText    = buildShareText(planNames);
  const hasSelection = selectedPlans.length > 0;

  /* ── 핸들러 ── */
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      toast.success("레퍼럴 링크가 복사되었습니다!");
      if (address) logActivity(address.toLowerCase(), "referral_link_copy", { link: referralLink.slice(0, 80) });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch { toast.error("복사 실패"); }
  };

  const copyAddr = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddr(true);
      toast.success("지갑 주소가 복사되었습니다!");
      setTimeout(() => setCopiedAddr(false), 2000);
    } catch { toast.error("복사 실패"); }
  };

  const openTelegram = () =>
    window.open(telegramUrl(shareText, referralLink), "_blank", "noopener,noreferrer");

  const openTwitter = () =>
    window.open(twitterUrl(shareText, referralLink), "_blank", "noopener,noreferrer");

  // 카카오: 모바일이면 딥링크, 아니면 복사
  const shareKakao = async () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      try {
        const a = document.createElement("a");
        a.href = kakaoUrl(referralLink);
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        // setTimeout으로 DOM 조작 타이밍 분리 (React reconciler 충돌 방지)
        setTimeout(() => {
          try {
            if (document.body.contains(a)) {
              document.body.removeChild(a);
            }
          } catch { /* ignore */ }
        }, 100);
      } catch {
        // 딥링크 실패 시 링크 복사로 폴백
        await copyLink();
      }
    } else {
      if (navigator.share) {
        try {
          await navigator.share({ title: "AlphaBag 투자상품 추천", text: shareText, url: referralLink });
          return;
        } catch { /* cancelled */ }
      }
      await copyLink();
      toast.info("PC에서는 카카오 직접 공유가 어렵습니다. 링크를 복사했습니다.");
    }
  };

  // 기타 (Web Share API)
  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "AlphaBag 투자상품 추천", text: shareText, url: referralLink });
        return;
      } catch { /* cancelled */ }
    }
    await copyLink();
  };

  // QR 코드 PNG 다운로드
  const downloadQR = () => {
    const svg = qrRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement("canvas");
    const size = 300;
    canvas.width = size;
    canvas.height = size;
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

  return (
    <>
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="w-4 h-4 text-primary" />
            레퍼럴 링크 공유
          </CardTitle>
          <CardDescription className="text-xs">
            {hasSelection
              ? `선택하신 ${userSelection!.planIds.length}개 상품이 포함된 레퍼럴 링크입니다.`
              : "투자상품을 선택하면 해당 상품이 포함된 링크가 생성됩니다."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* 선택 상품 미리보기 */}
          {loading ? (
            <p className="text-xs text-muted-foreground">불러오는 중…</p>
          ) : hasSelection ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">선택된 상품</p>
              <div className="flex flex-wrap gap-2">
                {selectedPlans.map((p, idx) => (
                  <div key={p.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background border border-border text-xs">
                    <span className="font-bold text-primary/70">#{idx + 1}</span>
                    {p.logo && <img src={p.logo} alt={p.label} className="w-4 h-4 object-contain" />}
                    <span className="font-medium">{p.name}</span>
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

          {/* 레퍼럴 링크 입력 + 복사/열기/QR */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">레퍼럴 링크</label>
            <div className="flex items-center gap-2">
              <Input value={referralLink} readOnly className="font-mono text-xs h-8" />
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0"
                onClick={copyLink} title="링크 복사">
                {copiedLink
                  ? <Check className="w-3.5 h-3.5 text-green-500" />
                  : <Copy className="w-3.5 h-3.5" />}
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0"
                onClick={() => window.open(referralLink, "_blank")} title="링크 열기">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
              {/* QR 코드 버튼 */}
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0"
                onClick={() => setShowQR(true)} title="QR 코드 보기">
                <QrCode className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* 지갑 주소 (레퍼럴 코드) */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">내 지갑 주소 (레퍼럴 코드)</label>
            <div className="flex items-center gap-2">
              <Input value={address} readOnly className="font-mono text-xs h-8" />
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0"
                onClick={copyAddr} title="주소 복사">
                {copiedAddr
                  ? <Check className="w-3.5 h-3.5 text-green-500" />
                  : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          {/* ── SNS 공유 버튼 그룹 ── */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">SNS 공유</p>
            <div className="grid grid-cols-2 gap-2">

              {/* 텔레그램 */}
              <Button
                variant="outline"
                className="gap-2 h-10 text-sm border-[#229ED9]/40 hover:bg-[#229ED9]/10 hover:border-[#229ED9] hover:text-[#229ED9] transition-colors"
                onClick={openTelegram}
              >
                <Send className="w-4 h-4" />
                텔레그램
              </Button>

              {/* 트위터 / X */}
              <Button
                variant="outline"
                className="gap-2 h-10 text-sm border-foreground/20 hover:bg-foreground/5 hover:border-foreground/40 transition-colors"
                onClick={openTwitter}
              >
                <Twitter className="w-4 h-4" />
                트위터 / X
              </Button>

              {/* 카카오톡 */}
              <Button
                variant="outline"
                className="gap-2 h-10 text-sm border-[#FAE100]/60 hover:bg-[#FAE100]/10 hover:border-[#FAE100] hover:text-[#3A1D1D] dark:hover:text-[#FAE100] transition-colors"
                onClick={shareKakao}
              >
                <span className="text-base leading-none">💬</span>
                카카오톡
              </Button>

              {/* 기타 공유 (Web Share API / 복사 fallback) */}
              <Button
                variant="gold"
                className="gap-2 h-10 text-sm"
                onClick={shareNative}
              >
                <MessageCircle className="w-4 h-4" />
                기타 공유
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* ── QR 코드 모달 ── */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-xs w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <QrCode className="w-4 h-4 text-primary" />
              레퍼럴 QR 코드
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {/* QR 이미지 */}
            <div className="p-4 bg-white rounded-xl border border-border shadow-sm">
              <QRCodeSVG
                ref={qrRef}
                value={referralLink}
                size={200}
                level="M"
                includeMargin={false}
                imageSettings={{
                  src: "/logo.png",
                  x: undefined,
                  y: undefined,
                  height: 36,
                  width: 36,
                  excavate: true,
                }}
              />
            </div>

            {/* 링크 미리보기 */}
            <p className="text-xs text-muted-foreground text-center break-all px-2 max-w-[240px]">
              {referralLink}
            </p>

            {/* 버튼 그룹 */}
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1 gap-2 text-sm" onClick={copyLink}>
                {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                링크 복사
              </Button>
              <Button variant="default" className="flex-1 gap-2 text-sm" onClick={downloadQR}>
                <Download className="w-4 h-4" />
                PNG 저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReferralShare;
