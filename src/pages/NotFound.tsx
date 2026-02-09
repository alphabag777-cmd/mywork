import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <img 
          src="/logo.png" 
          alt="AlphaBag Investment Logo" 
          className="w-16 h-16 object-contain mx-auto mb-6"
        />
        <h1 className="mb-4 text-4xl font-bold">{t.notFound.description}</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t.notFound.title}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {t.notFound.returnToHome}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
