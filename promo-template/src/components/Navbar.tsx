import React from "react";
import { siteConfig } from "@/site.config";
import { cn } from "@/lib/utils";

interface NavProps {
  activeSection: string;
}

const navItems = [
  { id: "hero",     label: "홈" },
  { id: "features", label: "특징" },
  { id: "services", label: "서비스" },
  { id: "about",    label: "소개" },
  { id: "notice",   label: "공지" },
  { id: "contact",  label: "문의" },
];

export const Navbar: React.FC<NavProps> = ({ activeSection }) => {
  const [open, setOpen] = React.useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => scrollTo("hero")}
          className="text-xl font-bold text-gray-900 hover:opacity-80 transition-opacity"
        >
          {siteConfig.name}
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeSection === item.id
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo("contact")}
            className="ml-3 px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            문의하기
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="메뉴"
        >
          <span className="block w-5 h-0.5 bg-current mb-1" />
          <span className="block w-5 h-0.5 bg-current mb-1" />
          <span className="block w-5 h-0.5 bg-current" />
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="w-full text-left px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {item.label}
            </button>
          ))}
          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => scrollTo("contact")}
              className="w-full py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold"
            >
              문의하기
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
