import { Coins, Wallet, User, Users, Menu, ShoppingCart, Lock, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount, useDisconnect, useConnect } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { formatAddress } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { NotificationCenter } from "@/components/NotificationCenter";
import { TokenPriceWidget } from "@/components/TokenPriceWidget";
import { 
  getOrCreateReferralCode, 
  storeReferralFromURL, 
  addDirectReferral,
  getWalletFromURL,
  getReferrerCode
} from "@/lib/referral";
import { saveUser, updateUserConnection } from "@/lib/users";
import { saveReferral } from "@/lib/referrals";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LanguageSelector, LanguageSelectorBar } from "@/components/LanguageSelector";
import { useCart } from "@/contexts/CartContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { WalletAddressDialog } from "@/components/WalletAddressDialog";

/** TokenPocket 환경 여부 감지 */
function isTokenPocketBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    ua.includes("TokenPocket") ||
    !!(window as any).ethereum?.isTokenPocket
  );
}

/** TokenPocket에서 계정 전환 요청 */
async function requestTokenPocketAccountSwitch(): Promise<string | null> {
  try {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return null;

    await ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });

    const accounts: string[] = await ethereum.request({
      method: "eth_requestAccounts",
    });
    return accounts?.[0] ?? null;
  } catch (err) {
    console.warn("TokenPocket account switch cancelled or failed:", err);
    return null;
  }
}

