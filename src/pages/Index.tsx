import Header from "@/components/Header";
import StakingSection from "@/components/StakingSection";
import NodeSection from "@/components/NodeSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[88px] sm:pt-20">
        <StakingSection />
        <NodeSection />
      </main>
    </div>
  );
};

export default Index;
