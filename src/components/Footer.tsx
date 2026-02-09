import { useLanguage } from "@/lib/i18n/LanguageContext";
import { MessageCircle, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="py-12 border-t border-border/50 bg-dark-surface/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src="/logo.png" 
              alt="AlphaBag Investment Logo" 
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
            />
            <span className="font-display font-bold text-base sm:text-lg lg:text-xl text-foreground">
              <span className="hidden sm:inline">ALPHABAG </span>
              <span className="text-primary">INVESTMENT</span>
            </span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2"
            >
              <a
                href="https://t.me/alphabagdao"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Telegram</span>
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2"
            >
              <a
                href="https://x.com/ALPHABAG_DAO"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
                <span className="hidden sm:inline">Twitter</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-border/30 text-center">
          <p className="text-sm text-muted-foreground">
            {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
