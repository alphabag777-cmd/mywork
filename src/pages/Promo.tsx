/**
 * Promo.tsx — BBAG 프로젝트 집중 홍보 랜딩 페이지
 *
 * - Firebase에서 BBAG 카테고리 플랜을 가져와 2~3개 선정 표시
 * - wallet1Percentage > 0 인 플랜 = BBAG 플랜으로 분류
 * - 레퍼럴 링크 자동 포함 (연결된 지갑 기반)
 * - 지갑 미연결 상태에서도 완전 열람 가능 (홍보 목적)
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { getAllPlans, InvestmentPlan } from "@/lib/plans";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  TrendingUp,
  Shield,
  Zap,
  Star,
  Users,
  BarChart3,
  ChevronDown,
  ExternalLink,
  Sparkles,
  Globe,
  Lock,
  Award,
} from "lucide-react";
import Header from "@/components/Header";

/* ── 숫자 카운트 애니메이션 훅 ───────────────────────────────────── */
function useCountUp(target: number, duration = 1800, trigger = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, trigger]);
  return count;
}

/* ── 플랜에서 BBAG 해당 여부 판별 ───────────────────────────────── */
function isBBAGPlan(plan: InvestmentPlan) {
  // wallet1Percentage > 0 이거나 tokenSymbol이 BBAG이면 BBAG 플랜으로 분류
  return (plan.wallet1Percentage ?? 0) > 0 || plan.tokenSymbol === "BBAG";
}

/* ── 일일 수익률 숫자 추출 ────────────────────────────────────────── */
function parseDailyProfit(val: string): number {
  const match = val?.replace(/[^0-9.]/g, "");
  return parseFloat(match) || 0;
}

/* ── 통계 섹션 아이템 ───────────────────────────────────────────── */
interface StatItem { label: string; value: number; suffix: string; prefix?: string }

