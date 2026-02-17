import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OrgChart } from "@/components/OrgChart";
import { GitGraph } from "lucide-react";

const AdminOrganization = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Organization Chart</h1>
        <p className="text-muted-foreground">
          View the hierarchical structure of users and their team sales performance.
        </p>
      </div>
      
      <div className="grid gap-6">
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <GitGraph className="w-5 h-5 text-primary" />
              Network Hierarchy
            </CardTitle>
            <CardDescription>
              Visual representation of referrer-referee relationships and sales volume.
              Use the controls to zoom, pan, and refresh the data.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <OrgChart className="h-[800px] border-none shadow-none" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOrganization;
