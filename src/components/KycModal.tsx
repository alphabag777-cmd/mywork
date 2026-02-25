/**
 * KycModal.tsx
 * KYC 인증 모달 - 이름 + 이메일 + 휴대폰 + Firebase SMS 인증
 */

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Phone, User, Mail, ShieldCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveKyc, getKyc, KycData } from "@/lib/kyc";
import { useAccount } from "wagmi";
import { useAuth } from "@/contexts/AuthContext";

/* ── 국가 코드 목록 ──────────────────────────────────────────── */
const COUNTRY_CODES = [
  { code: "+82",  flag: "🇰🇷", label: "한국" },
  { code: "+1",   flag: "🇺🇸", label: "미국/캐나다" },
  { code: "+86",  flag: "🇨🇳", label: "중국" },
  { code: "+81",  flag: "🇯🇵", label: "일본" },
  { code: "+44",  flag: "🇬🇧", label: "영국" },
  { code: "+65",  flag: "🇸🇬", label: "싱가포르" },
  { code: "+60",  flag: "🇲🇾", label: "말레이시아" },
  { code: "+66",  flag: "🇹🇭", label: "태국" },
  { code: "+84",  flag: "🇻🇳", label: "베트남" },
  { code: "+62",  flag: "🇮🇩", label: "인도네시아" },
];

type Step = "form" | "sms" | "done";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onVerified?: () => void;   // KYC 완료 후 콜백
}

