import { useLanguage } from "@/lib/i18n/LanguageContext";
import { MessageCircle, Twitter, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="relative z-50 py-12 border-t border-border/50 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src="/logo.png" 
              alt="AlphaBag Investment Logo" 
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
            />
            <span className="font-display font-bold text-base sm:text-lg lg:text-xl text-foreground">
              <span>ALPHABAG </span>
              <span className="text-primary">INVESTMENT</span>
            </span>
          </div>

          {/* Links & Socials */}
          <div className="flex flex-wrap items-center justify-center gap-4">
             {/* Company Registration Link */}
             <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Link to="/company-registration">
                <Building2 className="w-4 h-4" />
                <span>Company Registration</span>
              </Link>
            </Button>

            <div className="h-4 w-px bg-border hidden sm:block" />

            {/* Socials */}
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
                  <span>Telegram</span>
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
                  <span>Twitter</span>
                </a>
              </Button>
            </div>
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