/* ────────────────────────────────────────────────────────────────── */
/*                         메인 컴포넌트                              */
/* ────────────────────────────────────────────────────────────────── */
export default function Promo() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const { t } = useLanguage();

  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  /* Firebase에서 BBAG 플랜 로드 */
  useEffect(() => {
    getAllPlans()
      .then((all) => {
        const bbag = all
          .filter(isBBAGPlan)
          .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
          .slice(0, 3); // 최대 3개 선정
        setPlans(bbag);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* 통계 섹션 IntersectionObserver */
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* 레퍼럴 링크 생성 */
  const buildInvestLink = (planId: string) => {
    const base = `/promo/${planId}`;
    return address ? `${base}?ref=${address}` : base;
  };

  /* 통계 데이터 */
  const STATS: StatItem[] = [
    { label: "누적 투자자",   value: 1240, suffix: "명+",   prefix: "" },
    { label: "총 투자 금액",  value: 3800, suffix: "K+",    prefix: "$" },
    { label: "평균 일일 수익", value: 15,  suffix: "%+",    prefix: "" },
    { label: "파트너 프로젝트",value: 12,  suffix: "개",    prefix: "" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Header />

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-20 overflow-hidden">
        {/* 배경 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-yellow-400/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 container mx-auto px-4 text-center max-w-4xl">
          {/* 상단 뱃지 */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            BBAG 핵심 프로젝트 집중 공개
          </div>

          {/* 헤드라인 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            <span className="text-foreground">스마트한 투자자들이</span>
            <br />
            <span className="bg-gradient-to-r from-yellow-400 via-primary to-yellow-300 bg-clip-text text-transparent">
              선택한 프로젝트
            </span>
          </h1>

          {/* 서브 카피 */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            AlphaBag이 엄선한 BBAG 핵심 프로젝트에 투자하고
            <br className="hidden sm:block" />
            <strong className="text-foreground">안정적인 일일 수익</strong>을 경험하세요.
          </p>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="gap-2 text-base px-8 h-12 bg-gradient-to-r from-yellow-500 to-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
              onClick={() => {
                document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Star className="w-5 h-5" />
              프로젝트 보기
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
            {!isConnected && (
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-base px-8 h-12 border-primary/40 hover:bg-primary/10"
                onClick={() => open()}
              >
                <Globe className="w-5 h-5" />
                지갑 연결하기
              </Button>
            )}
          </div>

          {/* 스크롤 힌트 */}
          <div className="mt-16 flex flex-col items-center text-muted-foreground/50 animate-bounce">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* ── 통계 배너 ──────────────────────────────────────────────── */}
      <section ref={statsRef} className="py-14 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <StatCard key={s.label} stat={s} visible={statsVisible} />
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY BBAG ──────────────────────────────────────────────── */}
      <section className="py-20 container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            Why BBAG?
          </Badge>
          <h2 className="text-3xl font-bold mb-3">AlphaBag이 BBAG을 선택한 이유</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            검증된 수익 구조와 투명한 운영으로 신뢰할 수 있는 투자 환경을 제공합니다.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: <Shield className="w-7 h-7 text-blue-400" />,
              title: "안전한 구조",
              desc: "스마트 컨트랙트 기반의 투명한 투자 시스템으로 자금 안전성을 보장합니다.",
              color: "bg-blue-500/10 border-blue-500/20",
            },
            {
              icon: <TrendingUp className="w-7 h-7 text-green-400" />,
              title: "일일 수익 지급",
              desc: "매일 정산되는 수익으로 꾸준한 현금 흐름을 만들어 드립니다.",
              color: "bg-green-500/10 border-green-500/20",
            },
            {
              icon: <Zap className="w-7 h-7 text-yellow-400" />,
              title: "빠른 시작",
              desc: "지갑 연결만으로 즉시 투자 참여가 가능합니다. 복잡한 절차 없음.",
              color: "bg-yellow-500/10 border-yellow-500/20",
            },
          ].map((item) => (
            <Card
              key={item.title}
              className={`border ${item.color} hover:scale-[1.02] transition-transform duration-200`}
            >
              <CardContent className="p-6 flex flex-col items-start gap-4">
                <div className={`p-3 rounded-xl ${item.color}`}>{item.icon}</div>
                <div>
                  <h3 className="font-bold text-base mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── 핵심 프로젝트 ─────────────────────────────────────────── */}
      <section id="projects" className="py-20 bg-muted/20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-yellow-400/50 text-yellow-500">
              Featured Projects
            </Badge>
            <h2 className="text-3xl font-bold mb-3">엄선된 BBAG 핵심 프로젝트</h2>
            <p className="text-muted-foreground">
              수백 개 프로젝트 중 AlphaBag이 직접 검증한 최고 수익 프로젝트입니다.
            </p>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>프로젝트를 불러오는 중입니다…</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${plans.length === 1 ? "max-w-sm mx-auto" : plans.length === 2 ? "sm:grid-cols-2 max-w-2xl mx-auto" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {plans.map((plan, idx) => (
                <ProjectCard
                  key={plan.id}
                  plan={plan}
                  rank={idx + 1}
                  onDetail={() => navigate(buildInvestLink(plan.id))}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW TO INVEST ────────────────────────────────────────── */}
      <section className="py-20 container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            How It Works
          </Badge>
          <h2 className="text-3xl font-bold mb-3">투자 방법 3단계</h2>
          <p className="text-muted-foreground">간단한 3단계로 수익 창출을 시작하세요.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 relative">
          {/* 연결선 (데스크탑) */}
          <div className="hidden sm:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-primary/50 to-primary/50 z-0" />
          {[
            { step: "01", icon: <Globe className="w-6 h-6" />, title: "지갑 연결", desc: "MetaMask 또는 WalletConnect로\n빠르게 연결하세요." },
            { step: "02", icon: <Star className="w-6 h-6" />, title: "프로젝트 선택", desc: "마음에 드는 BBAG\n프로젝트를 선택하세요." },
            { step: "03", icon: <TrendingUp className="w-6 h-6" />, title: "수익 시작", desc: "USDT 입금 후\n매일 수익을 확인하세요." },
          ].map((s) => (
            <div key={s.step} className="relative z-10 flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50">
              <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-4">
                {s.icon}
              </div>
              <span className="text-xs text-primary font-mono font-bold mb-1">{s.step}</span>
              <h3 className="font-bold text-base mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 신뢰 지표 ─────────────────────────────────────────────── */}
      <section className="py-16 bg-muted/20 border-y border-border/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: <Lock className="w-5 h-5" />, text: "스마트 컨트랙트\n보안 감사 완료" },
              { icon: <Shield className="w-5 h-5" />, text: "BSC 메인넷\n검증 네트워크" },
              { icon: <Award className="w-5 h-5" />, text: "24/7 실시간\n수익 정산" },
              { icon: <Users className="w-5 h-5" />, text: "레퍼럴 보상\n프로그램 운영" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {item.icon}
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-yellow-500/10 pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
            지금 바로
            <span className="bg-gradient-to-r from-yellow-400 to-primary bg-clip-text text-transparent">
              {" "}수익을 시작{" "}
            </span>
            하세요
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            수천 명의 투자자들이 이미 AlphaBag과 함께하고 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="gap-2 text-base px-10 h-13 bg-gradient-to-r from-yellow-500 to-primary hover:opacity-90 shadow-xl shadow-primary/30"
              onClick={() => isConnected ? navigate("/staking") : open()}
            >
              {isConnected ? (
                <><ArrowRight className="w-5 h-5" /> 투자 시작하기</>
              ) : (
                <><Globe className="w-5 h-5" /> 지갑 연결 후 시작</>
              )}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="gap-2 text-base px-8 h-13"
              onClick={() => navigate("/")}
            >
              메인으로 돌아가기
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── 통계 카드 컴포넌트 ──────────────────────────────────────────── */
function StatCard({ stat, visible }: { stat: StatItem; visible: boolean }) {
  const count = useCountUp(stat.value, 1800, visible);
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-3xl font-extrabold text-foreground">
        {stat.prefix}{count.toLocaleString()}{stat.suffix}
      </span>
      <span className="text-sm text-muted-foreground">{stat.label}</span>
    </div>
  );
}

/* ── 프로젝트 카드 컴포넌트 ─────────────────────────────────────── */
function ProjectCard({
  plan,
  rank,
  onDetail,
}: {
  plan: InvestmentPlan;
  rank: number;
  onDetail: () => void;
}) {
  const dailyPct = parseDailyProfit(plan.dailyProfit);
  const isTop = rank === 1;

  return (
    <div
      className={[
        "relative rounded-2xl border bg-card overflow-hidden flex flex-col",
        "hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer",
        isTop
          ? "border-yellow-400/60 shadow-lg shadow-yellow-400/10"
          : "border-border/60",
      ].join(" ")}
      onClick={onDetail}
    >
      {/* 상단 컬러 바 */}
      <div className={`h-1 w-full ${isTop ? "bg-gradient-to-r from-yellow-400 to-primary" : "bg-gradient-to-r from-primary/60 to-primary/30"}`} />

      {/* 랭킹 뱃지 */}
      {isTop && (
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-500 text-xs font-bold">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          TOP PICK
        </div>
      )}

      <div className="p-6 flex flex-col gap-4 flex-1">
        {/* 로고 + 이름 */}
        <div className="flex items-center gap-3">
          {plan.logo ? (
            <img
              src={plan.logo}
              alt={plan.name}
              className="w-12 h-12 rounded-xl object-cover border border-border/50"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-base leading-tight">{plan.name}</h3>
            <span className="text-xs text-muted-foreground">{plan.label}</span>
          </div>
        </div>

        {/* 일일 수익률 큰 표시 */}
        <div className="text-center py-4 rounded-xl bg-gradient-to-b from-green-500/10 to-transparent border border-green-500/20">
          <p className="text-xs text-muted-foreground mb-1">일일 예상 수익률</p>
          <p className="text-3xl font-extrabold text-green-400">
            {plan.dailyProfit || `${dailyPct}%`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">매일 지급</p>
        </div>

        {/* 태그 */}
        {plan.tags && plan.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {plan.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* 설명 */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
          {plan.description || plan.focus}
        </p>

        {/* 핵심 지표 */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {plan.minInvestment && (
            <div className="flex flex-col bg-muted/40 rounded-lg px-3 py-2">
              <span className="text-muted-foreground">최소 투자</span>
              <span className="font-semibold mt-0.5">{plan.minInvestment}</span>
            </div>
          )}
          {plan.lockupPeriod && (
            <div className="flex flex-col bg-muted/40 rounded-lg px-3 py-2">
              <span className="text-muted-foreground">락업 기간</span>
              <span className="font-semibold mt-0.5">{plan.lockupPeriod}</span>
            </div>
          )}
          {plan.network && (
            <div className="flex flex-col bg-muted/40 rounded-lg px-3 py-2">
              <span className="text-muted-foreground">네트워크</span>
              <span className="font-semibold mt-0.5">{plan.network}</span>
            </div>
          )}
          {plan.riskLevel && (
            <div className="flex flex-col bg-muted/40 rounded-lg px-3 py-2">
              <span className="text-muted-foreground">리스크</span>
              <span className={`font-semibold mt-0.5 ${plan.riskLevel === "Low" ? "text-green-500" : plan.riskLevel === "High" ? "text-red-500" : "text-yellow-500"}`}>
                {plan.riskLevel}
              </span>
            </div>
          )}
        </div>

        {/* CTA */}
        <Button
          className={`w-full mt-auto gap-2 ${isTop ? "bg-gradient-to-r from-yellow-500 to-primary hover:opacity-90" : ""}`}
          onClick={(e) => { e.stopPropagation(); onDetail(); }}
        >
          자세히 보기
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
