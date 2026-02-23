import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export const ImageUpload = ({
  value,
  onChange,
  label = "Image",
  folder = "alphabag",
  accept = "image/*",
  maxSizeMB = 30,
  className = "",
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일을 선택해주세요");
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다 (현재: ${fileSizeMB.toFixed(1)}MB)`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      // 진행률 시뮬레이션 (Cloudinary fetch는 진행률 콜백 없음)
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 8, 90));
      }, 300);

      const result = await uploadImageToCloudinary(file, folder);
      clearInterval(progressInterval);
      setUploadProgress(100);
      onChange(result.secure_url);
      toast.success("이미지 업로드 완료!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "업로드 실패");
      setPreview(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange("");
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>

      <div className="space-y-2">
        {/* 미리보기 */}
        {preview && (
          <div className="relative w-full h-48 border border-border rounded-lg overflow-hidden bg-secondary/20">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
            />
            <Button
              type="button" variant="destructive" size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* 업로드 진행률 바 */}
        {isUploading && uploadProgress > 0 && (
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* 업로드 버튼 */}
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <Button
            type="button" variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                업로드 중... {uploadProgress > 0 ? `${uploadProgress}%` : ""}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {preview ? "이미지 변경" : "UPLOAD IMAGE"}
              </>
            )}
          </Button>
        </div>

        {/* URL 직접 입력 */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Or enter image URL manually</Label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com/image.jpg or /image.png"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setPreview(e.target.value || null);
              }}
              disabled={isUploading}
            />
            {value && (
              <Button type="button" variant="ghost" size="icon" onClick={handleRemove}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          최대 {maxSizeMB}MB · JPG, PNG, GIF, WebP, HEIC 지원
        </p>
      </div>
    </div>
  );
};
