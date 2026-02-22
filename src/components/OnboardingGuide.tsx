/**
 * OnboardingGuide – 신규 사용자를 위한 3단계 시작 가이드 팝업
 * 첫 방문 시 자동 표시, localStorage로 완료 상태 저장.
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ShoppingBag,
  Gift,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
} from "lucide-react";

const ONBOARDING_KEY = "alphabag_onboarding_done";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  tip: string;
  color: string;
}

const STEPS: Step[] = [
  {
    icon: <Wallet className="w-10 h-10" />,
    title: "지갑 연결",
    description: "MetaMask 또는 지원되는 지갑을 BSC(BNB Smart Chain) 네트워크로 연결하세요.",
    tip: "BSC 네트워크가 없다면 화면 안내에 따라 자동 추가됩니다.",
    color: "text-yellow-500",
  },
  {
    icon: <ShoppingBag className="w-10 h-10" />,
    title: "투자 상품 선택",
    description: "홈 화면에서 관심 있는 투자 상품을 선택해 장바구니에 추가하세요.",
    tip: "상품 카드의 '세부' 버튼으로 상세 정보와 수익률을 확인할 수 있습니다.",
    color: "text-blue-500",
  },
  {
    icon: <Gift className="w-10 h-10" />,
    title: "추천 코드 입력 & 공유",
    description: "추천인이 있다면 지갑 주소(추천 코드)를 입력하세요. 가입 후 내 링크를 공유해 추가 보상을 받으세요.",
    tip: "프로필 → 레퍼럴 링크 카드에서 1클릭으로 텔레그램·카카오톡 공유가 가능합니다.",
    color: "text-green-500",
  },
];

interface Props {
  /** 지갑 연결 상태 – 연결됐으면 팝업을 열지 않음 */
  forceShow?: boolean;
}

export const OnboardingGuide = ({ forceShow }: Props) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    if (forceShow) { setOpen(true); return; }
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setOpen(true);
  }, [forceShow]);

  const markDone = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setOpen(false);
  };

  const next = () => {
    setCompleted((prev) => {
      const n = [...prev];
      n[step] = true;
      return n;
    });
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      markDone();
    }
  };

  const prev = () => { if (step > 0) setStep(step - 1); };

  const current = STEPS[step];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) markDone(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        {/* Progress bar */}
        <div className="flex h-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 transition-colors duration-300 ${
                i < step ? "bg-primary" : i === step ? "bg-primary/60" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Close */}
        <button
          onClick={markDone}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors z-10"
          aria-label="닫기"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Content */}
        <div className="p-6 pt-4 flex flex-col items-center text-center gap-4">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 self-start">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === step ? "bg-primary w-4" : completed[i] ? "bg-primary/40" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className={`w-20 h-20 rounded-full bg-muted flex items-center justify-center ${current.color}`}>
            {current.icon}
          </div>

          {/* Step number */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              단계 {step + 1} / {STEPS.length}
            </span>
            {completed[step] && <Check className="w-3.5 h-3.5 text-green-500" />}
          </div>

          {/* Title + description */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
          </div>

          {/* Tip */}
          <div className="w-full p-3 rounded-lg bg-primary/5 border border-primary/20 text-left">
            <p className="text-xs text-primary font-medium mb-0.5">💡 팁</p>
            <p className="text-xs text-muted-foreground">{current.tip}</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between w-full pt-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={prev}
              disabled={step === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              이전
            </Button>

            <Button size="sm" onClick={next} className="gap-1 flex-1">
              {step === STEPS.length - 1 ? (
                <>
                  시작하기!
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  다음
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {/* Skip */}
          <button
            onClick={markDone}
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
          >
            건너뛰기
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingGuide;
