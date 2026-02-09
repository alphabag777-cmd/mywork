import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Share2 } from "lucide-react";
import { getOrCreateReferralCode, wasReferred, getReferrerCode } from "@/lib/referral";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const ReferralCard = () => {
  const { isConnected, address } = useAccount();
  const { t } = useLanguage();
  const [referralCode, setReferralCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isReferred, setIsReferred] = useState(false);
  const [referrerCode, setReferrerCode] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address && address !== null && address !== "0x0000000000000000000000000000000000000000") {
      const code = getOrCreateReferralCode(address);
      const referred = wasReferred();
      const refCode = getReferrerCode();

      setReferralCode(code);
      setIsReferred(referred);
      setReferrerCode(refCode);
    } else {
      // Clear referral data if address is null or zero address
      setReferralCode("");
      setIsReferred(false);
      setReferrerCode(null);
    }
  }, [isConnected, address]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success("Referral code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  if (!isConnected || !address || address === null || address === "0x0000000000000000000000000000000000000000") {
    return null;
  }

  return (
    <Card className="mb-8 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          {t.referral.yourReferralCode}
        </CardTitle>
        <CardDescription>
          {t.referral.shareDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Code Display */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            {t.referral.yourReferralCode}
          </label>
          <div className="flex items-center gap-2">
            <Input
              value={referralCode}
              readOnly
              className="font-mono text-lg font-semibold"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Referrer Info */}
        {isReferred && referrerCode && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              {t.referral.youWereReferred}: <span className="font-semibold text-primary">{referrerCode}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralCard;

