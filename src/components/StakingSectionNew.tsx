import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getActiveStakingPlans } from "@/lib/stakingPlans";
import { StakingPlan } from "@/lib/stakingPlans";
import StakingCardNew from "./StakingCardNew";

const StakingSectionNew = () => {
  const { address, isConnected } = useAccount();
  const [plans, setPlans] = useState<StakingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const loadPlans = async () => {
      setIsLoading(true);
      try {
        const activePlans = await getActiveStakingPlans();
        setPlans(activePlans);
      } catch (error) {
        console.error("Error loading staking plans:", error);
        toast.error("Failed to load staking plans");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPlans();
  }, []);

  return (
    <section id="staking" className="py-12 md:py-20 relative min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-secondary/50 border border-border rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Staking Platform</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-foreground">Stake &</span>
            <span className="text-gradient-gold"> Earn</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-6">
            Lock your tokens and earn continuous compounding rewards with time-locked withdrawals
          </p>
        </div>

        {/* Staking Plans Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading staking plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No active staking plans available. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <StakingCardNew key={plan.id} plan={plan} delay={index * 0.1} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default StakingSectionNew;
