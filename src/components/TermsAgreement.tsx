import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const AGREEMENT_STORAGE_KEY = "alphabag_agreement_accepted";

export function useAgreementAccepted() {
  const [accepted, setAccepted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(AGREEMENT_STORAGE_KEY) === "true";
  });

  const acceptAgreement = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(AGREEMENT_STORAGE_KEY, "true");
      setAccepted(true);
    }
  };

  return { accepted, acceptAgreement };
}

export function TermsAgreement() {
  const { accepted, acceptAgreement } = useAgreementAccepted();
  const [open, setOpen] = useState(!accepted);
  const [agreed, setAgreed] = useState(false);
  const { t } = useLanguage();

  const handleAgree = () => {
    if (agreed) {
      acceptAgreement();
      setOpen(false);
    }
  };

  // Don't show if already accepted
  if (accepted) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={() => {
      // Prevent closing without agreeing - modal must remain open
    }} modal={true}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {t.agreement.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t.agreement.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Section 1 */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {t.agreement.section1Title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {t.agreement.section1Content}
            </p>
          </div>

          {/* Section 2 */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {t.agreement.section2Title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {t.agreement.section2Content}
            </p>
          </div>

          {/* Section 3 */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {t.agreement.section3Title}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {t.agreement.section3Intro}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>{t.agreement.section3Point1}</li>
              <li>{t.agreement.section3Point2}</li>
              <li>{t.agreement.section3Point3}</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {t.agreement.section4Title}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {t.agreement.section4Intro}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>{t.agreement.section4Point1}</li>
              <li>{t.agreement.section4Point2}</li>
              <li>{t.agreement.section4Point3}</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {t.agreement.section5Title}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {t.agreement.section5Intro}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t.agreement.section5Content}
            </p>
          </div>

          {/* Section 6 */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {t.agreement.section6Title}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {t.agreement.section6Intro}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>{t.agreement.section6Point1}</li>
              <li>{t.agreement.section6Point2}</li>
              <li>{t.agreement.section6Point3}</li>
            </ul>
          </div>

          {/* Section 7 */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {t.agreement.section7Title}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {t.agreement.section7Intro}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t.agreement.section7Content}
            </p>
          </div>

          {/* Section 8 */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {t.agreement.section8Title}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {t.agreement.section8Intro}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>{t.agreement.section8Point1}</li>
              <li>{t.agreement.section8Point2}</li>
              <li>{t.agreement.section8Point3}</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <label
              htmlFor="agree"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {t.agreement.agreeLabel}
            </label>
          </div>
          <Button
            onClick={handleAgree}
            disabled={!agreed}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {t.agreement.agreeButton}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

