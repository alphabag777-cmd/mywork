import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Image, Trash2, Edit, Save, X, PlusSquare, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AdImage, getAllAds, saveAd, deleteAd, AdPlacement } from "@/lib/ads";
import { ImageUpload } from "@/components/ImageUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export const AdminAds = () => {
  const [ads, setAds] = useState<AdImage[]>([]);
  const [editingAd, setEditingAd] = useState<AdImage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    imageUrl: "",
    alt: "",
    order: "0",
    linkUrl: "",
    isActive: true,
    placement: "fixed" as AdPlacement,
  });

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const allAds = await getAllAds();
      setAds(allAds);
    } catch (error) {
      console.error("Error loading ads:", error);
      toast.error("Failed to load ads");
    }
  };

  const resetForm = () => {
    setFormData({
      imageUrl: "",
      alt: "",
      order: "0",
      linkUrl: "",
      isActive: true,
      placement: "fixed",
    });
    setEditingAd(null);
  };

  const handleOpenDialog = (ad?: AdImage) => {
    if (ad) {
      setEditingAd(ad);
      setFormData({
        imageUrl: ad.imageUrl,
        alt: ad.alt,
        order: ad.order.toString(),
        linkUrl: ad.linkUrl || "",
        isActive: ad.isActive,
        placement: ad.placement || "fixed",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const adData = {
      id: editingAd?.id,
      imageUrl: formData.imageUrl,
      alt: formData.alt,
      order: parseInt(formData.order) || 0,
      linkUrl: formData.linkUrl,
      isActive: formData.isActive,
      placement: formData.placement,
    };

    try {
      await saveAd(adData);
      toast.success(editingAd ? "Ad updated successfully!" : "Ad created successfully!");
      await loadAds();
      handleCloseDialog();
    } catch (error) {
      toast.error("Failed to save ad");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ad?")) {
      return;
    }

    setIsDeleting(id);
    try {
      const success = await deleteAd(id);
      if (success) {
        toast.success("Ad deleted successfully!");
        await loadAds();
      } else {
        toast.error("Failed to delete ad");
      }
    } catch (error) {
      toast.error("Failed to delete ad");
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleActive = async (ad: AdImage) => {
    try {
      await saveAd({
        ...ad,
        isActive: !ad.isActive,
      });
      toast.success(`Ad ${!ad.isActive ? "activated" : "deactivated"} successfully!`);
      await loadAds();
    } catch (error) {
      toast.error("Failed to update ad");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-4 h-4 text-primary" />
                Manage Ad Images
              </CardTitle>
              <CardDescription>Control ad images displayed on the landing page</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <PlusSquare className="w-4 h-4" />
              Add New Ad
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No ads created yet. Click "Add New Ad" to create your first ad.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Alt Text</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <img
                        src={ad.imageUrl}
                        alt={ad.alt}
                        className="w-16 h-16 object-cover rounded border border-border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    </TableCell>
                    <TableCell>{ad.alt}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        ad.placement === "fixed" 
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/50" 
                          : "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                      }`}>
                        {ad.placement === "fixed" ? "Fixed" : "Rotating"}
                      </span>
                    </TableCell>
                    <TableCell>{ad.order}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(ad)}
                          className="h-8 w-8"
                        >
                          {ad.isActive ? (
                            <Eye className="w-4 h-4 text-green-500" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        <span className={`text-xs ${ad.isActive ? "text-green-500" : "text-muted-foreground"}`}>
                          {ad.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(ad)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(ad.id)}
                          disabled={isDeleting === ad.id}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAd ? "Edit Ad Image" : "Create New Ad Image"}</DialogTitle>
            <DialogDescription>
              Configure ad image that appears on the landing page
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              label="Ad Image *"
              folder="alphabag/ads"
              maxSizeMB={5}
            />
            <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
              <p className="text-sm font-semibold mb-2">Recommended Image Dimensions:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li><strong>Optimal:</strong> 1200px × 200px (6:1 aspect ratio)</li>
                <li><strong>Minimum:</strong> 800px × 133px</li>
                <li><strong>Maximum:</strong> 1600px × 267px</li>
                <li>Display size: Mobile (80px height), Desktop (96px height, max 448px width)</li>
                <li>Images will be automatically cropped to fit the banner format</li>
              </ul>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="placement">Placement Type *</Label>
                <Select 
                  value={formData.placement} 
                  onValueChange={(value) => setFormData({ ...formData, placement: value as AdPlacement })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed (Always shows this ad)</SelectItem>
                    <SelectItem value="rotating">Rotating (Cycles with other rotating ads)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.placement === "fixed" 
                    ? "This ad will always be displayed in the fixed placement"
                    : "This ad will rotate with up to 2 other rotating ads"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Order for rotating ads (lower numbers appear first)
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="alt">Alt Text *</Label>
                <Input
                  id="alt"
                  value={formData.alt}
                  onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                  placeholder="e.g. AlphaBag Ad 1"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="linkUrl">Link URL (optional)</Label>
                <Input
                  id="linkUrl"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="e.g. https://example.com"
                />
              </div>
              <div className="flex items-center space-x-2 md:col-span-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active (visible on landing page)
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <Save className="w-4 h-4" />
                {editingAd ? "Update Ad" : "Create Ad"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAds;

