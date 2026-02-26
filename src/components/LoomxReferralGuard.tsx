/**
 * LoomxReferralGuard.tsx
 *
 * 지갑 연결 시 추천코드 등록 여부를 확인하는 팝업 가드
 * - 신규 지갑(투자 내역 없음) + 미등록 → 팝업 표시
 * - 6자리 코드 입력 시 Firestore DB 실시간 검증
 * - URL 방식(?referral=0x...) 자동 처리
 * - 자신의 코드 사용 방지
 */

import { useEffect, useState, useRef } from "react";
import { useAccount } from "wagmi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { isLoomxReferralRegistered, isNewWallet } from "@/lib/referralValidation";
import {
  setReferralCodeRegistered,
  getReferralFromURL,
  getOrCreateReferralCode,
} from "@/lib/referral";
import { getUserByReferralCode, getUserByWallet, saveUser } from "@/lib/users";
import { saveReferral } from "@/lib/referrals";
import { toast } from "sonner";

const LOOMX_GUARD_SHOWN_KEY = "loomx_referral_guard_shown";

export const LoomxReferralGuard = () => {
  const { address, isConnected } = useAccount();

  const [showDialog, setShowDialog]           = useState(false);
  const [isChecking, setIsChecking]           = useState(false);

  // 코드 입력 & 검증
  const [codeInput, setCodeInput]             = useState("");
  const [isValidating, setIsValidating]       = useState(false);
  const [codeValid, setCodeValid]             = useState<boolean | null>(null);
  const [codeError, setCodeError]             = useState("");

  // 제출
  const [isSubmitting, setIsSubmitting]       = useState(false);

  // URL 방식으로 들어온 경우
  const [urlReferrerWallet, setUrlReferrerWallet] = useState<string | null>(null);

  const checkedWalletRef = useRef<string | null>(null);
  const hasCheckedRef    = useRef(false);
  const debounceRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 지갑 연결/변경 시 초대코드 등록 필요 여부 확인 ────────────────────────
  useEffect(() => {
    const check = async () => {
      if (!isConnected || !address) {
        setShowDialog(false);
        setIsChecking(false);
        return;
      }

      // 이미 등록된 경우 팝업 불필요
      if (isLoomxReferralRegistered()) {
        setShowDialog(false);
        setIsChecking(false);
        checkedWalletRef.current = address.toLowerCase();
        hasCheckedRef.current = true;
        return;
      }

      // URL 방식 자동 감지
      const walletFromUrl = getReferralFromURL();
      if (walletFromUrl && walletFromUrl.toLowerCase() !== address.toLowerCase()) {
        setUrlReferrerWallet(walletFromUrl);
      }

      const norm = address.toLowerCase();

      // 같은 지갑이고 이미 체크했으면 재확인만
      if (checkedWalletRef.current === norm && hasCheckedRef.current) {
        if (!isLoomxReferralRegistered()) setShowDialog(true);
        setIsChecking(false);
        return;
      }

      try {
        setIsChecking(true);
        const walletIsNew = await isNewWallet(address);
        console.log("[LoomxReferralGuard] walletIsNew:", walletIsNew, address);

        if (walletIsNew || !isLoomxReferralRegistered()) {
          setShowDialog(true);
          localStorage.setItem(`${LOOMX_GUARD_SHOWN_KEY}_${norm}`, "true");
        }

        checkedWalletRef.current = norm;
        hasCheckedRef.current = true;
      } catch (err) {
        console.error("[LoomxReferralGuard] check error:", err);
        setShowDialog(false);
      } finally {
        setIsChecking(false);
      }
    };

    check();

    const onRegistered = () => {
      setShowDialog(false);
      if (address) localStorage.removeItem(`${LOOMX_GUARD_SHOWN_KEY}_${address.toLowerCase()}`);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "alphabag_referral_links" && isLoomxReferralRegistered()) {
        setShowDialog(false);
      }
    };

    window.addEventListener("loomx-referral-registered", onRegistered);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("loomx-referral-registered", onRegistered);
      window.removeEventListener("storage", onStorage);
    };
  }, [isConnected, address]);

  // 지갑 해제 시 초기화
  useEffect(() => {
    if (!isConnected || !address) {
      checkedWalletRef.current = null;
      hasCheckedRef.current = false;
      setShowDialog(false);
      setCodeInput("");
      setCodeValid(null);
      setCodeError("");
      setUrlReferrerWallet(null);
    }
  }, [address, isConnected]);

  // 탭 포커스 시 재확인
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && isConnected && address && isLoomxReferralRegistered()) {
        setShowDialog(false);
        localStorage.removeItem(`${LOOMX_GUARD_SHOWN_KEY}_${address.toLowerCase()}`);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isConnected, address]);

  // ── 6자리 코드 실시간 DB 검증 ───────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (codeInput.length < 6) {
      setCodeValid(null);
      setCodeError("");
      return;
    }

    if (!/^\d{6}$/.test(codeInput)) {
      setCodeValid(false);
      setCodeError("6자리 숫자를 입력하세요.");
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsValidating(true);
      setCodeError("");
      try {
        const found = await getUserByReferralCode(codeInput);
        if (found) {
          if (address && found.walletAddress.toLowerCase() === address.toLowerCase()) {
            setCodeValid(false);
            setCodeError("자신의 초대코드는 사용할 수 없습니다.");
          } else {
            setCodeValid(true);
          }
        } else {
          setCodeValid(false);
          setCodeError("존재하지 않는 초대코드입니다.");
        }
      } catch {
        setCodeValid(false);
        setCodeError("초대코드 확인 중 오류가 발생했습니다.");
      } finally {
        setIsValidating(false);
      }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [codeInput, address]);

  // ── 공통 Firestore 저장 함수 ─────────────────────────────────────────────
  const saveToFirestore = async (referrerWallet: string | null, referrerCode: string | null) => {
    if (!isConnected || !address) return;
    const userReferralCode = getOrCreateReferralCode(address);
    await saveUser(address, {
      referralCode: userReferralCode,
      referrerCode: referrerCode,
      referrerWallet: referrerWallet,
      isRegistered: true,
    });
    if (referrerWallet) {
      await saveReferral(referrerWallet, address, referrerCode || "");
    }
  };

  // ── localStorage Loomx 항목 저장 (validation 통과용) ─────────────────────
  const markLoomxRegistered = () => {
    try {
      const key = "alphabag_referral_links";
      const stored = localStorage.getItem(key);
      let links: Array<{ id: string; name: string; logo: string; placeholder: string; link: string; saved: boolean }> = [];
      if (stored) links = JSON.parse(stored);

      const idx = links.findIndex((l) => l.id === "loomx");
      const entry = { id: "loomx", name: "LoomX", logo: "/loomx.png", placeholder: "", link: "registered", saved: true };
      if (idx >= 0) links[idx] = entry; else links.push(entry);
      localStorage.setItem(key, JSON.stringify(links));
    } catch { /* ignore */ }
  };

  // ── URL 방식 등록 ─────────────────────────────────────────────────────────
  const handleUrlSubmit = async () => {
    if (!urlReferrerWallet) return;
    setIsSubmitting(true);
    try {
      const referrer = await getUserByWallet(urlReferrerWallet);
      const referrerCode = referrer?.referralCode || null;

      localStorage.setItem("alphabag_referrer_wallet", urlReferrerWallet);
      if (referrerCode) localStorage.setItem("alphabag_referrer_code", referrerCode);

      markLoomxRegistered();
      setReferralCodeRegistered();
      await saveToFirestore(urlReferrerWallet, referrerCode).catch(console.error);

      window.dispatchEvent(new CustomEvent("loomx-referral-registered"));
      toast.success("추천인 등록 완료!");
      setShowDialog(false);
    } catch (err) {
      console.error(err);
      toast.error("등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 6자리 코드 방식 등록 ─────────────────────────────────────────────────
  const handleCodeSubmit = async () => {
    const code = codeInput.trim();

    if (code) {
      if (!/^\d{6}$/.test(code))           { setCodeError("6자리 숫자를 입력하세요."); return; }
      if (codeValid === false)              { setCodeError("유효하지 않은 초대코드입니다."); return; }
      if (isValidating || codeValid === null) { setCodeError("확인 중입니다. 잠시 후 다시 시도해주세요."); return; }
    }

    setIsSubmitting(true);
    try {
      let referrerWallet: string | null = null;
      if (code) {
        localStorage.setItem("alphabag_referrer_code", code);
        const referrer = await getUserByReferralCode(code);
        if (referrer) referrerWallet = referrer.walletAddress;
      }
      if (referrerWallet) localStorage.setItem("alphabag_referrer_wallet", referrerWallet);

      markLoomxRegistered();
      setReferralCodeRegistered();
      await saveToFirestore(referrerWallet, code || null).catch(console.error);

      window.dispatchEvent(new CustomEvent("loomx-referral-registered"));
      toast.success(code ? "추천 코드 등록 완료!" : "초대코드 없이 시작합니다.");
      setShowDialog(false);
    } catch (err) {
      console.error(err);
      toast.error("등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 렌더링 ───────────────────────────────────────────────────────────────
  console.log("[LoomxReferralGuard] Render check - isChecking:", isChecking, "showDialog:", showDialog);

  if (isChecking || !showDialog) return null;

  const inputBorder =
    codeValid === true  ? "border-green-500 focus-visible:ring-green-500" :
    codeValid === false ? "border-red-500 focus-visible:ring-red-500"     : "";

  // URL 방식이 감지된 경우 별도 UI
  if (urlReferrerWallet) {
    return (
      <Dialog open={showDialog} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex flex-col items-center gap-3 mb-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-9 h-9 text-primary" />
              </div>
              <DialogTitle className="text-center text-xl font-bold">추천 링크로 접속됨</DialogTitle>
            </div>
            <DialogDescription className="text-center">
              아래 추천인의 링크를 통해 접속하셨습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">추천인 지갑 주소</p>
              <p className="font-mono text-xs break-all text-foreground">{urlReferrerWallet}</p>
            </div>

            <Button variant="gold" className="w-full" onClick={handleUrlSubmit} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />등록 중...</> : "이 추천인으로 시작하기"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setUrlReferrerWallet(null)}
              disabled={isSubmitting}
            >
              초대코드 직접 입력하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 6자리 코드 입력 UI
  return (
    <Dialog open={showDialog} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <Shield className="w-9 h-9 text-red-500" />
            </div>
            <DialogTitle className="text-center text-xl font-bold text-red-500">
              초대코드 등록 필요
            </DialogTitle>
          </div>
          <DialogDescription className="text-center space-y-1">
            <span className="font-semibold text-foreground block">
              추천인의 <strong>6자리 초대코드</strong>를 입력하세요.
            </span>
            <span className="text-muted-foreground text-sm block">
              초대코드가 없으면 빈칸으로 두고 계속 진행할 수 있습니다.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 코드 입력 */}
          <div className="space-y-1">
            <div className="relative">
              <Input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                placeholder="숫자 6자리 입력 (예: 813123)"
                value={codeInput}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCodeInput(v);
                  setCodeError("");
                }}
                maxLength={6}
                className={`text-center text-xl font-mono tracking-[0.4em] pr-10 ${inputBorder}`}
                disabled={isSubmitting}
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isValidating                          && <Loader2      className="w-4 h-4 animate-spin text-muted-foreground" />}
                {!isValidating && codeValid === true   && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {!isValidating && codeValid === false  && <XCircle      className="w-4 h-4 text-red-500" />}
              </div>
            </div>

            {/* 상태 메시지 */}
            {codeError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> {codeError}
              </p>
            )}
            {!codeError && codeValid === true && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 유효한 초대코드입니다.
              </p>
            )}
            {!codeError && codeInput.length > 0 && codeInput.length < 6 && (
              <p className="text-xs text-muted-foreground">{codeInput.length} / 6자리 입력 중…</p>
            )}
            {codeInput.length === 0 && (
              <p className="text-xs text-muted-foreground">
                초대코드가 없으면 빈칸으로 두고 계속 버튼을 누르세요.
              </p>
            )}
          </div>

          <Button
            variant="gold"
            className="w-full text-base py-5"
            onClick={handleCodeSubmit}
            disabled={isSubmitting || isValidating || (codeInput.length > 0 && codeValid === false)}
          >
            {isSubmitting
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />등록 중...</>
              : codeInput.length === 0
                ? "초대코드 없이 시작"
                : "계속하기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
