import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Trash2, Edit, Save, X, PlusSquare, Eye, EyeOff, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Notice, getAllNotices, saveNotice, deleteNotice } from "@/lib/notices";
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

export const AdminNotices = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    points: [""] as string[], // Array of bullet points
    isActive: true,
  });

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      const allNotices = await getAllNotices();
      setNotices(allNotices);
    } catch (error) {
      console.error("Error loading notices:", error);
      toast.error("Failed to load notices");
    }
  };

  const resetForm = () => {
    setFormData({
      points: [""],
      isActive: true,
    });
    setEditingNotice(null);
  };

  const handleOpenDialog = (notice?: Notice) => {
    if (notice) {
      setEditingNotice(notice);
      setFormData({
        points: notice.points.length > 0 ? notice.points : [""],
        isActive: notice.isActive,
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

  const handleAddPoint = () => {
    setFormData({
      ...formData,
      points: [...formData.points, ""],
    });
  };

  const handleRemovePoint = (index: number) => {
    if (formData.points.length > 1) {
      const newPoints = formData.points.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        points: newPoints,
      });
    } else {
      toast.error("At least one bullet point is required");
    }
  };

  const handlePointChange = (index: number, value: string) => {
    const newPoints = [...formData.points];
    newPoints[index] = value;
    setFormData({
      ...formData,
      points: newPoints,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty points
    const validPoints = formData.points.filter((point) => point.trim().length > 0);

    if (validPoints.length === 0) {
      toast.error("Please add at least one bullet point");
      return;
    }

    const noticeData = {
      id: editingNotice?.id,
      points: validPoints,
      isActive: formData.isActive,
      sortOrder: editingNotice?.sortOrder || 0,
    };

    try {
      await saveNotice(noticeData);
      toast.success(editingNotice ? "Notice updated successfully!" : "Notice created successfully!");
      await loadNotices();
      handleCloseDialog();
    } catch (error) {
      toast.error("Failed to save notice");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) {
      return;
    }

    setIsDeleting(id);
    try {
      const success = await deleteNotice(id);
      if (success) {
        toast.success("Notice deleted successfully!");
        await loadNotices();
      } else {
        toast.error("Failed to delete notice");
      }
    } catch (error) {
      toast.error("Failed to delete notice");
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleActive = async (notice: Notice) => {
    try {
      await saveNotice({
        ...notice,
        isActive: !notice.isActive,
      });
      toast.success(`Notice ${!notice.isActive ? "activated" : "deactivated"} successfully!`);
      await loadNotices();
    } catch (error) {
      toast.error("Failed to update notice status");
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
                <FileText className="w-4 h-4 text-primary" />
                Manage Notices
              </CardTitle>
              <CardDescription>
                Create and manage notice bullet points that appear on the home page above ads
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <PlusSquare className="w-4 h-4" />
              Add New Notice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {notices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No notices created yet. Click "Add New Notice" to create your first notice.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Bullet Points</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((notice) => (
                  <TableRow key={notice.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={notice.isActive}
                          onCheckedChange={() => handleToggleActive(notice)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {notice.isActive ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <Eye className="w-4 h-4" />
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-500">
                              <EyeOff className="w-4 h-4" />
                              Inactive
                            </span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ul className="list-disc list-inside space-y-1">
                        {notice.points.slice(0, 3).map((point, index) => (
                          <li key={index} className="text-sm">
                            {point.length > 60 ? `${point.substring(0, 60)}...` : point}
                          </li>
                        ))}
                        {notice.points.length > 3 && (
                          <li className="text-xs text-muted-foreground">
                            +{notice.points.length - 3} more
                          </li>
                        )}
                      </ul>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(notice)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(notice.id)}
                          disabled={isDeleting === notice.id}
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
            <DialogTitle>{editingNotice ? "Edit Notice" : "Create New Notice"}</DialogTitle>
            <DialogDescription>
              Add bullet points that will be displayed on the home page. One active notice will be shown.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Bullet Points</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPoint}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Point
                </Button>
              </div>
              
              {formData.points.map((point, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Textarea
                      value={point}
                      onChange={(e) => handlePointChange(index, e.target.value)}
                      placeholder={`Bullet point ${index + 1}...`}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                  {formData.points.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePoint(index)}
                      className="mt-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active (only one active notice will be displayed)
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
                {editingNotice ? "Update Notice" : "Create Notice"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotices;

