import React from "react";
import { siteConfig } from "@/site.config";
import { Check, Star } from "lucide-react";

export const ServicesSection: React.FC = () => {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
            style={{
              background: siteConfig.colors.primary50,
              color: siteConfig.colors.primary700,
            }}
          >
            서비스 플랜
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            맞춤형 서비스를 선택하세요
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            다양한 플랜으로 최적의 솔루션을 제공합니다.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {siteConfig.services.map((service, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-8 border-2 transition-all duration-200 hover:shadow-xl ${
                service.highlighted
                  ? "border-blue-500 shadow-lg scale-105"
                  : "border-gray-100 bg-white hover:-translate-y-1"
              }`}
              style={
                service.highlighted
                  ? {
                      borderColor: siteConfig.colors.primary500,
                      background: `linear-gradient(135deg, ${siteConfig.colors.primary900}08, white)`,
                    }
                  : {}
              }
            >
              {/* Recommended badge */}
              {service.highlighted && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-4 py-1.5 rounded-full text-white text-xs font-bold shadow-md"
                  style={{ background: siteConfig.colors.primary500 }}
                >
                  <Star size={12} fill="white" />
                  추천 플랜
                </div>
              )}

              <h3 className="text-xl font-black text-gray-900 mb-2">
                {service.name}
              </h3>
              <p className="text-gray-500 text-sm mb-5">
                {service.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                <span
                  className="text-4xl font-black"
                  style={{
                    color: service.highlighted
                      ? siteConfig.colors.primary600
                      : "#111827",
                  }}
                >
                  {service.price}
                </span>
                {service.period && (
                  <span className="text-gray-400 text-sm ml-1">
                    {service.period}
                  </span>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {service.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <div
                      className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: siteConfig.colors.primary50,
                      }}
                    >
                      <Check
                        size={11}
                        style={{ color: siteConfig.colors.primary600 }}
                      />
                    </div>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() =>
                  document
                    .getElementById("contact")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
                style={
                  service.highlighted
                    ? {
                        background: siteConfig.colors.primary500,
                        color: "white",
                      }
                    : {
                        background: siteConfig.colors.primary50,
                        color: siteConfig.colors.primary700,
                      }
                }
              >
                {service.price === "문의" ? "견적 문의하기" : "시작하기"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
