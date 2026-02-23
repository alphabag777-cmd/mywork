import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Megaphone, Sparkles, Image } from "lucide-react";
import { AdminNotices } from "./AdminNotices";
import { AdminAnnouncements } from "./AdminAnnouncements";
import { AdminEventBanners } from "./AdminEventBanners";
import { AdminAds } from "./AdminAds";

const AdminContent = () => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content</h1>
        <p className="text-sm text-muted-foreground">공지, 발표, 배너, 광고 이미지를 관리합니다.</p>
      </div>
      <Tabs defaultValue="notices" className="w-full">
        <TabsList className="mb-4 flex flex-wrap gap-1">
          <TabsTrigger value="notices" className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> Notices
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-1.5">
            <Megaphone className="w-4 h-4" /> Announcements
          </TabsTrigger>
          <TabsTrigger value="banners" className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Event Banners
          </TabsTrigger>
          <TabsTrigger value="ads" className="flex items-center gap-1.5">
            <Image className="w-4 h-4" /> Ad Images
          </TabsTrigger>
        </TabsList>
        <TabsContent value="notices">
          <AdminNotices />
        </TabsContent>
        <TabsContent value="announcements">
          <AdminAnnouncements />
        </TabsContent>
        <TabsContent value="banners">
          <AdminEventBanners />
        </TabsContent>
        <TabsContent value="ads">
          <AdminAds />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminContent;
