/**
 * InvestmentCertificate – 투자 인증 카드 SNS 공유 컴포넌트
 * Canvas API로 이미지 생성 후 다운로드 또는 Web Share API 공유
 */

import { useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Award,
  Download,
  Share2,
  Loader2,
  ImageIcon,
} from "lucide-react";

interface CertificateData {
  investorAddress: string;
  planName: string;
  amount: number;
  date: string;   // formatted string
  referralLink?: string;
}

interface Props {
  data: CertificateData;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/** Draw the certificate to a canvas and return a data URL */
async function drawCertificate(canvas: HTMLCanvasElement, data: CertificateData): Promise<string> {
  const W = 800;
  const H = 450;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0f0c1a");
  bg.addColorStop(1, "#1a1435");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Gold border
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, W - 24, H - 24);

  // Inner subtle border
  ctx.strokeStyle = "rgba(212,175,55,0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  // Title
  ctx.fillStyle = "#d4af37";
  ctx.font = "bold 36px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("AlphaBag", W / 2, 75);

  // Sub title
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("투자 인증서 · Investment Certificate", W / 2, 105);

  // Divider
  ctx.strokeStyle = "rgba(212,175,55,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 120);
  ctx.lineTo(W - 50, 120);
  ctx.stroke();

  // Plan name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Arial, sans-serif";
  ctx.fillText(data.planName, W / 2, 170);

  // Amount
  const amtGrad = ctx.createLinearGradient(W / 2 - 150, 0, W / 2 + 150, 0);
  amtGrad.addColorStop(0, "#d4af37");
  amtGrad.addColorStop(1, "#f0d060");
  ctx.fillStyle = amtGrad;
  ctx.font = "bold 44px Arial, sans-serif";
  ctx.fillText(`$ ${data.amount.toLocaleString()} USDT`, W / 2, 235);

  // Labels
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "14px Arial, sans-serif";
  ctx.fillText("투자 금액 · Amount Invested", W / 2, 258);

  // Divider 2
  ctx.strokeStyle = "rgba(212,175,55,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 275);
  ctx.lineTo(W - 50, 275);
  ctx.stroke();

  // Details row
  const colL = W / 4;
  const colR = (W * 3) / 4;

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "13px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("투자자 · Investor", colL, 300);
  ctx.fillText("날짜 · Date", colR, 300);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px Arial, sans-serif";
  const shortAddr =
    data.investorAddress.length > 20
      ? `${data.investorAddress.slice(0, 8)}...${data.investorAddress.slice(-6)}`
      : data.investorAddress;
  ctx.fillText(shortAddr, colL, 322);
  ctx.fillText(data.date, colR, 322);

  // Referral link hint
  if (data.referralLink) {
    ctx.fillStyle = "rgba(212,175,55,0.7)";
    ctx.font = "12px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🔗 " + data.referralLink.slice(0, 60) + (data.referralLink.length > 60 ? "..." : ""), W / 2, 370);
  }

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "11px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("mywork-alpha.netlify.app · Powered by AlphaBag", W / 2, 420);

  return canvas.toDataURL("image/png");
}

export const InvestmentCertificateButton = ({
  investorAddress,
  planName,
  amount,
  date,
}: {
  investorAddress: string;
  planName: string;
  amount: number;
  date: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 border-yellow-500/40 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10"
        onClick={() => setOpen(true)}
      >
        <Award className="w-4 h-4" />
        인증 카드
      </Button>
      <InvestmentCertificate
        data={{
          investorAddress,
          planName,
          amount,
          date,
          referralLink: typeof window !== "undefined" ? `${window.location.origin}/?referral=${investorAddress}` : "",
        }}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
};

export const InvestmentCertificate = ({ data, open, onOpenChange }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);

  const generate = useCallback(async () => {
    if (!canvasRef.current) return;
    setGenerating(true);
    try {
      const url = await drawCertificate(canvasRef.current, data);
      setImgUrl(url);
    } finally {
      setGenerating(false);
    }
  }, [data]);

  // Auto-generate when dialog opens
  const handleOpenChange = (v: boolean) => {
    if (v) { setTimeout(generate, 100); }
    else { setImgUrl(null); }
    onOpenChange(v);
  };

  const handleDownload = () => {
    if (!imgUrl) return;
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = `alphabag-certificate-${Date.now()}.png`;
    a.click();
  };

  const handleShare = async () => {
    if (!imgUrl) return;
    setSharing(true);
    try {
      const blob = await (await fetch(imgUrl)).blob();
      const file = new File([blob], "alphabag-certificate.png", { type: "image/png" });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "AlphaBag 투자 인증",
          text: `나는 AlphaBag의 ${data.planName} 상품에 $${data.amount.toLocaleString()} USDT를 투자했습니다! 함께해요 🚀\n${data.referralLink || ""}`,
          files: [file],
        });
      } else {
        // Fallback: download
        handleDownload();
      }
    } catch {
      handleDownload();
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            투자 인증 카드
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hidden canvas */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Preview */}
          <div className="rounded-xl overflow-hidden border border-border bg-muted/30 flex items-center justify-center min-h-[200px]">
            {generating ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">인증 카드 생성 중...</p>
              </div>
            ) : imgUrl ? (
              <img src={imgUrl} alt="투자 인증 카드" className="w-full rounded-xl" />
            ) : (
              <div className="flex flex-col items-center gap-3 py-10">
                <ImageIcon className="w-8 h-8 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">카드를 생성하세요</p>
              </div>
            )}
          </div>

          {/* Info card */}
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">상품명</p>
                <p className="font-semibold">{data.planName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">투자 금액</p>
                <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                  ${data.amount.toLocaleString()} USDT
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">날짜</p>
                <p className="font-semibold">{data.date}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">투자자</p>
                <p className="font-mono text-xs truncate">{data.investorAddress.slice(0, 10)}...{data.investorAddress.slice(-6)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={generate} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              재생성
            </Button>
            <Button variant="outline" onClick={handleDownload} disabled={!imgUrl} className="gap-2">
              <Download className="w-4 h-4" />
              이미지 저장
            </Button>
            <Button onClick={handleShare} disabled={!imgUrl || sharing} className="gap-2 flex-1">
              {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              SNS 공유
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            SNS 공유 시 추천 링크가 이미지에 포함됩니다 · 친구 초대 후 보상을 받으세요 🎁
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvestmentCertificate;
