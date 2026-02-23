import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusSquare, Lock } from "lucide-react";
import { AdminAddPlans } from "./AdminAddPlans";
import { AdminStakingPlans } from "./AdminStakingPlans";

const AdminPlans = () => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plans</h1>
        <p className="text-sm text-muted-foreground">투자 플랜 및 스테이킹 플랜을 관리합니다.</p>
      </div>
      <Tabs defaultValue="investment" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="investment" className="flex items-center gap-1.5">
            <PlusSquare className="w-4 h-4" /> Investment Plans
          </TabsTrigger>
          <TabsTrigger value="staking" className="flex items-center gap-1.5">
            <Lock className="w-4 h-4" /> Staking Plans
          </TabsTrigger>
        </TabsList>
        <TabsContent value="investment">
          <AdminAddPlans />
        </TabsContent>
        <TabsContent value="staking">
          <AdminStakingPlans />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPlans;
