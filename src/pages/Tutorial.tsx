import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface TutorialStep {
  img: string;
  kr: { title: string; desc: string };
  en: { title: string; desc: string };
  cn: { title: string; desc: string };
  vi: { title: string; desc: string };
}

const steps: TutorialStep[] = [
  {
    img: "/tutorials/step1.jpg",
    kr: { title: "TokenPocket 열기 → DAPP 진입 → AlphaBag 접속", desc: "1) TokenPocket 앱을 엽니다.\n2) DAPP 메뉴로 들어갑니다.\n3) 주소창에 www.alphabag.net 을 입력한 뒤 확인합니다.\n4) AlphaBag DAPP으로 이동합니다." },
    en: { title: "Open TokenPocket → Enter DAPP → Access AlphaBag", desc: "1) Open the TokenPocket app.\n2) Enter the DAPP menu.\n3) Type www.alphabag.net in the address bar and confirm.\n4) You will be redirected to the AlphaBag DAPP." },
    cn: { title: "打开 TokenPocket → 进入 DAPP → 访问 AlphaBag", desc: "1) 打开 TokenPocket 应用。\n2) 进入 DAPP 菜单。\n3) 在地址栏输入 www.alphabag.net 并确认。\n4) 将自动跳转到 AlphaBag DAPP。" },
    vi: { title: "Mở TokenPocket → Vào DAPP → Truy cập AlphaBag", desc: "1) Mở ứng dụng TokenPocket.\n2) Vào mục DAPP.\n3) Nhập www.alphabag.net vào thanh địa chỉ và xác nhận.\n4) Hệ thống sẽ chuyển sang AlphaBag DAPP." }
  },
  {
    img: "/tutorials/step2.jpg",
    kr: { title: "지갑 연결 상태 확인", desc: "지갑이 연결되어 있는지 확인합니다.\n연결이 되어 있지 않다면 Wallet Connect(연결)부터 진행합니다." },
    en: { title: "Check Wallet Connection", desc: "Check whether the wallet is connected.\nIf not connected, complete Wallet Connect first." },
    cn: { title: "确认钱包连接状态", desc: "确认钱包是否已连接。\n如果尚未连接，请先完成 Wallet Connect（连接）。" },
    vi: { title: "Kiểm tra kết nối ví", desc: "Kiểm tra ví đã kết nối chưa.\nNếu chưa, hãy kết nối ví (Wallet Connect) trước." }
  },
  {
    img: "/tutorials/step3.jpg",
    kr: { title: "언어 변경", desc: "지갑 연결이 완료되면,\n언어가 원하는 값인지 확인하고 필요 시 변경합니다." },
    en: { title: "Change Language", desc: "After wallet connection is complete,\ncheck the language setting and change it if needed." },
    cn: { title: "切换语言", desc: "钱包连接完成后，\n确认语言是否为所需语言，如有需要请切换。" },
    vi: { title: "Đổi ngôn ngữ", desc: "Sau khi kết nối ví xong,\nkiểm tra ngôn ngữ và đổi nếu cần." }
  },
  {
    img: "/tutorials/step4.jpg",
    kr: { title: "AlphaBag 소개 확인", desc: "AlphaBag 소개(Introduction) 내용을 확인합니다.\n프로토콜 개요와 안내를 한 번 읽어봅니다." },
    en: { title: "Read AlphaBag Introduction", desc: "Read the AlphaBag Introduction.\nReview the protocol overview and guidance." },
    cn: { title: "查看 AlphaBag 介绍", desc: "查看 AlphaBag 的介绍（Introduction）。\n阅读协议概览与使用说明。" },
    vi: { title: "Xem giới thiệu AlphaBag", desc: "Xem phần Introduction của AlphaBag.\nĐọc tổng quan và hướng dẫn." }
  },
  {
    img: "/tutorials/step5.jpg",
    kr: { title: "뒤로가기 → 레지스트리(Registry) 이동", desc: "뒤로가기를 클릭합니다.\n그 다음 Registry 메뉴로 이동합니다." },
    en: { title: "Back → Go to Registry", desc: "Tap Back.\nThen go to the Registry menu." },
    cn: { title: "返回 → 进入 Registry", desc: "点击返回。\n然后进入 Registry 菜单。" },
    vi: { title: "Quay lại → Vào Registry", desc: "Bấm Quay lại.\nSau đó vào mục Registry." }
  },
  {
    img: "/tutorials/step6.jpg",
    kr: { title: "프로젝트별 레지스트리 등록", desc: "프로젝트 별로 추천인에게 받은 레지스트리를 등록합니다.\n(프로젝트마다 등록이 필요할 수 있습니다.)" },
    en: { title: "Register Registry per Project", desc: "Register the referrer registry for each project.\n(Registration may be required per project.)" },
    cn: { title: "按项目注册 Registry", desc: "按项目注册从推荐人处获得的 registry。\n（不同项目可能需要分别注册。）" },
    vi: { title: "Đăng ký registry theo dự án", desc: "Đăng ký registry người giới thiệu theo từng dự án.\n(Có thể cần đăng ký theo từng dự án.)" }
  },
  {
    img: "/tutorials/step7.jpg",
    kr: { title: "내 추천코드 복사/등록", desc: "프로젝트별 로그인이 완료되면 내 추천코드를 복사합니다.\nAlphaBag 추천코드란에 붙여넣어 저장해 두면\n추후 산하 유저에게 제공하기 편리합니다." },
    en: { title: "Copy/Register Your Referral Code", desc: "After completing login per project, copy your referral code.\nPaste it into the AlphaBag referral code field to save it.\nIt will be useful for sharing with downline users later." },
    cn: { title: "复制/注册我的推荐码", desc: "各项目登录完成后，复制我的推荐码。\n将其粘贴到 AlphaBag 的推荐码栏并保存，\n方便后续提供给下级用户。" },
    vi: { title: "Sao chép/đăng ký mã giới thiệu của bạn", desc: "Sau khi đăng nhập theo từng dự án, sao chép mã giới thiệu của bạn.\nDán vào ô mã giới thiệu trên AlphaBag để lưu.\nRất tiện để chia sẻ cho tuyến dưới sau này." }
  },
  {
    img: "/tutorials/step8.jpg",
    kr: { title: "프로젝트 선택 → 상세정보 확인 → ADD TO CART", desc: "산하(프로젝트 목록)에서 투자 희망 프로젝트를 선택합니다.\n세부정보를 확인한 뒤, 바로 투자하려면 ADD TO CART를 눌러 장바구니에 담습니다.\n참여준비 시 추천코드가 미등록이면 먼저 등록해야 합니다." },
    en: { title: "Select Project → View Details → ADD TO CART", desc: "Select the project you want from the list.\nReview details, then tap ADD TO CART to add it to your cart.\nIf the referral code isn't registered, register it first before participation." },
    cn: { title: "选择项目 → 查看详情 → ADD TO CART", desc: "在项目列表中选择想投资的项目。\n查看详情后，如需立即参与，点击 ADD TO CART 加入购物车。\n若尚未注册推荐码，请先完成注册再参与。" },
    vi: { title: "Chọn dự án → Xem chi tiết → ADD TO CART", desc: "Chọn dự án bạn muốn trong danh sách.\nXem chi tiết rồi bấm ADD TO CART để thêm vào giỏ.\nNếu chưa đăng ký mã giới thiệu, hãy đăng ký trước khi tham gia." }
  },
  {
    img: "/tutorials/step9.jpg",
    kr: { title: "CART → 수량/금액 입력 → Participate(승인)", desc: "오른쪽 햄버거 메뉴를 클릭하여, 메뉴에서 CART로 들어갑니다.\nCART로 들어가 수량을 확인합니다.\n최종 금액에서 희망 금액을 입력합니다. (기본 1000U)\n최소 250USDT부터(프로젝트별 상이) 투자가 진행됩니다.\n금액 입력 후 Participate 버튼을 누르고 Approval(승인)을 확인합니다." },
    en: { title: "CART → Enter Amount → Participate (Approval)", desc: "Open CART from the hamburger menu and confirm the quantity.\nEnter your desired amount (default 1000U).\nInvestment starts from 250 USDT (varies by project).\nTap Participate and confirm Approval." },
    cn: { title: "CART → 输入数量/金额 → Participate（授权）", desc: "点击右侧汉堡菜单，在菜单中进入 CART。\n进入 CART 后确认数量。\n在最终金额处输入想要的金额（默认 1000U）。\n投资最低从 250 USDT 起（不同项目可能不同）。\n输入金额后点击 Participate，并确认 Approval（授权）。" },
    vi: { title: "CART → Nhập số tiền → Participate (Approval)", desc: "Nhấn menu (≡) để vào CART và kiểm tra số lượng.\nNhập số tiền muốn đầu tư (mặc định 1000U).\nTối thiểu từ 250 USDT (tùy dự án).\nBấm Participate và xác nhận Approval." }
  },
  {
    img: "/tutorials/step10.jpg",
    kr: { title: "전송 완료 → Open → 프로젝트 DAPP 투자 완료 확인", desc: "마지막 부분에서 SBAG/CBAG 자금은 이미 전송되었고\n남은 BBBAG 자금은 별도로 해당 프로젝트의 레퍼럴 코드가 포함된 주소를 확인하고 Open을 누릅니다.\n프로젝트 DAPP으로 이동해 로그인 후 투자 진행.\n최종 자금 출금이 완료되면 투자 완료로 확인되며,\n투자 상세 목록은 Profile에서 확인 가능합니다." },
    en: { title: "Transfer Done → Open → Confirm Project DAPP Investment", desc: "At the final step, SBAG/CBAG funds have already been transferred.\nFor the remaining BBBAG funds, check the address containing the project's referral code and tap Open.\nGo to the project DAPP, log in, and proceed with the investment.\nOnce the final funds are deducted, the investment is confirmed as completed.\nYou can view the detailed investment list in Profile." },
    cn: { title: "转账完成 → Open → 确认项目 DAPP 投资完成", desc: "最后一步中，SBAG/CBAG 资金已完成转账。\n剩余的 BBBAG 资金需要另外确认包含该项目推荐码的地址，并点击 Open。\n进入项目 DAPP 后登录并进行投资。\n当最终资金扣除完成，即可确认投资完成。\n投资详情列表可在 Profile 中查看。" },
    vi: { title: "Hoàn tất chuyển → Open → Xác nhận đầu tư trên DAPP dự án", desc: "Ở bước cuối, tiền SBAG/CBAG đã được chuyển xong.\nVới phần BBBAG còn lại, hãy kiểm tra địa chỉ có kèm mã giới thiệu của dự án và bấm Open.\nVào DAPP của dự án, đăng nhập và tiến hành đầu tư.\nKhi tiền được trừ lần cuối, xem như đã hoàn tất.\nXem danh sách chi tiết trong mục Profile." }
  }
];

