import { useState, useCallback } from "react";
import {
  Copy, Check, Wallet, RefreshCw, LogOut,
  ExternalLink, ChevronRight, AlertCircle, Info
} from "lucide-react";
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

/** 지갑 주소를 세 구간으로 분리해서 앞·뒤를 amber 강조 */
function AddressDisplay({ address }: { address: string }) {
  const prefix = address.slice(0, 2);   // "0x"
  const head   = address.slice(2, 6);   // 처음 4자리
  const middle = address.slice(6, -4);  // 중간
  const tail   = address.slice(-4);     // 마지막 4자리

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* 전체 주소 박스 */}
      <div className="w-full bg-muted rounded-xl px-3 py-3 text-center border border-border/60">
        <span className="font-mono text-[13px] break-all leading-relaxed select-all text-muted-foreground">
          <span className="text-amber-600 dark:text-amber-400 font-bold">{prefix}{head}</span>
          <span className="text-foreground">{middle}</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">{tail}</span>
        </span>
      </div>
      {/* 앞 6자 / 뒤 4자 강조 뱃지 */}
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded-md font-mono font-bold border border-amber-200 dark:border-amber-800">
          {prefix}{head}
        </span>
        <span className="text-muted-foreground">· · ·</span>
        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded-md font-mono font-bold border border-amber-200 dark:border-amber-800">
          {tail}
        </span>
      </div>
    </div>
  );
}

/**
 * TokenPocket "계정 선택" 팝업 진입 전 사전 안내 패널
 * ─ 현재 주소를 크게 표시하고 "이 주소를 선택하세요" 가이드 제공
 */
function SwitchGuidePanel({
  address,
  isSwitching,
  onConfirm,
  onCancel,
}: {
  address: string;
  isSwitching: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const prefix = address.slice(0, 2);
  const head   = address.slice(2, 6);
  const tail   = address.slice(-4);

  return (
    <div className="flex flex-col gap-4">
      {/* 안내 메시지 */}
      <div className="flex gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          TokenPocket 계정 선택 팝업에서 아래 주소의 계정을 선택하세요.
          계정 이름 옆 <strong>···</strong> 버튼을 눌러 주소를 확인할 수 있습니다.
        </p>
      </div>

      {/* 선택해야 할 주소 – 크게 강조 */}
      <div className="rounded-xl border-2 border-amber-400 dark:border-amber-500 bg-amber-50/60 dark:bg-amber-950/20 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">
          <AlertCircle className="w-3.5 h-3.5" />
          선택해야 할 계정 주소
        </div>

        {/* 전체 주소 */}
        <div className="font-mono text-[12px] break-all leading-relaxed text-center bg-white dark:bg-zinc-900 rounded-lg px-3 py-2.5 border border-amber-200 dark:border-amber-800 select-all">
          <span className="text-amber-600 dark:text-amber-400 font-bold text-[13px]">{prefix}{head}</span>
          <span className="text-foreground">{address.slice(6, -4)}</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold text-[13px]">{tail}</span>
        </div>

        {/* 앞뒤 빠른 식별 뱃지 */}
        <div className="flex items-center justify-center gap-2 mt-0.5">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-muted-foreground">앞 6자리</span>
            <span className="px-2.5 py-1 bg-amber-400 dark:bg-amber-500 text-white rounded-lg font-mono font-bold text-sm tracking-wider shadow-sm">
              {prefix}{head}
            </span>
          </div>
          <span className="text-muted-foreground text-lg mt-3">···</span>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-muted-foreground">뒤 4자리</span>
            <span className="px-2.5 py-1 bg-amber-400 dark:bg-amber-500 text-white rounded-lg font-mono font-bold text-sm tracking-wider shadow-sm">
              {tail}
            </span>
          </div>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          취소
        </Button>
        <Button
          className="flex-1 gap-2 bg-amber-500 hover:bg-amber-600 text-white border-0"
          onClick={onConfirm}
          disabled={isSwitching}
        >
          {isSwitching ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isSwitching ? "전환 중..." : "계정 선택 열기"}
        </Button>
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
  /** TokenPocket 계정 선택 사전 안내 패널 표시 여부 */
  const [showSwitchGuide, setShowSwitchGuide] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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

  /** "지갑 계정 변경" 버튼 클릭 → 안내 패널 표시 */
  const handleSwitchClick = useCallback(() => {
    setShowSwitchGuide(true);
  }, []);

  /** 안내 패널 "계정 선택 열기" 클릭 → TokenPocket 네이티브 팝업 호출 */
  const handleSwitchConfirm = useCallback(async () => {
    onOpenChange(false);
    setShowSwitchGuide(false);
    await onSwitch();
  }, [onSwitch, onOpenChange]);

  const handleSwitchCancel = useCallback(() => {
    setShowSwitchGuide(false);
  }, []);

  const handleDisconnect = useCallback(() => {
    onOpenChange(false);
    setShowSwitchGuide(false);
    onDisconnect();
  }, [onDisconnect, onOpenChange]);

  const handleOpenChange = useCallback((v: boolean) => {
    if (!v) setShowSwitchGuide(false);
    onOpenChange(v);
  }, [onOpenChange]);

  const openExplorer = useCallback(() => {
    window.open(`https://bscscan.com/address/${address}`, "_blank", "noopener");
  }, [address]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[92vw] max-w-sm rounded-2xl p-0 overflow-hidden gap-0">

        {/* ── 헤더 ── */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            {showSwitchGuide ? "계정 변경 안내" : "내 지갑 주소"}
            {isTokenPocket && !showSwitchGuide && (
              <span className="ml-auto text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                TokenPocket
              </span>
            )}
            {showSwitchGuide && (
              <button
                className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleSwitchCancel}
              >
                ← 뒤로
              </button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 flex flex-col gap-4">

          {/* ── 계정 변경 사전 안내 패널 ── */}
          {showSwitchGuide ? (
            <SwitchGuidePanel
              address={address}
              isSwitching={isSwitching}
              onConfirm={handleSwitchConfirm}
              onCancel={handleSwitchCancel}
            />
          ) : (
            <>
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
                  <><Check className="w-4 h-4" />복사 완료!</>
                ) : (
                  <><Copy className="w-4 h-4" />주소 복사</>
                )}
              </Button>

              {/* 구분선 */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border/60" />
                <span className="text-[10px] text-muted-foreground">작업 선택</span>
                <div className="flex-1 h-px bg-border/60" />
              </div>

              {/* 작업 목록 */}
              <div className="flex flex-col gap-2">

                {/* BSCScan */}
                <button
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/60 hover:bg-muted/60 transition-colors text-left group"
                  onClick={openExplorer}
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium">블록체인 탐색기</span>
                    <span className="text-xs text-muted-foreground">BSCScan에서 주소 확인</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </button>

                {/* TokenPocket 계정 변경 – 클릭 시 안내 패널 */}
                {isTokenPocket && (
                  <button
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-amber-400/50 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors text-left group"
                    onClick={handleSwitchClick}
                    disabled={isSwitching}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        지갑 계정 변경
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
