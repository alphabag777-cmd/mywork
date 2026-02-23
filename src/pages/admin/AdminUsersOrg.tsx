import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Share2, GitGraph, Building2, Bell } from "lucide-react";
import { AdminUsers } from "./AdminUsers";
import { AdminReferred } from "./AdminReferred";
import AdminOrganization from "./AdminOrganization";
import AdminCompanyApplications from "./AdminCompanyApplications";
import AdminNotify from "./AdminNotify";

const AdminUsersOrg = () => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users & Org</h1>
        <p className="text-sm text-muted-foreground">사용자, 레퍼럴, 조직도, 기업 신청을 관리합니다.</p>
      </div>
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4 flex flex-wrap gap-1">
          <TabsTrigger value="users" className="flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-1.5">
            <Share2 className="w-4 h-4" /> Referrals
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-1.5">
            <GitGraph className="w-4 h-4" /> Organization
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4" /> Applications
          </TabsTrigger>
          <TabsTrigger value="notify" className="flex items-center gap-1.5">
            <Bell className="w-4 h-4" /> Notify
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>
        <TabsContent value="referrals">
          <AdminReferred />
        </TabsContent>
        <TabsContent value="organization">
          <AdminOrganization />
        </TabsContent>
        <TabsContent value="applications">
          <AdminCompanyApplications />
        </TabsContent>
        <TabsContent value="notify">
          <AdminNotify />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUsersOrg;