type TutorialLang = "kr" | "en" | "cn" | "vi";

const Tutorial = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [tutorialLang, setTutorialLang] = useState<TutorialLang>("kr");
  const [currentStep, setCurrentStep] = useState(0);
  const [hasImage, setHasImage] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);

  // Map project language to tutorial language
  useEffect(() => {
    const langMap: Record<string, TutorialLang> = {
      ko: "kr",
      en: "en",
      zh: "cn",
      vi: "vi"
    };
    setTutorialLang(langMap[language] || "kr");
  }, [language]);

  // Reset image state when step changes
  useEffect(() => {
    setHasImage(false);
  }, [currentStep]);

  const currentStepData = steps[currentStep];
  const content = currentStepData[tutorialLang] || currentStepData.kr;

  const getSubtitle = () => {
    const total = steps.length;
    const n = currentStep + 1;
    if (tutorialLang === "kr") return `모바일 메뉴 사용법 (${n}/${total})`;
    if (tutorialLang === "en") return `Mobile Guide (${n}/${total})`;
    if (tutorialLang === "cn") return `手机教程 (${n}/${total})`;
    return `Hướng dẫn mobile (${n}/${total})`;
  };

  const getButtonLabels = () => {
    if (tutorialLang === "kr") {
      return {
        prev: "← 이전",
        next: "다음 →",
        finish: "완료"
      };
    }
    if (tutorialLang === "en") {
      return {
        prev: "← Prev",
        next: "Next →",
        finish: "Finish"
      };
    }
    if (tutorialLang === "cn") {
      return {
        prev: "← 上一步",
        next: "下一步 →",
        finish: "完成"
      };
    }
    return {
      prev: "← Trước",
      next: "Tiếp →",
      finish: "Hoàn tất"
    };
  };

  const buttonLabels = getButtonLabels();
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleImageLoad = () => {
    setHasImage(true);
  };

  const handleImageError = () => {
    setHasImage(false);
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Navigate to home page when finish button is clicked
      navigate("/");
    }
  };

  const handleDotClick = (index: number) => {
    setCurrentStep(index);
  };

  // Swipe handling
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleTouchStart = (e: TouchEvent) => {
      startXRef.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (startXRef.current === null) return;
      const dx = e.changedTouches[0].clientX - startXRef.current;
      startXRef.current = null;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) handleNext();
      else handlePrev();
    };

    card.addEventListener("touchstart", handleTouchStart, { passive: true });
    card.addEventListener("touchend", handleTouchEnd);

    return () => {
      card.removeEventListener("touchstart", handleTouchStart);
      card.removeEventListener("touchend", handleTouchEnd);
    };
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0d10] via-[#0b0d10] to-[#0b0d10]">
      <Header />
      <div className="max-w-[520px] mx-auto px-3.5 py-2 mt-[88px] sm:mt-20">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2.5 px-2.5 py-2 pb-2 backdrop-blur-sm bg-[rgba(11,13,16,0.65)] border-b border-white/10">
          <div className="flex flex-col gap-0.5">
            <div className="font-extrabold tracking-wide">AlphaBag Tutorial</div>
            <div className="text-xs text-[#b8c0cc]">{getSubtitle()}</div>
          </div>
          <div className="flex gap-1.5 items-center flex-wrap justify-end">
            {(["kr", "en", "cn", "vi"] as TutorialLang[]).map((lang) => {
              const labels: Record<TutorialLang, string> = { kr: "KR", en: "EN", cn: "CN", vi: "VN" };
              return (
                <button
                  key={lang}
                  onClick={() => setTutorialLang(lang)}
                  className={`px-2.5 py-2 rounded-full text-xs cursor-pointer select-none border transition-all ${
                    tutorialLang === lang
                      ? "border-[rgba(242,185,75,0.6)] text-white shadow-[0_0_0_3px_rgba(242,185,75,0.12)]"
                      : "border-white/10 bg-[rgba(18,21,27,0.75)] text-[#b8c0cc]"
                  }`}
                >
                  {labels[lang]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mx-2.5 my-2 h-2.5 rounded-full bg-white/6 overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-[rgba(242,185,75,0.95)] to-[rgba(242,185,75,0.35)] transition-all duration-250"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Card */}
        <section
          ref={cardRef}
          className="bg-[rgba(18,21,27,0.78)] border border-white/10 rounded-[18px] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)] mx-2.5 mt-2"
        >
          {/* Meta */}
          <div className="flex items-center justify-between gap-2.5 mb-2">
            <div className="flex items-center gap-2 text-xs text-[#b8c0cc]">
              <div className="w-6 h-6 rounded-lg bg-[rgba(242,185,75,0.12)] border border-[rgba(242,185,75,0.35)] text-white font-extrabold flex items-center justify-center text-xs">
                {currentStep + 1}
              </div>
              <span>STEP {currentStep + 1}</span>
            </div>
            <div className="text-xs text-[#b8c0cc]">
              {currentStep + 1} / {steps.length}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-base font-black tracking-wide mb-1.5">{content.title}</h1>

          {/* Description */}
          <p className="mb-2 text-[#b8c0cc] text-xs leading-relaxed whitespace-pre-line">{content.desc}</p>

          {/* Image Slot */}
          <div className={`w-full aspect-[3/4] rounded-xl border border-dashed ${hasImage ? "border-[rgba(242,185,75,0.35)]" : "border-[rgba(242,185,75,0.35)]"} bg-black overflow-hidden relative`}>
            {currentStepData.img && (
              <img
                src={currentStepData.img}
                alt="tutorial screenshot"
                className={`w-full h-full object-contain bg-black ${hasImage ? "block" : "hidden"}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
            {!hasImage && (
              <div className="absolute inset-0 flex items-center justify-center text-center p-4 text-[rgba(184,192,204,0.9)] text-xs leading-tight">
                {tutorialLang === "kr" ? (
                  <>
                    이미지를 아직 넣지 않았습니다.<br />
                    파일 경로: {currentStepData.img && <code className="inline-block bg-white/6 px-1.5 py-0.5 rounded-lg border border-white/10 text-white/90 ml-1">{currentStepData.img}</code>}
                  </>
                ) : tutorialLang === "en" ? (
                  <>
                    Image not found yet.<br />
                    Path: {currentStepData.img && <code className="inline-block bg-white/6 px-1.5 py-0.5 rounded-lg border border-white/10 text-white/90 ml-1">{currentStepData.img}</code>}
                  </>
                ) : tutorialLang === "cn" ? (
                  <>
                    尚未找到图片。<br />
                    路径: {currentStepData.img && <code className="inline-block bg-white/6 px-1.5 py-0.5 rounded-lg border border-white/10 text-white/90 ml-1">{currentStepData.img}</code>}
                  </>
                ) : (
                  <>
                    Chưa có ảnh.<br />
                    Đường dẫn: {currentStepData.img && <code className="inline-block bg-white/6 px-1.5 py-0.5 rounded-lg border border-white/10 text-white/90 ml-1">{currentStepData.img}</code>}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-2 mt-2.5 mx-2.5">
            <Button
              variant="outline"
              className="flex-1 py-2 border-white/10 bg-[rgba(18,21,27,0.8)] text-white font-extrabold active:translate-y-px disabled:opacity-45 disabled:cursor-not-allowed text-xs sm:text-sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              {buttonLabels.prev}
            </Button>
            <Button
              variant="gold"
              className="flex-1 py-2 border-[rgba(242,185,75,0.55)] shadow-[0_0_0_3px_rgba(242,185,75,0.1)] font-extrabold active:translate-y-px text-xs sm:text-sm"
              onClick={handleNext}
            >
              {currentStep === steps.length - 1 ? buttonLabels.finish : buttonLabels.next}
            </Button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-2 mx-2.5 flex-wrap">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-2 h-2 rounded-full border cursor-pointer transition-all ${
                  index === currentStep
                    ? "bg-[rgba(242,185,75,0.85)] border-[rgba(242,185,75,0.55)]"
                    : "bg-white/18 border-white/10"
                }`}
              />
            ))}
          </div>

          {/* Footer Note */}
          {/* <div className="mt-2 mx-3 text-[rgba(184,192,204,0.75)] text-[10px] leading-tight text-center">
            {tutorialLang === "kr" ? (
              <>이미지 파일만 넣으면 자동 표시됩니다. (예: <code className="inline-block bg-white/6 px-1.5 py-0.5 rounded-lg border border-white/10 text-white/90 ml-1">/tutorials/step10.jpg</code>)</>
            ) : tutorialLang === "en" ? (
              <>Images will be displayed automatically. (e.g.: <code className="inline-block bg-white/6 px-1.5 py-0.5 rounded-lg border border-white/10 text-white/90 ml-1">/tutorials/step10.jpg</code>)</>
            ) : tutorialLang === "cn" ? (
              <>图片文件会自动显示。（例如：<code className="inline-block bg-white/6 px-1.5 py-0.5 rounded-lg border border-white/10 text-white/90 ml-1">/tutorials/step10.jpg</code>）</>
            ) : (
              <>Ảnh sẽ tự động hiển thị. (VD: <code className="inline-block bg-white/6 px-1.5 py-0.5 rounded-lg border border-white/10 text-white/90 ml-1">/tutorials/step10.jpg</code>)</>
            )}
          </div> */}
        </section>
      </div>
    </div>
  );
};

export default Tutorial;