export default function KycModal({ open, onOpenChange, onVerified }: Props) {
  const { toast } = useToast();
  const { address } = useAccount();
  const { firebaseUser } = useAuth();

  // 현재 userId (지갑 or Firebase Auth)
  const userId = address || (firebaseUser ? `auth_${firebaseUser.uid}` : "");

  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [existingKyc, setExistingKyc] = useState<KycData | null>(null);

  // 폼 상태
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [countryCode, setCountryCode] = useState("+82");
  const [phone, setPhone]             = useState("");
  const [smsCode, setSmsCode]         = useState("");
  const [countdown, setCountdown]     = useState(0);

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef    = useRef<RecaptchaVerifier | null>(null);
  const recaptchaDivRef = useRef<HTMLDivElement>(null);

  /* 기존 KYC 상태 조회 */
  useEffect(() => {
    if (!open || !userId) return;
    getKyc(userId).then((data) => {
      if (data) {
        setExistingKyc(data);
        if (data.status === "approved") setStep("done");
        else {
          setName(data.name || "");
          setEmail(data.email || "");
          setPhone(data.phone?.replace(/^\+\d{1,3}/, "") || "");
        }
      }
    });
  }, [open, userId]);

  /* 카운트다운 타이머 */
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  /* 모달 닫힐 때 recaptcha 정리 */
  useEffect(() => {
    if (!open) {
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    }
  }, [open]);

  /* 전화번호 전체 조합 */
  const fullPhone = `${countryCode}${phone.replace(/^0/, "")}`;

  /* ── STEP 1: SMS 전송 ──────────────────────────────────────── */
  async function handleSendSms() {
    if (!name.trim()) {
      toast({ title: "❌ 이름을 입력해 주세요.", variant: "destructive" }); return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "❌ 올바른 이메일을 입력해 주세요.", variant: "destructive" }); return;
    }
    if (!phone.trim() || phone.length < 7) {
      toast({ title: "❌ 올바른 휴대폰 번호를 입력해 주세요.", variant: "destructive" }); return;
    }
    if (!userId) {
      toast({ title: "❌ 지갑 또는 로그인이 필요합니다.", variant: "destructive" }); return;
    }

    setLoading(true);
    try {
      // reCAPTCHA 초기화
      if (!recaptchaRef.current && recaptchaDivRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, recaptchaDivRef.current, {
          size: "invisible",
          callback: () => {},
        });
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        fullPhone,
        recaptchaRef.current!
      );
      confirmationRef.current = confirmation;
      setStep("sms");
      setCountdown(60);
      toast({ title: "📱 인증번호 발송", description: `${fullPhone} 으로 SMS를 전송했습니다.` });
    } catch (err: any) {
      console.error(err);
      const msg =
        err.code === "auth/invalid-phone-number" ? "올바른 전화번호 형식이 아닙니다." :
        err.code === "auth/too-many-requests"    ? "너무 많은 요청입니다. 잠시 후 다시 시도하세요." :
        err.code === "auth/captcha-check-failed" ? "보안 인증에 실패했습니다. 새로고침 후 다시 시도하세요." :
        "SMS 발송에 실패했습니다. 전화번호를 확인해 주세요.";
      toast({ title: "❌ SMS 전송 실패", description: msg, variant: "destructive" });
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    } finally {
      setLoading(false);
    }
  }

  /* ── STEP 2: SMS 코드 확인 ─────────────────────────────────── */
  async function handleVerifySms() {
    if (!smsCode || smsCode.length < 6) {
      toast({ title: "❌ 인증번호 6자리를 입력해 주세요.", variant: "destructive" }); return;
    }
    if (!confirmationRef.current) {
      toast({ title: "❌ 먼저 SMS를 전송해 주세요.", variant: "destructive" }); return;
    }

    setLoading(true);
    try {
      await confirmationRef.current.confirm(smsCode);

      // Firestore KYC 저장
      await saveKyc(userId, {
        name: name.trim(),
        email: email.trim(),
        phone: fullPhone,
        phoneVerified: true,
        status: "pending",
      });

      setStep("done");
      setExistingKyc({ id: userId, name, email, phone: fullPhone, phoneVerified: true, status: "pending", submittedAt: Date.now() });
      toast({ title: "✅ KYC 제출 완료", description: "관리자 승인 후 이용 가능합니다." });
      onVerified?.();
    } catch (err: any) {
      const msg =
        err.code === "auth/invalid-verification-code" ? "인증번호가 올바르지 않습니다." :
        err.code === "auth/code-expired"              ? "인증번호가 만료되었습니다. 다시 전송해 주세요." :
        "인증에 실패했습니다.";
      toast({ title: "❌ 인증 실패", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  /* 재전송 */
  async function handleResend() {
    setSmsCode("");
    setStep("form");
    recaptchaRef.current?.clear();
    recaptchaRef.current = null;
    setTimeout(() => handleSendSms(), 300);
  }

  /* ── 상태 뱃지 ─────────────────────────────────────────────── */
  const StatusBadge = ({ status }: { status: KycData["status"] }) => {
    const map = {
      pending:  { label: "심사 중", cls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" },
      approved: { label: "인증 완료", cls: "bg-green-500/10 text-green-500 border-green-500/30" },
      rejected: { label: "거절됨", cls: "bg-red-500/10 text-red-500 border-red-500/30" },
      none:     { label: "미인증", cls: "bg-muted text-muted-foreground" },
    };
    const s = map[status] || map.none;
    return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShieldCheck className="w-5 h-5 text-primary" />
            KYC 본인인증
          </DialogTitle>
          <DialogDescription>
            세부 정보 열람을 위해 본인인증이 필요합니다.
          </DialogDescription>
        </DialogHeader>

        {/* invisible reCAPTCHA 컨테이너 */}
        <div ref={recaptchaDivRef} id="kyc-recaptcha-container" />

        {/* ── 완료 화면 ── */}
        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-6">
            {existingKyc?.status === "approved" ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-500" />
                <p className="text-lg font-semibold text-green-500">인증 완료!</p>
                <p className="text-sm text-muted-foreground text-center">
                  KYC 인증이 완료되었습니다. 모든 서비스를 이용할 수 있습니다.
                </p>
                <Button className="w-full" onClick={() => onOpenChange(false)}>
                  닫기
                </Button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-yellow-500" />
                </div>
                <StatusBadge status={existingKyc?.status || "pending"} />
                <div className="text-center space-y-1">
                  <p className="font-semibold">KYC 심사 중입니다</p>
                  <p className="text-sm text-muted-foreground">
                    관리자 검토 후 승인됩니다. 보통 24시간 이내 처리됩니다.
                  </p>
                  {existingKyc?.status === "rejected" && existingKyc.rejectReason && (
                    <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-left">
                      <p className="text-xs text-red-500 font-medium">거절 사유:</p>
                      <p className="text-xs text-red-400">{existingKyc.rejectReason}</p>
                    </div>
                  )}
                </div>
                {existingKyc?.status === "rejected" && (
                  <Button variant="outline" className="w-full" onClick={() => setStep("form")}>
                    다시 제출하기
                  </Button>
                )}
                <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
                  닫기
                </Button>
              </>
            )}
          </div>
        )}

        {/* ── STEP 1: 정보 입력 폼 ── */}
        {step === "form" && (
          <div className="space-y-4 py-2">
            {/* 이름 */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm">
                <User className="w-3.5 h-3.5" /> 이름 (실명)
              </Label>
              <Input
                placeholder="홍길동"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                className="h-11 bg-muted/30 border-border/60"
              />
            </div>

            {/* 이메일 */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm">
                <Mail className="w-3.5 h-3.5" /> 이메일
              </Label>
              <Input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                className="h-11 bg-muted/30 border-border/60"
              />
            </div>

            {/* 휴대폰 번호 */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm">
                <Phone className="w-3.5 h-3.5" /> 휴대폰 번호
              </Label>
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-[130px] h-11 bg-muted/30 border-border/60 flex-shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.code} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  placeholder="010-1234-5678"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/[^0-9-]/g, ""))}
                  autoComplete="tel-national"
                  className="h-11 bg-muted/30 border-border/60 flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                앞 0은 자동으로 제거됩니다. 예) 01012345678 → {countryCode}1012345678
              </p>
            </div>

            <Button
              className="w-full h-11 font-semibold"
              onClick={handleSendSms}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Phone className="w-4 h-4 mr-2" />
              )}
              SMS 인증번호 받기
            </Button>
          </div>
        )}

        {/* ── STEP 2: SMS 코드 입력 ── */}
        {step === "sms" && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Phone className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-sm text-primary">
                <span className="font-semibold">{fullPhone}</span> 으로<br />
                6자리 인증번호를 전송했습니다.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">인증번호 6자리</Label>
              <Input
                type="number"
                placeholder="123456"
                value={smsCode}
                onChange={e => setSmsCode(e.target.value.slice(0, 6))}
                className="h-11 bg-muted/30 border-border/60 text-center text-xl tracking-[0.5em] font-mono"
                maxLength={6}
              />
            </div>

            <Button
              className="w-full h-11 font-semibold"
              onClick={handleVerifySms}
              disabled={loading || smsCode.length < 6}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ShieldCheck className="w-4 h-4 mr-2" />
              )}
              인증 확인
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() => setStep("form")}
                className="text-muted-foreground hover:text-foreground underline"
              >
                번호 수정
              </button>
              {countdown > 0 ? (
                <span className="text-muted-foreground">{countdown}초 후 재전송 가능</span>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-primary hover:underline font-medium"
                  disabled={loading}
                >
                  재전송
                </button>
              )}
            </div>
          </div>
        )}

        {/* 안내 문구 */}
        {step === "form" && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/40">
            <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              입력하신 정보는 본인인증 목적으로만 사용되며, 관리자 확인 후 24시간 이내 승인됩니다.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
