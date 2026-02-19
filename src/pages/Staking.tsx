import Header from "@/components/Header";
import StakingSectionNew from "@/components/StakingSectionNew";
import UserStakesNew from "@/components/UserStakesNew";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccount } from "wagmi";
import { ROICalculator } from "@/components/ROICalculator";

const Staking = () => {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[88px] sm:pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-end mb-4">
            <ROICalculator />
          </div>
          <Tabs defaultValue="plans" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="plans">Staking Plans</TabsTrigger>
              <TabsTrigger value="my-stakes" disabled={!isConnected}>
                My Stakes
              </TabsTrigger>
            </TabsList>
            <TabsContent value="plans" className="mt-0">
              <StakingSectionNew />
            </TabsContent>
            <TabsContent value="my-stakes" className="mt-0">
              {isConnected ? (
                <UserStakesNew />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Please connect your wallet to view your stakes</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Staking;
