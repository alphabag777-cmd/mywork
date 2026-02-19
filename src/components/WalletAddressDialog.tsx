import { useState, useCallback } from "react";
import { Copy, Check, Wallet, RefreshCw, LogOut, ExternalLink, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WalletAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  isTokenPocket: boolean;
  isSwitching: boolean;
  onSwitch: () => Promise<void>;
  onDisconnect: () => void;
}

/** 주소를 여러 포맷으로 분리해서 시각화 */
function AddressDisplay({ address }: { address: string }) {
  // 0x + 처음 4자 / 중간 / 마지막 4자 강조
  const prefix = address.slice(0, 2);       // "0x"
  const head   = address.slice(2, 6);       // 처음 4자리
  const middle = address.slice(6, -4);      // 중간
  const tail   = address.slice(-4);         // 마지막 4자리

  return (
    <div className="flex flex-col items-center gap-1">
      {/* 전체 주소 – 폰트 모노, 줄바꿈 허용 */}
      <div className="w-full bg-muted rounded-lg px-3 py-2.5 text-center">
        <span className="font-mono text-xs sm:text-sm break-all leading-relaxed select-all text-muted-foreground">
          <span className="text-foreground font-bold">{prefix}{head}</span>
          <span>{middle}</span>
          <span className="text-foreground font-bold">{tail}</span>
        </span>
      </div>
      {/* 구분 강조 바 */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
        <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded font-mono font-semibold">
          {prefix}{head}
        </span>
        <span className="opacity-50">···</span>
        <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded font-mono font-semibold">
          {tail}
        </span>
      </div>
    </div>
  );
}

export function WalletAddressDialog({
  open,
  onOpenChange,
  address,
  isTokenPocket,
  isSwitching,
  onSwitch,
  onDisconnect,
}: WalletAddressDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older mobile browsers
      const el = document.createElement("textarea");
      el.value = address;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  const handleSwitch = useCallback(async () => {
    onOpenChange(false);
    await onSwitch();
  }, [onSwitch, onOpenChange]);

  const handleDisconnect = useCallback(() => {
    onOpenChange(false);
    onDisconnect();
  }, [onDisconnect, onOpenChange]);

  const openExplorer = useCallback(() => {
    window.open(`https://bscscan.com/address/${address}`, "_blank", "noopener");
  }, [address]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-sm rounded-2xl p-0 overflow-hidden gap-0">
        {/* 헤더 */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            내 지갑 주소
            {isTokenPocket && (
              <span className="ml-auto text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                TokenPocket
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* 주소 표시 */}
          <AddressDisplay address={address} />

          {/* 복사 버튼 */}
          <Button
            variant="outline"
            className={cn(
              "w-full gap-2 transition-all",
              copied && "border-green-500 text-green-600 dark:text-green-400"
            )}
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                복사 완료!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                주소 복사
              </>
            )}
          </Button>

          {/* 구분선 */}
          <div className="relative flex items-center gap-2">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-[10px] text-muted-foreground">작업 선택</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          {/* 작업 버튼 목록 */}
          <div className="flex flex-col gap-2">
            {/* BSCScan에서 보기 */}
            <button
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/60 hover:bg-muted/60 transition-colors text-left group"
              onClick={openExplorer}
            >
              <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium">블록체인 탐색기</span>
                <span className="text-xs text-muted-foreground truncate">BSCScan에서 주소 확인</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </button>

            {/* TokenPocket 계정 전환 */}
            {isTokenPocket && (
              <button
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-amber-400/50 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors text-left group disabled:opacity-50"
                onClick={handleSwitch}
                disabled={isSwitching}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
                  {isSwitching ? (
                    <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {isSwitching ? "전환 중..." : "지갑 계정 변경"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    다른 TokenPocket 계정으로 전환
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </button>
            )}

            {/* 연결 해제 */}
            <button
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-red-200/60 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left group"
              onClick={handleDisconnect}
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-4 h-4 text-red-500 dark:text-red-400" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium text-red-600 dark:text-red-400">연결 해제</span>
                <span className="text-xs text-muted-foreground">지갑 연결 끊기</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
