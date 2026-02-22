/**
 * PdfUpload Component
 * - PDF 파일을 Cloudinary에 업로드하고 목록을 관리
 * - 파일명 편집 가능
 * - 최대 10MB
 */
import { useRef, useState } from "react";
import { FileText, Upload, X, Loader2, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { uploadPdfToCloudinary } from "@/lib/cloudinary";

export interface PdfFile {
  title: string;
  url: string;
}

interface Props {
  files: PdfFile[];
  onChange: (files: PdfFile[]) => void;
  folder?: string;
  maxSizeMB?: number;
}

const MAX_SIZE_MB = 10;

export function PdfUpload({ files, onChange, folder = "alphabag/plans/pdf", maxSizeMB = MAX_SIZE_MB }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 체크
    if (file.type !== "application/pdf") {
      toast.error("PDF 파일만 업로드 가능합니다");
      return;
    }

    // 파일 크기 체크
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다 (현재: ${fileSizeMB.toFixed(1)}MB)`);
      return;
    }

    setUploading(true);
    try {
      const result = await uploadPdfToCloudinary(file, folder);
      const newFile: PdfFile = {
        title: file.name.replace(/\.pdf$/i, ""), // 확장자 제거한 파일명
        url: result.secure_url,
      };
      onChange([...files, newFile]);
      toast.success(`"${newFile.title}" 업로드 완료`);
    } catch {
      toast.error("PDF 업로드에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleTitleChange = (idx: number, newTitle: string) => {
    const updated = files.map((f, i) => (i === idx ? { ...f, title: newTitle } : f));
    onChange(updated);
  };

  const handleRemove = (idx: number) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {/* 업로드된 PDF 목록 */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60">
              <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
              <Input
                value={file.title}
                onChange={(e) => handleTitleChange(idx, e.target.value)}
                className="h-7 text-sm flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                placeholder="파일 제목 입력"
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  title="미리보기"
                  onClick={() => window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(file.url)}&embedded=false`, "_blank", "noopener,noreferrer")}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="다운로드"
                  onClick={async () => {
                    try {
                      const res = await fetch(file.url);
                      if (!res.ok) throw new Error("다운로드 실패");
                      const blob = await res.blob();
                      const blobUrl = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = blobUrl;
                      a.download = (file.title || "document") + ".pdf";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(blobUrl);
                    } catch {
                      window.open(file.url, "_blank", "noopener,noreferrer");
                    }
                  }}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleRemove(idx)}
                  title="삭제"
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 업로드 버튼 */}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full h-10 gap-2 border-dashed"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              업로드 중...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              PDF 파일 업로드
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          PDF 전용 · 최대 {maxSizeMB}MB · 여러 파일 순차 업로드 가능
        </p>
      </div>
    </div>
  );
}
