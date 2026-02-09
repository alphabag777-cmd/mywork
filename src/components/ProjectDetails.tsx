import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getOrCreateReferralCode, wasReferred } from "@/lib/referral";

interface ProjectDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    name: string;
    label: string;
    percentage?: number;
    dailyProfit?: string;
    focus?: string;
    description: string;
    tags?: string[];
    quickActionsDescription?: string;
    dappUrl?: string;
    youtubeUrl?: string;
    telegram?: string;
    telegramUrl?: string;
    twitter?: string;
    twitterUrl?: string;
    materials?: Array<{ title: string; url: string }>;
  };
}

const ProjectDetails = ({ open, onOpenChange, project }: ProjectDetailsProps) => {
  const { address, isConnected } = useAccount();
  const { t } = useLanguage();
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState<string>("");

  // Get translated content based on project ID
  const getTranslatedFocus = (projectId: string): string => {
    if (projectId === "bbagmaxfi") return t.projects.maxfiProject?.focus || project.focus || "";
    if (projectId === "bbagroomx") return t.projects.roomx?.focus || project.focus || "";
    if (projectId === "bbagcodexfield") return t.projects.codexfield?.focus || project.focus || "";
    return project.focus || "";
  };

  const getTranslatedDescription = (projectId: string): string => {
    if (projectId === "bbagmaxfi") return t.projects.maxfiProject?.description || project.description || "";
    if (projectId === "bbagroomx") return t.projects.roomx?.description || project.description || "";
    if (projectId === "bbagcodexfield") return t.projects.codexfield?.description || project.description || "";
    return project.description || "";
  };

  const getTranslatedQuickActionsDescription = (projectId: string): string => {
    if (projectId === "bbagmaxfi") return t.projects.maxfiProject?.quickActionsDescription || project.quickActionsDescription || "";
    if (projectId === "bbagroomx") return t.projects.roomx?.quickActionsDescription || project.quickActionsDescription || "";
    if (projectId === "bbagcodexfield") return t.projects.codexfield?.quickActionsDescription || project.quickActionsDescription || "";
    return project.quickActionsDescription || "";
  };

  const getTranslatedTag = (tag: string): string => {
    const tagLower = tag.toLowerCase();
    if (tagLower === "resources") return t.projectDetails.resources;
    if (tagLower === "video") return t.projectDetails.video;
    if (tagLower === "blog") return t.projectDetails.blog;
    return tag;
  };

  const getTagLink = (tag: string, project: ProjectDetailsProps["project"], tagIndex: number): string => {
    const tagLower = tag.toLowerCase();
    // Link tags to Resources, Video, Blog
    if (tagIndex === 0 || tagLower === "resources") {
      // First tag -> Resources (materials)
      if (project.materials && project.materials.length > 0) {
        return project.materials[0].url;
      }
      return "#";
    } else if (tagIndex === 1 || tagLower === "video") {
      // Second tag -> Video
      if (project.youtubeUrl) {
        return project.youtubeUrl;
      }
      return "#";
    } else if (tagIndex === 2 || tagLower === "blog") {
      // Third tag -> Blog (Twitter or Telegram)
      if (project.twitterUrl || project.twitter) {
        return project.twitterUrl || project.twitter || "#";
      }
      if (project.telegramUrl || project.telegram) {
        return project.telegramUrl || project.telegram || "#";
      }
      return "#";
    }
    return "#";
  };

  const handlePrepareParticipation = () => {
    if (!isConnected || !address) {
      toast.error(t.staking.pleaseConnectWallet);
      return;
    }

    // Check if user was referred (has a referrer code)
    const hasReferrer = wasReferred();
    
    if (!hasReferrer) {
      // No referrer code registered, show dialog to enter one
      setReferralDialogOpen(true);
    } else {
      // Referrer code exists, add to investment list
      addToInvestmentList();
    }
  };

  const addToInvestmentList = () => {
    if (!address) return;

    // Get existing investment list from localStorage
    const investmentListKey = `investment_list_${address}`;
    const existingList = localStorage.getItem(investmentListKey);
    let investmentList: Array<{ id: string; name: string }> = [];
    
    if (existingList) {
      try {
        investmentList = JSON.parse(existingList);
      } catch (e) {
        console.error("Failed to parse investment list:", e);
      }
    }

    // Check if project is already in the list
    const isAlreadyAdded = investmentList.some(item => item.id === project.id);
    
    if (!isAlreadyAdded) {
      investmentList.push({ id: project.id, name: project.name });
      localStorage.setItem(investmentListKey, JSON.stringify(investmentList));
      toast.success(t.staking.projectAddedToList);
    } else {
      toast.info(t.staking.projectAddedToListDesc);
    }
  };

  const handleRegisterReferralCode = () => {
    if (!referralCodeInput || referralCodeInput.trim() === "") {
      toast.error("Please enter a referral code");
      return;
    }

    // Store the referrer code
    if (address && typeof window !== "undefined") {
      const REFERRER_KEY = "alphabag_referrer_code";
      const existingRef = localStorage.getItem(REFERRER_KEY);
      
      // Only store if not already stored
      if (!existingRef) {
        localStorage.setItem(REFERRER_KEY, referralCodeInput.trim());
        addToInvestmentList();
        setReferralDialogOpen(false);
        setReferralCodeInput("");
        toast.success("Referral code registered successfully");
      } else {
        // Already has a referrer, just add to list
        addToInvestmentList();
        setReferralDialogOpen(false);
        setReferralCodeInput("");
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Project Information */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">{t.projectDetails.title}</h2>
              
              {/* Badges */}
              <div className="space-y-3 mb-6">
                <div className="bg-secondary/50 border border-border rounded-full px-3 py-1.5 text-xs text-muted-foreground inline-block">
                  <span className="font-semibold text-primary">{t.staking.binanceAlpha}</span>
                  <span className="mx-1">•</span>
                  <span>{t.staking.insuranceHedge} • {t.staking.chooseLikeCart}</span>
                </div>
                <div className="block">
                  <div className="bg-primary/20 border border-primary/50 rounded-full px-3 py-1.5 inline-flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span className="text-xs font-semibold text-primary">{t.staking.dailyProfit}: {project.dailyProfit || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Project Name - Keep in English */}
              <h3 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 break-words">
                {project.name}
              </h3>

              {/* Focus/Category */}
              {project.focus && (
                <p className="text-sm text-muted-foreground mb-4">{getTranslatedFocus(project.id)}</p>
              )}

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {getTranslatedDescription(project.id)}
              </p>

              {/* Tags - Clickable links to Resources, Video, Blog */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, tagIndex) => {
                    const tagLink = getTagLink(tag, project, tagIndex);
                    return (
                      <a
                        key={tagIndex}
                        href={tagLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-secondary/50 border border-border rounded-full text-xs text-muted-foreground hover:bg-secondary/70 hover:text-foreground transition-colors cursor-pointer"
                      >
                        {getTranslatedTag(tag)}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2">{t.projectDetails.quickActions}</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {getTranslatedQuickActionsDescription(project.id)}
              </p>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  variant="gold"
                  className="w-full gap-2"
                  onClick={() => {
                    if (project.dappUrl) {
                      window.open(project.dappUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                  {t.staking.goToWebsite}
                </Button>
                <Button
                  variant="gold"
                  className="w-full gap-2"
                  onClick={handlePrepareParticipation}
                >
                  {t.staking.prepareParticipation}
                </Button>
              </div>
            </div>
          </div>
        </div>
        </DialogContent>
      </Dialog>

      {/* Referral Code Dialog */}
      <Dialog open={referralDialogOpen} onOpenChange={setReferralDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.staking.referralCodeRequired}</DialogTitle>
            <DialogDescription>
              {t.staking.referralCodeRequiredDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t.staking.registerReferralCode}
              </label>
              <Input
                type="text"
                placeholder="Enter referral code"
                value={referralCodeInput}
                onChange={(e) => setReferralCodeInput(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              variant="gold"
              className="w-full"
              onClick={handleRegisterReferralCode}
            >
              {t.staking.registerReferralCode}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectDetails;

