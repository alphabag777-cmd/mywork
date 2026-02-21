import React from "react";
import { siteConfig } from "@/site.config";
import {
  Shield, Zap, TrendingUp, Headphones, Star, Globe,
  Lock, Users, Award, Clock, CheckCircle, DollarSign,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Shield, Zap, TrendingUp,
  HeadphonesIcon: Headphones,
  Headphones,
  Star, Globe, Lock, Users, Award, Clock,
  CheckCircle, DollarSign,
};

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-gray-50">
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
            핵심 특징
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            왜 저희를 선택해야 할까요?
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            {siteConfig.tagline}
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {siteConfig.features.map((feature, i) => {
            const Icon = iconMap[feature.icon] ?? Shield;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ background: siteConfig.colors.primary50 }}
                >
                  <Icon
                    size={22}
                    style={{ color: siteConfig.colors.primary600 }}
                  />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
