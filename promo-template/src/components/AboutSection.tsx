import React from "react";
import { siteConfig } from "@/site.config";
import { CheckCircle } from "lucide-react";

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Text */}
          <div>
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
              style={{
                background: siteConfig.colors.primary50,
                color: siteConfig.colors.primary700,
              }}
            >
              회사 소개
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">
              {siteConfig.about.title}
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              {siteConfig.about.description}
            </p>
            <ul className="space-y-4">
              {siteConfig.about.points.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle
                    size={20}
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: siteConfig.colors.primary500 }}
                  />
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() =>
                document
                  .getElementById("contact")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all hover:scale-105 active:scale-95 shadow-md"
              style={{ background: siteConfig.colors.primary600 }}
            >
              파트너십 문의
            </button>
          </div>

          {/* Right - Visual card */}
          <div className="relative">
            <div
              className="rounded-3xl p-8 text-white overflow-hidden shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${siteConfig.hero.bgGradientFrom}, ${siteConfig.hero.bgGradientTo})`,
              }}
            >
              {/* Decorative circles */}
              <div
                className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20"
                style={{ background: siteConfig.colors.primary500 }}
              />
              <div
                className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-20"
                style={{ background: siteConfig.colors.primary500 }}
              />

              <div className="relative z-10">
                <div className="text-5xl font-black mb-2">
                  {siteConfig.name}
                </div>
                <div
                  className="text-lg font-medium mb-8"
                  style={{ color: siteConfig.colors.primary500 }}
                >
                  {siteConfig.tagline}
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-2 gap-4">
                  {siteConfig.stats.slice(0, 4).map((stat, i) => (
                    <div
                      key={i}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                    >
                      <div className="text-2xl font-black text-white">
                        {stat.value}
                        {stat.suffix && (
                          <span
                            className="text-base"
                            style={{ color: siteConfig.colors.primary500 }}
                          >
                            {stat.suffix}
                          </span>
                        )}
                      </div>
                      <div className="text-white/60 text-xs mt-1">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
