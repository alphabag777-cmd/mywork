/**
 * Onboarding.tsx
 *
 * 초대코드 입력 페이지
 * 두 가지 방식 병행 지원:
 *   1) URL 방식  : ?referral=0x지갑주소  → 자동 감지 & Firestore 저장
 *   2) 수동 입력 : 6자리 숫자 코드       → DB 실시간 검증 후 Firestore 저장
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, XCircle, Link } from "lucide-react";
import { toast } from "sonner";
import {
  getReferralFromURL,
  setReferralCodeRegistered,
  isReferralCodeRegistered,
  getOrCreateReferralCode,
} from "@/lib/referral";
import { useAccount } from "wagmi";
import { saveUser, getUserByReferralCode, getUserByWallet } from "@/lib/users";
import { saveReferral } from "@/lib/referrals";

const Onboarding = () => {
  const [referralCode, setReferralCode]           = useState<string>("");
  const [isLoading, setIsLoading]                 = useState(false);
  const [isValidating, setIsValidating]           = useState(false);
  const [codeValid, setCodeValid]                 = useState<boolean | null>(null);
  const [error, setError]                         = useState<string>("");
  const [isChecking, setIsChecking]               = useState(true);

  // URL 방식으로 들어온 경우
  const [urlReferrerWallet, setUrlReferrerWallet] = useState<string | null>(null);
  const [urlMode, setUrlMode]                     = useState(false); // URL 방식으로 자동 감지됨

  const navigate     = useNavigate();
  const { address, isConnected } = useAccount();
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 초기 체크: 이미 등록됐거나 URL 방식으로 들어온 경우 ──────────────────
  useEffect(() => {
    if (isReferralCodeRegistered()) {
      navigate("/", { replace: true });
      return;
    }

    // ?referral=0x... 파라미터 감지
    const walletFromUrl = getReferralFromURL();
    if (walletFromUrl) {
      setUrlReferrerWallet(walletFromUrl);
      setUrlMode(true);
    }

    setIsChecking(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 6자리 코드 실시간 DB 검증 ────────────────────────────────────────────
  useEffect(() => {
    if (urlMode) return; // URL 방식이면 코드 검증 불필요

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (referralCode.length < 6) {
      setCodeValid(null);
      setError("");
      return;
    }

    if (!/^\d{6}$/.test(referralCode)) {
      setCodeValid(false);
      setError("초대코드는 숫자 6자리입니다.");
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsValidating(true);
      setError("");
      try {
        const found = await getUserByReferralCode(referralCode);
        if (found) {
          if (address && found.walletAddress.toLowerCase() === address.toLowerCase()) {
            setCodeValid(false);
            setError("자신의 초대코드는 사용할 수 없습니다.");
          } else {
            setCodeValid(true);
          }
        } else {
          setCodeValid(false);
          setError("존재하지 않는 초대코드입니다. 다시 확인해주세요.");
        }
      } catch {
        setCodeValid(false);
        setError("초대코드 확인 중 오류가 발생했습니다.");
      } finally {
        setIsValidating(false);
      }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [referralCode, address, urlMode]);

  // ── 공통 Firestore 저장 함수 ──────────────────────────────────────────────
  const saveToFirestore = async (
    referrerWallet: string | null,
    referrerCode: string | null,
  ) => {
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

  // ── URL 방식 제출 ─────────────────────────────────────────────────────────
  const handleUrlSubmit = async () => {
    if (!urlReferrerWallet) return;
    setIsLoading(true);
    try {
      // 추천인 지갑이 실제 존재하는지 확인
      const referrer = await getUserByWallet(urlReferrerWallet);
      const referrerCode = referrer?.referralCode || null;

      // localStorage에도 기록
      localStorage.setItem("alphabag_referrer_wallet", urlReferrerWallet);
      if (referrerCode) localStorage.setItem("alphabag_referrer_code", referrerCode);

      setReferralCodeRegistered();
      await saveToFirestore(urlReferrerWallet, referrerCode).catch(console.error);

      toast.success("추천인 등록 완료!");
      setTimeout(() => navigate("/", { replace: true }), 500);
    } catch (err) {
      console.error(err);
      setError("등록 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── 6자리 코드 방식 제출 ──────────────────────────────────────────────────
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const code = referralCode.trim();

    if (code) {
      if (!/^\d{6}$/.test(code)) { setError("초대코드는 숫자 6자리입니다."); return; }
      if (codeValid === false)    { setError("유효하지 않은 초대코드입니다."); return; }
      if (isValidating || codeValid === null) { setError("초대코드 확인 중입니다. 잠시 후 다시 시도해주세요."); return; }
    }

    setIsLoading(true);
    try {
      let referrerWallet: string | null = null;
      if (code) {
        if (code) localStorage.setItem("alphabag_referrer_code", code);
        const referrer = await getUserByReferralCode(code);
        if (referrer) referrerWallet = referrer.walletAddress;
      }
      if (referrerWallet) localStorage.setItem("alphabag_referrer_wallet", referrerWallet);

      setReferralCodeRegistered();
      await saveToFirestore(referrerWallet, code || null).catch(console.error);

      toast.success(code ? "등록 완료!" : "초대코드 없이 시작합니다.");
      setTimeout(() => navigate("/", { replace: true }), 500);
    } catch (err) {
      setError("등록에 실패했습니다. 다시 시도해주세요.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── 로딩 화면 ─────────────────────────────────────────────────────────────
  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── URL 방식 화면 ─────────────────────────────────────────────────────────
  if (urlMode && urlReferrerWallet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md card-metallic">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Link className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display">추천 링크로 접속됨</CardTitle>
            <CardDescription className="text-base mt-2">
              아래 추천인의 링크를 통해 접속하셨습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">추천인 지갑 주소</p>
              <p className="font-mono text-sm break-all text-foreground">
                {urlReferrerWallet}
              </p>
            </div>
            <Button
              variant="gold"
              className="w-full"
              onClick={handleUrlSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />등록 중...</>
              ) : "이 추천인으로 시작하기"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { setUrlMode(false); setUrlReferrerWallet(null); }}
              disabled={isLoading}
            >
              초대코드 직접 입력하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── 6자리 코드 입력 화면 ──────────────────────────────────────────────────
  const inputBorderClass =
    codeValid === true  ? "border-green-500 focus-visible:ring-green-500" :
    codeValid === false ? "border-red-500 focus-visible:ring-red-500"     : "";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-metallic">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">AlphaBag에 오신 것을 환영합니다</CardTitle>
          <CardDescription className="text-base mt-2">
            추천인의 <strong>6자리 초대코드</strong>를 입력하거나,<br />
            추천 링크를 통해 접속하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="referralCode">초대코드 (선택)</Label>
              <div className="relative">
                <Input
                  id="referralCode"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  placeholder="숫자 6자리 입력 (예: 813123)"
                  value={referralCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setReferralCode(value);
                    setError("");
                  }}
                  maxLength={6}
                  className={`text-center text-xl font-mono tracking-[0.4em] pr-10 ${inputBorderClass}`}
                  disabled={isLoading}
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValidating               && <Loader2     className="w-4 h-4 animate-spin text-muted-foreground" />}
                  {!isValidating && codeValid === true  && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {!isValidating && codeValid === false && <XCircle      className="w-4 h-4 text-red-500" />}
                </div>
              </div>

              {!error && codeValid === true && (
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 유효한 초대코드입니다.
                </p>
              )}
              {!error && referralCode.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  초대코드가 없으면 빈칸으로 두고 계속하세요.
                </p>
              )}
              {!error && referralCode.length > 0 && referralCode.length < 6 && (
                <p className="text-xs text-muted-foreground">{referralCode.length} / 6자리 입력 중…</p>
              )}
            </div>

            <Button
              type="submit"
              variant="gold"
              className="w-full"
              disabled={isLoading || isValidating || (referralCode.length > 0 && codeValid === false)}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />등록 중...</>
              ) : referralCode.length === 0 ? "초대코드 없이 시작" : "계속하기"}
            </Button>

            {!isConnected && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  지갑은 나중에 연결해도 됩니다.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
