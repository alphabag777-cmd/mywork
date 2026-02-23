import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, BarChart3 } from "lucide-react";
import { AdminNodes } from "./AdminNodes";
import { AdminTotalEarning } from "./AdminTotalEarning";

const AdminAssets = () => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
        <p className="text-sm text-muted-foreground">노드 타입 및 수익 현황을 관리합니다.</p>
      </div>
      <Tabs defaultValue="nodes" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="nodes" className="flex items-center gap-1.5">
            <Network className="w-4 h-4" /> Nodes
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" /> Total Earning
          </TabsTrigger>
        </TabsList>
        <TabsContent value="nodes">
          <AdminNodes />
        </TabsContent>
        <TabsContent value="earnings">
          <AdminTotalEarning />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAssets;
