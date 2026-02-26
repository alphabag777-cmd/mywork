import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { getReferralCodeFromURL, storeReferralFromURL, setReferralCodeRegistered, isReferralCodeRegistered, getOrCreateReferralCode } from "@/lib/referral";
import { useAccount } from "wagmi";
import { saveUser, getUserByReferralCode } from "@/lib/users";
import { saveReferral } from "@/lib/referrals";

const Onboarding = () => {
  const [referralCode, setReferralCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);       // 실시간 검증 중
  const [codeValid, setCodeValid] = useState<boolean | null>(null); // null=미검증, true=유효, false=무효
  const [error, setError] = useState<string>("");
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 이미 등록된 경우 리다이렉트 ──────────────────────────────────────────
  useEffect(() => {
    const checkRegistration = () => {
      const urlCode = getReferralCodeFromURL();
      if (urlCode) {
        if (isConnected && address) {
          const stored = storeReferralFromURL(address);
          if (stored) {
            navigate("/", { replace: true });
            return;
          }
        } else {
          setReferralCode(urlCode);
        }
      }
      if (isReferralCodeRegistered()) {
        navigate("/", { replace: true });
        return;
      }
      setIsChecking(false);
    };
    checkRegistration();
  }, [navigate, isConnected, address]);

  // ── 6자리 입력 완료 시 DB 실시간 검증 ────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (referralCode.length < 6) {
      setCodeValid(null);
      setError("");
      return;
    }

    // 6자리 숫자 형식 검사
    if (!/^\d{6}$/.test(referralCode)) {
      setCodeValid(false);
      setError("초대코드는 숫자 6자리입니다.");
      return;
    }

    // 0.4초 디바운스 후 DB 조회
    debounceRef.current = setTimeout(async () => {
      setIsValidating(true);
      setError("");
      try {
        const found = await getUserByReferralCode(referralCode);
        if (found) {
          // 자기 자신의 코드는 불가
          if (address && found.walletAddress.toLowerCase() === address.toLowerCase()) {
            setCodeValid(false);
            setError("자신의 초대코드는 사용할 수 없습니다.");
          } else {
            setCodeValid(true);
            setError("");
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

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [referralCode, address]);

  // ── 제출 ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const code = referralCode.trim();

    // 코드를 입력한 경우 유효성 재확인
    if (code) {
      if (!/^\d{6}$/.test(code)) {
        setError("초대코드는 숫자 6자리입니다.");
        return;
      }
      if (codeValid === false) {
        setError("유효하지 않은 초대코드입니다. 정확한 코드를 입력해주세요.");
        return;
      }
      // 아직 검증이 완료되지 않은 경우 (isValidating=true) 기다림
      if (isValidating || codeValid === null) {
        setError("초대코드 확인 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }
    }

    setIsLoading(true);
    try {
      if (code) {
        const REFERRER_KEY = "alphabag_referrer_code";
        localStorage.setItem(REFERRER_KEY, code);
      }
      setReferralCodeRegistered();

      if (isConnected && address) {
        try {
          const userReferralCode = getOrCreateReferralCode(address);

          let referrerWallet: string | null = null;
          if (code) {
            const referrer = await getUserByReferralCode(code);
            if (referrer) referrerWallet = referrer.walletAddress;
          }

          await saveUser(address, {
            referralCode: userReferralCode,
            referrerCode: code || null,
            referrerWallet: referrerWallet,
            isRegistered: true,
          });

          if (referrerWallet && code) {
            await saveReferral(referrerWallet, address, code);
          }
        } catch (firebaseError) {
          console.error("Error saving to Firebase:", firebaseError);
        }
      }

      toast.success(code ? "등록 완료!" : "초대코드 없이 시작합니다.");
      setTimeout(() => navigate("/", { replace: true }), 500);
    } catch (err) {
      setError("등록에 실패했습니다. 다시 시도해주세요.");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">잠시만 기다려주세요...</p>
        </div>
      </div>
    );
  }

  // 입력창 테두리 색상
  const inputBorderClass =
    codeValid === true
      ? "border-green-500 focus-visible:ring-green-500"
      : codeValid === false
      ? "border-red-500 focus-visible:ring-red-500"
      : "";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-metallic">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">AlphaBag에 오신 것을 환영합니다</CardTitle>
          <CardDescription className="text-base mt-2">
            추천인의 <strong>6자리 초대코드</strong>를 입력하세요.<br />
            코드가 없으면 건너뛸 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                {/* 검증 상태 아이콘 */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValidating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  {!isValidating && codeValid === true && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {!isValidating && codeValid === false && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </div>

              {/* 상태 메시지 */}
              {!error && codeValid === true && (
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 유효한 초대코드입니다.
                </p>
              )}
              {!error && codeValid === null && referralCode.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  초대코드가 없으면 빈칸으로 두고 계속하세요.
                </p>
              )}
              {!error && codeValid === null && referralCode.length > 0 && referralCode.length < 6 && (
                <p className="text-xs text-muted-foreground">
                  {referralCode.length} / 6자리 입력 중…
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="gold"
              className="w-full"
              disabled={isLoading || isValidating || (referralCode.length > 0 && codeValid === false)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  등록 중...
                </>
              ) : referralCode.length === 0 ? (
                "초대코드 없이 시작"
              ) : (
                "계속하기"
              )}
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