const Header = () => {
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  const { connectors, connect } = useConnect();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();
  const isTP = isTokenPocketBrowser();

  // Handle referral tracking when wallet connects
  useEffect(() => {
    if (isConnected && address && address !== null && address !== "0x0000000000000000000000000000000000000000") {
      const saveUserData = async () => {
        try {
          const userReferralCode = getOrCreateReferralCode(address);
          const isReferred = storeReferralFromURL(address);
          const referrerCode = getReferrerCode();
          const referrerWallet = getWalletFromURL();
          const isRegistered = localStorage.getItem("alphabag_referral_registered") === "true";
          
          await saveUser(address, {
            referralCode: userReferralCode,
            referrerCode: referrerCode || null,
            referrerWallet: referrerWallet || null,
            isRegistered,
          });
          await updateUserConnection(address);
          
          if (isReferred && referrerWallet && referrerWallet.startsWith("0x")) {
            try {
              await saveReferral(referrerWallet, address, referrerCode || "");
              addDirectReferral(referrerWallet, address);
            } catch (error) {
              console.error("Error saving referral:", error);
            }
          }
          
          console.log("Wallet connected:", address);
          console.log("User referral code:", userReferralCode);
          console.log("Was referred:", isReferred);
        } catch (error) {
          console.error("Error saving user data:", error);
        }
      };
      saveUserData();
    }
  }, [isConnected, address]);

  /** 지갑 버튼 클릭 핸들러
   *  - 미연결: 지갑 선택 모달 오픈
   *  - 연결됨: WalletAddressDialog 오픈 (주소 확인 → 복사/전환/해제 선택)
   */
  const handleWalletClick = useCallback(async () => {
    if (!isConnected) {
      if (isTP) {
        setIsSwitching(true);
        try {
          const injectedConnector = connectors.find(
            (c) => c.id === "injected" || c.type === "injected"
          );
          if (injectedConnector) {
            connect({ connector: injectedConnector });
          } else {
            open();
          }
        } finally {
          setIsSwitching(false);
        }
      } else {
        open();
      }
      return;
    }
    // 연결됨 → 주소 확인 Dialog 오픈
    setWalletDialogOpen(true);
  }, [isConnected, open, connect, connectors, isTP]);

  /** Dialog 내부 "계정 전환" 액션 */
  const handleAccountSwitch = useCallback(async () => {
    setIsSwitching(true);
    try {
      await requestTokenPocketAccountSwitch();
    } finally {
      setIsSwitching(false);
    }
  }, []);

  /** Dialog 내부 "연결 해제" 액션 */
  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      {/* 모바일 전용 상단 바 – 가격 ticker + 언어 선택 */}
      <div className="flex md:hidden items-center justify-between gap-2 px-3 py-1 bg-muted/60 border-b border-border/30 text-xs">
        <TokenPriceWidget compact />
        <LanguageSelectorBar />
      </div>

      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 sm:gap-3 flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <img 
            src="/logo.png" 
            alt="AlphaBag Investment Logo" 
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
          />
          <span className="font-display font-bold text-lg sm:text-xl text-foreground">
            AlphaBag
          </span>
        </button>

        {/* ─── Desktop Navigation ─── */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-shrink-0 ml-auto">
          <div className="hidden lg:flex">
            <TokenPriceWidget />
          </div>
          <LanguageSelector />
          <Button 
            variant="outline" 
            size="default" 
            className="gap-2" 
            onClick={() => navigate("/staking")}
          >
            <Lock className="w-4 h-4" />
            Staking
          </Button>
          {isConnected && (
            <>
              <NotificationCenter />
              <Button 
                variant="outline" 
                size="default" 
                className="gap-2 relative" 
                onClick={() => navigate("/cart")}
              >
                <ShoppingCart className="w-4 h-4" />
                Cart
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount > 9 ? "9+" : cartItemCount}
                  </span>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="default" 
                className="gap-2" 
                onClick={() => navigate("/community")}
              >
                <Users className="w-4 h-4" />
                {t.community.title}
              </Button>
              <Button 
                variant="outline" 
                size="default" 
                className="gap-2" 
                onClick={() => navigate("/support")}
              >
                <MessageSquare className="w-4 h-4" />
                Support
              </Button>
              <Button 
                variant="outline" 
                size="default" 
                className="gap-2" 
                onClick={() => navigate("/profile")}
              >
                <User className="w-4 h-4" />
                Profile
              </Button>
            </>
          )}
          {/* 지갑 버튼 – 클릭 시 항상 Dialog 오픈 (연결 후) */}
          <Button
            variant="gold"
            size="default"
            className="gap-2"
            onClick={handleWalletClick}
            disabled={isSwitching}
          >
            {isSwitching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">연결 중...</span>
              </>
            ) : isConnected ? (
              <>
                <Wallet className="w-4 h-4" />
                {/* 데스크탑: 긴 주소 / 중간: 짧은 주소 */}
                <span className="hidden lg:inline font-mono">{address ? formatAddress(address) : t.header.connected}</span>
                <span className="lg:hidden font-mono">{address ? formatAddress(address, 4) : ""}</span>
              </>
            ) : (
              <>
                <Coins className="w-4 h-4" />
                <span className="hidden sm:inline">{t.header.connectWallet}</span>
              </>
            )}
          </Button>
        </div>

        {/* ─── Mobile Navigation ─── */}
        <div className="flex md:hidden items-center gap-1 flex-shrink-0">
          {/* 지갑 버튼 */}
          <Button 
            variant="gold" 
            size="sm" 
            className="gap-1 px-2 h-8 w-auto" 
            onClick={handleWalletClick}
            disabled={isSwitching}
          >
            {isSwitching ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isConnected ? (
              <>
                <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs font-mono">{address ? formatAddress(address, 4) : ""}</span>
              </>
            ) : (
              <>
                <Coins className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs">{t.header.connectWallet}</span>
              </>
            )}
          </Button>

          {/* 햄버거 메뉴 */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="px-1.5 h-8 w-8">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[300px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-3">
                {/* 토큰 가격 */}
                <div className="px-1 py-2 rounded-lg bg-muted/50 border border-border/50">
                  <TokenPriceWidget />
                </div>
                <div className="h-px bg-border/50" />

                {/* 연결된 경우 – 지갑 주소 확인 버튼 (Sheet 내) */}
                {isConnected && address && (
                  <button
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors text-left"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setTimeout(() => setWalletDialogOpen(true), 150);
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground">
                        {isTP ? "TokenPocket 연결됨" : "지갑 연결됨"}
                      </span>
                      <span className="text-sm font-mono font-semibold text-amber-700 dark:text-amber-400 truncate">
                        {formatAddress(address, 6)}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground border border-border/50 rounded px-1.5 py-0.5">
                      상세
                    </span>
                  </button>
                )}

                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2" 
                  onClick={() => { navigate("/staking"); setMobileMenuOpen(false); }}
                >
                  <Lock className="w-4 h-4" />
                  Staking
                </Button>
                {isConnected && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2 relative" 
                      onClick={() => { navigate("/cart"); setMobileMenuOpen(false); }}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Cart
                      {cartItemCount > 0 && (
                        <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {cartItemCount > 9 ? "9+" : cartItemCount}
                        </span>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2" 
                      onClick={() => { navigate("/community"); setMobileMenuOpen(false); }}
                    >
                      <Users className="w-4 h-4" />
                      {t.community.title}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2" 
                      onClick={() => { navigate("/support"); setMobileMenuOpen(false); }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Support
                    </Button>
                    <Button 
                      variant="outline"  
                      className="w-full justify-start gap-2" 
                      onClick={() => { navigate("/profile"); setMobileMenuOpen(false); }}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Button>
                  </>
                )}
                {!isConnected && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Connect your wallet to access all features
                  </p>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* ─── 지갑 주소 확인 Dialog (PC/모바일 공통) ─── */}
      {isConnected && address && (
        <WalletAddressDialog
          open={walletDialogOpen}
          onOpenChange={setWalletDialogOpen}
          address={address}
          isTokenPocket={isTP}
          isSwitching={isSwitching}
          onSwitch={handleAccountSwitch}
          onDisconnect={handleDisconnect}
        />
      )}
    </header>
  );
};

export default Header;
