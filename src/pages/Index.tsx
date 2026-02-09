import Header from "@/components/Header";
import StakingSection from "@/components/StakingSection";
import NodeSection from "@/components/NodeSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 sm:pt-20">
        <StakingSection />
        <NodeSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
