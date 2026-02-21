import React from "react";
import { siteConfig } from "@/site.config";
import { ChevronDown } from "lucide-react";

export const HeroSection: React.FC = () => {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const lines = siteConfig.hero.headline.split("\n");

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${siteConfig.hero.bgGradientFrom} 0%, ${siteConfig.hero.bgGradientTo} 100%)`,
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: siteConfig.colors.primary500 }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: siteConfig.colors.primary500 }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-8 animate-fade-in">
          {siteConfig.hero.badge}
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6 animate-fade-in-up">
          {lines.map((line, i) => (
            <span key={i} className="block">
              {i === 0 ? (
                line
              ) : (
                <span
                  style={{ color: siteConfig.colors.primary500 }}
                  className="relative"
                >
                  {line}
                  <span
                    className="absolute -bottom-2 left-0 right-0 h-1 rounded-full opacity-60"
                    style={{ background: siteConfig.colors.primary500 }}
                  />
                </span>
              )}
            </span>
          ))}
        </h1>

        {/* Sub headline */}
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up">
          {siteConfig.hero.subheadline}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
          <button
            onClick={() => scrollTo("contact")}
            className="px-8 py-4 rounded-full font-bold text-lg shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl active:scale-95"
            style={{
              background: siteConfig.colors.primary500,
              color: "white",
            }}
          >
            {siteConfig.hero.ctaPrimary}
          </button>
          <button
            onClick={() => scrollTo("features")}
            className="px-8 py-4 rounded-full font-bold text-lg bg-white/10 backdrop-blur-sm border border-white/30 text-white transition-all duration-200 hover:bg-white/20 hover:scale-105"
          >
            {siteConfig.hero.ctaSecondary}
          </button>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in-up">
          {siteConfig.stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-center"
            >
              <div className="text-2xl md:text-3xl font-black text-white">
                {stat.value}
                {stat.suffix && (
                  <span
                    className="text-lg"
                    style={{ color: siteConfig.colors.primary500 }}
                  >
                    {stat.suffix}
                  </span>
                )}
              </div>
              <div className="text-white/60 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={() => scrollTo("features")}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white transition-colors animate-bounce"
        aria-label="스크롤"
      >
        <ChevronDown size={28} />
      </button>
    </section>
  );
};
