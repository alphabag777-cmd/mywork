/**
 * BottomNav — 모바일 전용 하단 고정 네비게이션 탭바
 *
 * - md(768px) 이상에서는 완전히 숨김 (헤더 메뉴 사용)
 * - 지갑 미연결 시: 홈 / 스테이킹 / 지갑연결 3탭
 * - 지갑 연결 시: 홈 / 스테이킹 / 커뮤니티 / 내역 / 프로필 5탭
 * - 현재 경로 하이라이트
 * - Safe Area Inset(iOS 노치/홈바) 대응
 */

import { useLocation, useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import {
  Home,
  Lock,
  Users,
  User,
  Wallet,
  Megaphone,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface TabItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  action?: () => void;
  badge?: number;
}

export default function BottomNav() {
  const { isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const location  = useLocation();
  const navigate  = useNavigate();
  void useCart(); // cart context 유지 (향후 badge 복원용)

  // 관리자 페이지에서는 숨김
  if (location.pathname.startsWith("/admin")) return null;

  /* ── 탭 정의 ── */
  const connectedTabs: TabItem[] = [
    { label: "홈",     icon: Home,        path: "/" },
    { label: "스테이킹", icon: Lock,       path: "/staking" },
    { label: "홍보",   icon: Megaphone,   path: "/promo" },
    { label: "커뮤니티", icon: Users,      path: "/community" },
    { label: "프로필", icon: User,         path: "/profile" },
  ];

  const disconnectedTabs: TabItem[] = [
    { label: "홈",     icon: Home,        path: "/" },
    { label: "홍보",   icon: Megaphone,   path: "/promo" },
    { label: "스테이킹", icon: Lock,      path: "/staking" },
    {
      label: "지갑연결",
      icon: Wallet,
      path: "",
      action: () => open(),
    },
  ];

  const tabs = isConnected ? connectedTabs : disconnectedTabs;

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleTab = (tab: TabItem) => {
    if (tab.action) { tab.action(); return; }
    if (tab.path) navigate(tab.path);
  };

  return (
    /* md 이상에서 숨김 | Safe-area-inset-bottom 대응 */
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/90 backdrop-blur-xl border-t border-border/50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className={`grid h-16 ${tabs.length === 5 ? "grid-cols-5" : "grid-cols-3"}`}>
        {tabs.map((tab) => {
          const active = tab.path ? isActive(tab.path) : false;
          const Icon   = tab.icon;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => handleTab(tab)}
              style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
              className={[
                "flex flex-col items-center justify-center gap-0.5 relative transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground active:text-foreground",
              ].join(" ")}
            >
              {/* 아이콘 + 뱃지 */}
              <span className="relative">
                <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                )}
              </span>

              {/* 레이블 */}
              <span className={`text-[10px] font-medium leading-none ${active ? "font-bold" : ""}`}>
                {tab.label}
              </span>

              {/* 활성 인디케이터 */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
