import { Coins, Wallet, User, Users, Menu, ShoppingCart, Lock, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  wasReferred,
  generateReferralLink,
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

/** TokenPocket 환경 여부 감지 */
function isTokenPocketBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  // TokenPocket injects window.ethereum.isTokenPocket = true
  // and UA contains "TokenPocket"
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

    // wallet_requestPermissions triggers account picker in TokenPocket
    await ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });

    // After permission granted, get the newly selected account
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
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();

  // Handle referral tracking when wallet connects
  useEffect(() => {
    if (isConnected && address && address !== null && address !== "0x0000000000000000000000000000000000000000") {
      const saveUserData = async () => {
        try {
      // Generate or get user's referral code
      const userReferralCode = getOrCreateReferralCode(address);
      
      // Check if user came from a referral link
      const isReferred = storeReferralFromURL(address);
          const referrerCode = getReferrerCode();
          const referrerWallet = getWalletFromURL();
          
          // Check if user is registered
          const isRegistered = localStorage.getItem("alphabag_referral_registered") === "true";
          
          // Save user to Firebase
          await saveUser(address, {
            referralCode: userReferralCode,
            referrerCode: referrerCode || null,
            referrerWallet: referrerWallet || null,
            isRegistered,
          });
          
          // Update last connected time
          await updateUserConnection(address);
          
          // If user was referred, save referral to Firebase
          if (isReferred && referrerWallet && referrerWallet.startsWith("0x")) {
            try {
              await saveReferral(referrerWallet, address, referrerCode || "");
              // Also update local storage for backward compatibility
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

  /** 
   * 일반: 연결 → open(), 연결됨 → disconnect()
   * TokenPocket 모바일(연결됨): wallet_requestPermissions로 계정 선택 팝업 호출
   */
  const handleWalletClick = useCallback(async () => {
    if (!isConnected) {
      // 연결 안 됨 → 지갑 선택 모달 오픈
      if (isTokenPocketBrowser()) {
        // TokenPocket 내장 브라우저: injected connector로 직접 연결
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

    // 연결됨 상태
    if (isTokenPocketBrowser()) {
      // TokenPocket: 계정 전환 팝업 (wallet_requestPermissions)
      setIsSwitching(true);
      try {
        await requestTokenPocketAccountSwitch();
        // wagmi는 accountsChanged 이벤트로 자동 업데이트됨
      } finally {
        setIsSwitching(false);
      }
    } else {
      disconnect();
    }
  }, [isConnected, open, disconnect, connect, connectors]);

  const isTP = isTokenPocketBrowser();

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

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-shrink-0 ml-auto">
          {/* 토큰 가격 위젯 – 데스크탑 네비 좌측 인라인 배치 */}
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
          <Button variant="gold" size="default" className="gap-2" onClick={handleWalletClick}>
            {isConnected ? (
              <>
                <Wallet className="w-4 h-4" />
                <span className="hidden lg:inline">{address ? formatAddress(address) : t.header.connected}</span>
                <span className="lg:hidden">{address ? formatAddress(address, 4) : ""}</span>
              </>
            ) : (
              <>
                <Coins className="w-4 h-4" />
                <span className="hidden sm:inline">{t.header.connectWallet}</span>
              </>
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-1 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="gold" 
                size="sm" 
                className="gap-1 px-1.5 sm:px-2 h-8 w-8 sm:w-auto sm:h-auto sm:gap-1.5" 
                onClick={handleWalletClick}
                disabled={isSwitching}
              >
                {isSwitching ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : isConnected ? (
                  <>
                    <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {/* TokenPocket: 탭하면 계정 전환 → 아이콘 힌트 표시 */}
                    {isTP && (
                      <span className="hidden sm:inline text-[10px] opacity-70">⇄</span>
                    )}
                    <span className="hidden sm:inline text-xs">{address ? formatAddress(address, 3) : ""}</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isConnected && address
                ? isTP
                  ? `${address} (탭하여 지갑 변경)`
                  : address
                : "Connect Wallet"}
            </TooltipContent>
          </Tooltip>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="px-1.5 sm:px-2 h-8 w-8 sm:w-auto sm:h-auto">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[300px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-3">
                {/* 토큰 가격 – Sheet 상단 */}
                <div className="px-1 py-2 rounded-lg bg-muted/50 border border-border/50">
                  <TokenPriceWidget />
                </div>
                <div className="h-px bg-border/50" />

                {/* TokenPocket 계정 전환 버튼 */}
                {isTP && isConnected && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    disabled={isSwitching}
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      setIsSwitching(true);
                      try {
                        await requestTokenPocketAccountSwitch();
                      } finally {
                        setIsSwitching(false);
                      }
                    }}
                  >
                    {isSwitching ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wallet className="w-4 h-4" />
                    )}
                    {isSwitching ? "전환 중..." : "본인 지갑 변경"}
                    {address && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatAddress(address, 4)}
                      </span>
                    )}
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2" 
                  onClick={() => {
                    navigate("/staking");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Lock className="w-4 h-4" />
                  Staking
                </Button>
                {isConnected && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2 relative" 
                      onClick={() => {
                        navigate("/cart");
                        setMobileMenuOpen(false);
                      }}
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
                      onClick={() => {
                        navigate("/community");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Users className="w-4 h-4" />
                      {t.community.title}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2" 
                      onClick={() => {
                        navigate("/support");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Support
                    </Button>
                    <Button 
                      variant="outline"  
                      className="w-full justify-start gap-2" 
                      onClick={() => {
                        navigate("/profile");
                        setMobileMenuOpen(false);
                      }}
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
    </header>
  );
};

export default Header;
