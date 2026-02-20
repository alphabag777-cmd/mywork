import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { ServicesSection } from "@/components/ServicesSection";
import { AboutSection } from "@/components/AboutSection";
import { NoticeSection } from "@/components/NoticeSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { useActiveSection } from "@/hooks/useActiveSection";
import { siteConfig } from "@/site.config";
import { applyBrandColors } from "@/lib/utils";

const SECTIONS = ["hero", "features", "services", "about", "notice", "contact"];

export default function App() {
  const activeSection = useActiveSection(SECTIONS);

  // 브랜드 색상 주입
  useEffect(() => {
    applyBrandColors(siteConfig.colors);
    // 페이지 타이틀 동적 설정
    document.title = siteConfig.name;
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar activeSection={activeSection} />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ServicesSection />
        <AboutSection />
        <NoticeSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
