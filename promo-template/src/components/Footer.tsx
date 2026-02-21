import React from "react";
import { siteConfig } from "@/site.config";

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      className="py-12 text-white"
      style={{
        background: siteConfig.hero.bgGradientTo,
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div>
            <div className="text-2xl font-black mb-1">{siteConfig.name}</div>
            <div className="text-white/50 text-sm">{siteConfig.tagline}</div>
          </div>

          {/* Contact */}
          <div className="text-center md:text-right">
            <div className="text-white/60 text-sm mb-1">문의</div>
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="text-white hover:underline"
            >
              {siteConfig.contact.email}
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-white/40 text-xs">
          <span>© {year} {siteConfig.name}. All rights reserved.</span>
          <div className="flex gap-4">
            <span className="hover:text-white/70 cursor-pointer transition-colors">개인정보처리방침</span>
            <span className="hover:text-white/70 cursor-pointer transition-colors">이용약관</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
