import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Language } from "@/lib/i18n/translations";
import { Check, Copy, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ReferralLink {
  id: string;
  name: string;
  logo: string;
  placeholder: string;
  link: string;
  saved: boolean;
}

const REFERRAL_LINKS_STORAGE_KEY = "alphabag_referral_links";

const ReferralRegistrationSection = () => {
  const { t, language, setLanguage } = useLanguage();
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialLinks: ReferralLink[] = useMemo(() => [
    {
      id: "maxfi",
      name: t.referral.projectMaxFi,
      logo: "/max.png",
      placeholder: t.referral.maxFiUrl,
      link: "",
      saved: false,
    },
    {
      id: "loomx",
      name: t.referral.projectLoomX,
      logo: "/loomx.png",
      placeholder: t.referral.loomXUrl,
      link: "",
      saved: false,
    },
    {
      id: "codexfield",
      name: t.referral.projectCodexField,
      logo: "/codex.png",
      placeholder: t.referral.codexFieldUrl,
      link: "",
      saved: false,
    },
  ], [t]);

  const [links, setLinks] = useState<ReferralLink[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(REFERRAL_LINKS_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return initialLinks.map(item => {
            const storedItem = parsed.find((p: ReferralLink) => p.id === item.id);
            return storedItem || item;
          });
        } catch (e) {
          console.error("Failed to parse stored links:", e);
        }
      }
    }
    return initialLinks;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(REFERRAL_LINKS_STORAGE_KEY, JSON.stringify(links));
    }
  }, [links]);

  const handleLinkChange = (id: string, value: string) => {
    setLinks(prev =>
      prev.map(link =>
        link.id === id ? { ...link, link: value, saved: false } : link
      )
    );
  };

  const handleSave = (id: string) => {
    setLinks(prev =>
      prev.map(link =>
        link.id === id ? { ...link, saved: true } : link
      )
    );
    toast.success(t.referral.linkSaved);
  };

  const handleCopy = async (link: ReferralLink) => {
    if (link.link) {
      try {
        await navigator.clipboard.writeText(link.link);
        toast.success(t.referral.linkCopied);
      } catch (e) {
        toast.error("Failed to copy link");
      }
    } else {
      toast.error("No link to copy");
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleDelete = (id: string) => {
    setLinks(prev =>
      prev.map(link =>
        link.id === id ? { ...link, link: "", saved: false } : link
      )
    );
    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    toast.success(t.referral.linkDeleted);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCopySelected = async () => {
    if (selectedProjects.size === 0) {
      toast.error(t.referral.selectProjects);
      return;
    }

    const linksToCopy = links
      .filter(link => selectedProjects.has(link.id) && link.link)
      .map(link => `${link.name}: ${link.link}`)
      .join("\n");

    if (linksToCopy) {
      try {
        await navigator.clipboard.writeText(linksToCopy);
        toast.success(t.referral.linkCopied);
      } catch (e) {
        toast.error("Failed to copy links");
      }
    }
  };

  const handleSaveAll = () => {
    setLinks(prev =>
      prev.map(link => ({ ...link, saved: link.link ? true : link.saved }))
    );
    toast.success(t.referral.allLinksSaved);
  };

  const handleResetAll = () => {
    setLinks(initialLinks);
    setSelectedProjects(new Set());
    setEditingId(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(REFERRAL_LINKS_STORAGE_KEY);
    }
    toast.success(t.referral.allLinksReset);
  };

  const languages: { code: Language; name: string }[] = [
    { code: "en", name: "English" },
    { code: "zh", name: "中文" },
    { code: "ko", name: "한국어" },
  ];

  return (
    <Card className="mb-8 border-border/50">
      <CardHeader>
        <CardTitle className="text-red-500 text-2xl md:text-3xl font-bold mb-2">
          {t.referral.registrationTitle}
        </CardTitle>
        <div className="mb-4">
          <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
            {t.referral.alphaBagTitle}
          </h3>
          <CardDescription className="text-sm md:text-base">
            {t.referral.registrationDescription}
          </CardDescription>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border">
          {/* Language Selector */}
          <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue>
                {languages.find(l => l.code === language)?.name || "English"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleCopySelected}
              disabled={selectedProjects.size === 0}
            >
              {t.referral.copySelected}
            </Button>
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSaveAll}
            >
              {t.referral.saveAll}
            </Button>
            <Button
              variant="outline"
              onClick={handleResetAll}
            >
              {t.referral.resetAll}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Project Links */}
        <div className="space-y-4">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border border-border bg-secondary/30"
            >
              {/* Left: Icon and Name */}
              <div className="flex items-center gap-3 min-w-[200px]">
                <img
                  src={link.logo}
                  alt={link.name}
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/logo.png";
                  }}
                />
                <div>
                  <div className="font-semibold text-foreground">{link.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.referral.saved}: {link.saved ? "✓" : "-"}
                  </div>
                </div>
              </div>

              {/* Center: Input Field */}
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder={link.placeholder}
                  value={link.link}
                  onChange={(e) => handleLinkChange(link.id, e.target.value)}
                  disabled={editingId !== null && editingId !== link.id}
                  className="w-full"
                />
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Select Checkbox */}
                <button
                  onClick={() => handleToggleSelect(link.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedProjects.has(link.id)
                      ? "bg-primary border-primary"
                      : "border-border"
                  }`}
                >
                  {selectedProjects.has(link.id) && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                </button>

                {/* Save/Check Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSave(link.id)}
                  className={link.saved ? "text-green-500" : ""}
                  disabled={!link.link}
                >
                  <Check className="w-4 h-4" />
                </Button>

                {/* Copy Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(link)}
                  disabled={!link.link}
                >
                  <Copy className="w-4 h-4" />
                </Button>

                {/* Edit Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(link.id)}
                >
                  <Edit className="w-4 h-4" />
                </Button>

                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(link.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Status Bar */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">{t.referral.statusIdle}</span>{" "}
            {t.referral.statusIdleDescription}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralRegistrationSection;

