import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage, Language } from '@/lib/i18n/LanguageContext';

const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'EN' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
];

/** 데스크탑용 – DropdownMenu */
export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const currentLang = languages.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="gap-2">
          <Globe className="w-4 h-4" />
          <span>{currentLang?.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[200]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={language === lang.code ? 'bg-secondary font-semibold' : ''}
          >
            <span className="font-medium">{lang.nativeName}</span>
            <span className="ml-2 text-xs text-muted-foreground">({lang.name})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** 모바일 Sheet 안에서 사용하는 인라인 언어 선택 버튼 그룹 */
export function LanguageSelectorInline({ onSelect }: { onSelect?: () => void }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 px-1 mb-1">
        <Globe className="w-3.5 h-3.5" /> Language
      </p>
      <div className="flex gap-2 flex-wrap">
        {languages.map((lang) => (
          <Button
            key={lang.code}
            variant={language === lang.code ? 'default' : 'outline'}
            size="sm"
            className="flex-1 text-sm"
            onClick={() => {
              setLanguage(lang.code);
              onSelect?.();
            }}
          >
            {lang.nativeName}
          </Button>
        ))}
      </div>
    </div>
  );
}

/** 모바일 상단 헤더 바에 가로로 나열되는 미니 언어 버튼 (텍스트만) */
export function LanguageSelectorBar() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1">
      {languages.map((lang, idx) => (
        <span key={lang.code} className="flex items-center">
          <button
            onClick={() => setLanguage(lang.code)}
            className={`text-[11px] font-medium px-0.5 transition-colors ${
              language === lang.code
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {lang.nativeName}
          </button>
          {idx < languages.length - 1 && (
            <span className="text-border mx-0.5 text-[10px]">|</span>
          )}
        </span>
      ))}
    </div>
  );
}
