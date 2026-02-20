/**
 * ============================================================
 * site.config.ts  —  사업별 핵심 설정 파일
 * ============================================================
 * 새 사업 홍보사이트를 만들 때 이 파일만 수정하면 됩니다.
 * Firebase 설정은 .env.local 파일에 별도 관리합니다.
 * ============================================================
 */

export interface SiteConfig {
  /** 사이트/사업 이름 */
  name: string;
  /** 짧은 슬로건 (Hero 섹션 표시) */
  tagline: string;
  /** 사이트 설명 (SEO, OG 태그) */
  description: string;
  /** 브랜드 색상 (Tailwind CSS 팔레트 형식) */
  colors: {
    primary50: string;
    primary100: string;
    primary500: string;
    primary600: string;
    primary700: string;
    primary900: string;
  };
  /** Hero 섹션 */
  hero: {
    badge: string;         // 상단 뱃지 텍스트
    headline: string;      // 메인 헤드라인
    subheadline: string;   // 서브 헤드라인
    ctaPrimary: string;    // 주 CTA 버튼 텍스트
    ctaSecondary: string;  // 보조 CTA 버튼 텍스트
    bgGradientFrom: string;
    bgGradientTo: string;
  };
  /** 핵심 통계 (숫자 강조) */
  stats: Array<{
    label: string;
    value: string;
    suffix?: string;
  }>;
  /** 특징/장점 섹션 */
  features: Array<{
    icon: string;          // lucide-react 아이콘 이름
    title: string;
    description: string;
  }>;
  /** 서비스/상품 섹션 */
  services: Array<{
    name: string;
    price: string;
    period?: string;
    description: string;
    features: string[];
    highlighted?: boolean; // 추천 서비스 강조
  }>;
  /** 팀/회사 소개 */
  about: {
    title: string;
    description: string;
    points: string[];
  };
  /** 문의/연락처 */
  contact: {
    email: string;
    phone?: string;
    kakao?: string;
    telegram?: string;
    address?: string;
  };
  /** 소셜 링크 */
  social?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
  };
  /** 문의 접수 Firebase 컬렉션 이름 */
  inquiryCollection: string;
  /** 공지사항 Firebase 컬렉션 이름 */
  noticeCollection: string;
}

// ============================================================
// ✏️ 여기서 사업별 내용을 수정하세요
// ============================================================
export const siteConfig: SiteConfig = {
  name: "사업명 입력",
  tagline: "짧고 강렬한 슬로건을 입력하세요",
  description: "사이트 설명 (SEO 최적화용) - 150자 이내",

  colors: {
    primary50:  "#eff6ff",
    primary100: "#dbeafe",
    primary500: "#3b82f6",
    primary600: "#2563eb",
    primary700: "#1d4ed8",
    primary900: "#1e3a8a",
  },

  hero: {
    badge: "🚀 신규 오픈",
    headline: "메인 헤드라인을\n여기에 입력",
    subheadline: "서브 헤드라인 — 핵심 가치를 한 두 문장으로 설명하세요.",
    ctaPrimary: "지금 시작하기",
    ctaSecondary: "자세히 보기",
    bgGradientFrom: "#1e3a8a",
    bgGradientTo: "#0f172a",
  },

  stats: [
    { label: "가입 회원", value: "10,000", suffix: "+" },
    { label: "누적 거래액", value: "$5M", suffix: "+" },
    { label: "만족도", value: "98", suffix: "%" },
    { label: "운영 기간", value: "3", suffix: "년" },
  ],

  features: [
    {
      icon: "Shield",
      title: "안전한 운영",
      description: "검증된 시스템으로 안전하게 운영합니다.",
    },
    {
      icon: "Zap",
      title: "빠른 처리",
      description: "실시간으로 빠르게 처리됩니다.",
    },
    {
      icon: "TrendingUp",
      title: "높은 수익",
      description: "업계 최고 수준의 수익을 제공합니다.",
    },
    {
      icon: "HeadphonesIcon",
      title: "24/7 지원",
      description: "언제나 전담 고객지원팀이 대기합니다.",
    },
  ],

  services: [
    {
      name: "스타터",
      price: "$100",
      period: "/월",
      description: "입문자를 위한 기본 플랜",
      features: ["기능 A", "기능 B", "이메일 지원"],
    },
    {
      name: "프로",
      price: "$300",
      period: "/월",
      description: "성장하는 비즈니스를 위한 추천 플랜",
      features: ["기능 A", "기능 B", "기능 C", "우선 지원", "전용 매니저"],
      highlighted: true,
    },
    {
      name: "엔터프라이즈",
      price: "문의",
      description: "대규모 운영을 위한 맞춤형 플랜",
      features: ["모든 기능 포함", "전용 서버", "전담 팀", "SLA 보장"],
    },
  ],

  about: {
    title: "우리에 대해",
    description: "회사/팀 소개를 여기에 작성하세요. 신뢰성을 높이는 내용을 포함하면 좋습니다.",
    points: [
      "설립 연도 및 배경",
      "핵심 팀 소개",
      "주요 성과 및 실적",
      "비전 및 미션",
    ],
  },

  contact: {
    email: "contact@example.com",
    phone: "+82-10-0000-0000",
    kakao: "@카카오채널ID",
    telegram: "@telegramID",
  },

  social: {
    twitter: "https://twitter.com/",
    instagram: "https://instagram.com/",
  },

  inquiryCollection: "inquiries",
  noticeCollection: "notices",
};
