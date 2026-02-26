import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect, Suspense, lazy } from "react";
const MDEditor = lazy(() => import("@uiw/react-md-editor"));
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusSquare, Trash2, Edit, Save, X, GripVertical, ChevronUp, ChevronDown,
  Image as ImageIcon, Star, Plus, Info, Link, Wallet,
  Eye, EyeOff, ArrowUp, ArrowDown, FileText, Bell, Youtube, Globe,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { InvestmentPlan, LangContent, PlanStatus, PlanCategory, getAllPlans, savePlan, deletePlan, updatePlanOrder } from "@/lib/plans";
import { ImageUpload } from "@/components/ImageUpload";
import { PdfUpload } from "@/components/PdfUpload";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

/* ─────────────────────────────────────────────── */
/*  Highlight 행 편집 컴포넌트                      */
/* ─────────────────────────────────────────────── */
const ICON_OPTIONS = [
  { value: "💰", label: "💰 수익" },
  { value: "📅", label: "📅 기간" },
  { value: "🔒", label: "🔒 락업" },
  { value: "🌐", label: "🌐 네트워크" },
  { value: "💎", label: "💎 토큰" },
  { value: "📈", label: "📈 성장" },
  { value: "🛡️", label: "🛡️ 안전" },
  { value: "⚡", label: "⚡ 속도" },
  { value: "👥", label: "👥 커뮤니티" },
  { value: "🔑", label: "🔑 최소금액" },
  { value: "🏆", label: "🏆 등급" },
  { value: "📊", label: "📊 통계" },
  { value: "🔄", label: "🔄 주기" },
  { value: "💸", label: "💸 수수료" },
  { value: "📋", label: "📋 컨트랙트" },
  { value: "✅", label: "✅ 감사" },
  { value: "🎯", label: "🎯 목표" },
  { value: "⏰", label: "⏰ 시간" },
];

interface HighlightRow { icon: string; title: string; value: string }

function HighlightEditor({
  highlights, onChange,
}: { highlights: HighlightRow[]; onChange: (h: HighlightRow[]) => void }) {
  const add = () => onChange([...highlights, { icon: "💰", title: "", value: "" }]);
  const remove = (i: number) => onChange(highlights.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof HighlightRow, val: string) => {
    const next = [...highlights];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };
  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...highlights];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };
  const moveDown = (i: number) => {
    if (i === highlights.length - 1) return;
    const next = [...highlights];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {highlights.map((h, i) => (
        <div key={i} className="flex gap-2 items-start p-3 rounded-lg border border-border/60 bg-muted/30">
          {/* 순서 변경 */}
          <div className="flex flex-col gap-0.5 flex-shrink-0 pt-1">
            <button type="button" onClick={() => moveUp(i)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
              <ArrowUp className="w-3 h-3" />
            </button>
            <button type="button" onClick={() => moveDown(i)} disabled={i === highlights.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>
          {/* 아이콘 선택 */}
          <Select value={h.icon} onValueChange={(v) => update(i, "icon", v)}>
            <SelectTrigger className="w-28 flex-shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ICON_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* 제목 */}
          <Input
            placeholder="항목명 (예: 일일 수익률)"
            value={h.title}
            onChange={(e) => update(i, "title", e.target.value)}
            className="flex-1"
          />
          {/* 값 */}
          <Input
            placeholder="값 (예: 1.3%)"
            value={h.value}
            onChange={(e) => update(i, "value", e.target.value)}
            className="flex-1"
          />
          <Button variant="ghost" size="icon" onClick={() => remove(i)} className="flex-shrink-0 text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1 w-full">
        <Plus className="w-3.5 h-3.5" /> 항목 추가
      </Button>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Detail Image 행 편집 컴포넌트 (캡션 + URL입력)  */
/* ─────────────────────────────────────────────── */
interface DetailImageItem { url: string; caption: string }

function DetailImageEditor({
  images, onChange,
}: { images: DetailImageItem[]; onChange: (imgs: DetailImageItem[]) => void }) {
  const [urlInput, setUrlInput] = useState("");
  const [addMode, setAddMode] = useState<"upload" | "url">("upload");

  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));
  const updateCaption = (i: number, caption: string) => {
    const next = [...images];
    next[i] = { ...next[i], caption };
    onChange(next);
  };
  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...images];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };
  const moveDown = (i: number) => {
    if (i === images.length - 1) return;
    const next = [...images];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next);
  };
  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!url.startsWith("http") && !url.startsWith("/")) {
      toast.error("올바른 이미지 URL을 입력하세요 (http... 또는 /...)");
      return;
    }
    onChange([...images, { url, caption: "" }]);
    setUrlInput("");
  };

  return (
    <div className="space-y-3">
      {/* 이미지 목록 */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {images.map((item, i) => (
            <div key={i} className="rounded-lg border border-border/60 overflow-hidden bg-muted/30">
              <div className="relative group">
                {item.url ? (
                  <img src={item.url} alt={`detail-${i}`} className="w-full h-36 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                ) : (
                  <div className="w-full h-36 flex items-center justify-center text-muted-foreground text-xs bg-muted/50">
                    이미지 로드 실패
                  </div>
                )}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
                    className="bg-black/60 text-white rounded w-6 h-6 flex items-center justify-center hover:bg-black/80 disabled:opacity-30" title="위로">
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => moveDown(i)} disabled={i === images.length - 1}
                    className="bg-black/60 text-white rounded w-6 h-6 flex items-center justify-center hover:bg-black/80 disabled:opacity-30" title="아래로">
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => remove(i)}
                    className="bg-destructive text-white rounded w-6 h-6 flex items-center justify-center hover:bg-destructive/80" title="삭제">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] px-2 py-0.5 flex items-center justify-between">
                  <span>이미지 {i + 1}</span>
                  <span className="truncate max-w-[120px] opacity-60">{item.url.split("/").pop()}</span>
                </div>
              </div>
              <div className="p-2 space-y-1.5">
                <Input
                  placeholder="이미지 캡션 (선택 사항)"
                  value={item.caption || ""}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  className="text-xs h-7"
                />
                <div className="flex gap-1">
                  <Input
                    placeholder="URL 직접 수정"
                    value={item.url}
                    onChange={(e) => {
                      const next = [...images];
                      next[i] = { ...next[i], url: e.target.value };
                      onChange(next);
                    }}
                    className="text-[10px] h-6 font-mono"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 추가 방식 선택 탭 */}
      <div className="border border-border/60 rounded-xl overflow-hidden">
        <div className="flex border-b border-border/60 bg-muted/20">
          <button
            type="button"
            onClick={() => setAddMode("upload")}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              addMode === "upload" ? "bg-background text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📤 파일 업로드
          </button>
          <button
            type="button"
            onClick={() => setAddMode("url")}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              addMode === "url" ? "bg-background text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🔗 URL 직접 입력
          </button>
        </div>
        <div className="p-3">
          {addMode === "upload" ? (
            <ImageUpload
              value=""
              onChange={(url) => { if (url) onChange([...images, { url, caption: "" }]); }}
              label="이미지 추가 (클릭하여 업로드)"
              folder="alphabag/plans/detail"
              maxSizeMB={30}
            />
          ) : (
            <div className="space-y-2">
              <Label className="text-xs">이미지 URL 직접 입력</Label>
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddUrl(); } }}
                  className="flex-1 text-sm"
                />
                <Button type="button" variant="outline" onClick={handleAddUrl} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> 추가
                </Button>
              </div>
              {urlInput && urlInput.startsWith("http") && (
                <div className="rounded-lg overflow-hidden border border-border/60 bg-muted/20">
                  <p className="text-[10px] text-muted-foreground px-2 py-1">미리보기</p>
                  <img
                    src={urlInput}
                    alt="url-preview"
                    className="w-full h-28 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">Cloudinary, Firebase Storage, 외부 이미지 URL 모두 가능합니다.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          💡 이미지 카드에 마우스를 올리면 ▲▼ 순서 변경, 삭제 버튼이 나타납니다.
        </p>
        <span className={`text-xs ${images.length >= 20 ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
          {images.length}장 / 최대 20장
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  YouTube 다중 URL 편집 컴포넌트                  */
/* ─────────────────────────────────────────────── */
interface YoutubeItem { url: string; title: string }

function getEmbedUrl(raw: string): string {
  if (!raw) return "";
  if (raw.includes("youtube.com/embed/")) return raw;
  const short = raw.match(/youtu\.be\/([\w-]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  const watch = raw.match(/youtube\.com\/watch\?v=([\w-]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  return raw;
}

function YoutubeEditor({
  items, onChange,
}: { items: YoutubeItem[]; onChange: (v: YoutubeItem[]) => void }) {
  const [inputUrl, setInputUrl] = useState("");
  const [inputTitle, setInputTitle] = useState("");

  const add = () => {
    const embed = getEmbedUrl(inputUrl.trim());
    if (!embed) return;
    onChange([...items, { url: embed, title: inputTitle.trim() || `영상 ${items.length + 1}` }]);
    setInputUrl("");
    setInputTitle("");
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...items]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; onChange(next);
  };
  const moveDown = (i: number) => {
    if (i === items.length - 1) return;
    const next = [...items]; [next[i], next[i + 1]] = [next[i + 1], next[i]]; onChange(next);
  };
  const updateTitle = (i: number, title: string) => {
    const next = [...items]; next[i] = { ...next[i], title }; onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* 등록된 영상 목록 */}
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-border/60 overflow-hidden bg-muted/20">
          {/* 영상 제목 + 순서/삭제 버튼 */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border/40">
            <span className="text-xs font-bold text-red-500 shrink-0">▶ {i + 1}</span>
            <Input
              value={item.title}
              onChange={(e) => updateTitle(i, e.target.value)}
              placeholder="영상 제목"
              className="h-7 text-xs flex-1"
            />
            <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5">
              <ArrowUp className="w-3 h-3" />
            </button>
            <button type="button" onClick={() => moveDown(i)} disabled={i === items.length - 1}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5">
              <ArrowDown className="w-3 h-3" />
            </button>
            <button type="button" onClick={() => remove(i)}
              className="text-destructive hover:text-destructive/80 p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* 미리보기 */}
          {item.url && item.url.includes("embed") && (
            <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={item.url}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={item.title || `YouTube ${i + 1}`}
              />
            </div>
          )}
          <div className="px-3 py-1.5">
            <p className="text-[10px] text-muted-foreground font-mono truncate">{item.url}</p>
          </div>
        </div>
      ))}

      {/* 새 영상 추가 입력 */}
      <div className="p-3 rounded-xl border border-dashed border-border/60 bg-muted/10 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">➕ YouTube 영상 추가</p>
        <Input
          value={inputTitle}
          onChange={(e) => setInputTitle(e.target.value)}
          placeholder="영상 제목 (예: 프로젝트 소개 영상)"
          className="h-8 text-sm"
        />
        <div className="flex gap-2">
          <Input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... 또는 youtu.be/..."
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            className="flex-1 text-sm"
          />
          <Button type="button" variant="outline" onClick={add} disabled={!inputUrl.trim()} className="gap-1 shrink-0">
            <Plus className="w-3.5 h-3.5" /> 추가
          </Button>
        </div>
        {inputUrl && (
          <p className="text-[11px] text-muted-foreground">
            {getEmbedUrl(inputUrl) ? "✅ 유효한 YouTube URL" : "⚠️ 일반 URL 또는 embed URL을 입력하세요"}
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">💡 YouTube 영상을 여러 개 추가할 수 있습니다. 순서를 변경하려면 ▲▼를 사용하세요.</p>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Materials 행 편집 컴포넌트                      */
/* ─────────────────────────────────────────────── */
interface MaterialRow { title: string; url: string }
function MaterialEditor({
  materials, onChange,
}: { materials: MaterialRow[]; onChange: (m: MaterialRow[]) => void }) {
  const add = () => onChange([...materials, { title: "", url: "" }]);
  const remove = (i: number) => onChange(materials.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof MaterialRow, val: string) => {
    const next = [...materials];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {materials.map((m, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input placeholder="제목 (예: 백서)" value={m.title} onChange={(e) => update(i, "title", e.target.value)} className="flex-1" />
          <Input placeholder="URL (https://...)" value={m.url} onChange={(e) => update(i, "url", e.target.value)} className="flex-[2]" />
          <Button variant="ghost" size="icon" onClick={() => remove(i)} className="text-destructive hover:text-destructive flex-shrink-0">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1 w-full">
        <Plus className="w-3.5 h-3.5" /> 링크 추가
      </Button>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  상세 설명 서식 툴바                              */
/* ─────────────────────────────────────────────── */
function RichTextToolbar({ onInsert }: { onInsert: (text: string) => void }) {
  const shortcuts = [
    { label: "📌", title: "포인트", text: "📌 " },
    { label: "✅", title: "완료/가능", text: "✅ " },
    { label: "❌", title: "불가/주의", text: "❌ " },
    { label: "💡", title: "팁/참고", text: "💡 " },
    { label: "⚠️", title: "경고", text: "⚠️ " },
    { label: "🔹", title: "항목", text: "🔹 " },
    { label: "🔸", title: "항목(강조)", text: "🔸 " },
    { label: "📊", title: "통계", text: "📊 " },
    { label: "💰", title: "수익", text: "💰 " },
    { label: "🔒", title: "락업", text: "🔒 " },
    { label: "📅", title: "기간", text: "📅 " },
    { label: "🌐", title: "네트워크", text: "🌐 " },
  ];
  const templates = [
    { label: "투자방식", text: "\n📌 투자 방식:\n📌 수익 지급:\n📌 원금 회수:\n" },
    { label: "스펙요약", text: "\n🔹 네트워크: BSC\n🔹 토큰: BBAG/SBAG\n🔹 최소: 100 USDT\n🔹 락업: 30일\n" },
    { label: "구분선", text: "\n─────────────────\n" },
  ];
  return (
    <div className="flex flex-wrap gap-1 p-2 bg-muted/30 rounded-t-lg border border-b-0 border-border/50">
      {shortcuts.map((s) => (
        <button
          key={s.label}
          type="button"
          title={s.title}
          onClick={() => onInsert(s.text)}
          className="w-7 h-7 text-sm rounded hover:bg-muted flex items-center justify-center transition-colors"
        >
          {s.label}
        </button>
      ))}
      <div className="w-px bg-border/60 mx-0.5 self-stretch" />
      {templates.map((t) => (
        <button
          key={t.label}
          type="button"
          title={`${t.label} 템플릿 삽입`}
          onClick={() => onInsert(t.text)}
          className="px-2 h-7 text-[10px] rounded border border-border/60 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          +{t.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  세부 정보 미리보기 패널                          */
/* ─────────────────────────────────────────────── */
function DetailPreview({
  formData, highlights, detailImages,
}: {
  formData: any;
  highlights: HighlightRow[];
  detailImages: DetailImageItem[];
}) {
  return (
    <div className="border border-border/60 rounded-xl p-4 bg-muted/20 space-y-4 text-sm">
      <p className="text-xs font-semibold text-primary uppercase tracking-wider">📋 미리보기</p>

      {/* 스펙 칩 */}
      {(formData.network || formData.tokenSymbol || formData.lockupPeriod || formData.minInvestment) && (
        <div className="flex flex-wrap gap-1.5">
          {formData.network && <span className="px-2 py-0.5 bg-secondary/60 rounded text-xs">🌐 {formData.network}</span>}
          {formData.tokenSymbol && <span className="px-2 py-0.5 bg-secondary/60 rounded text-xs">💎 {formData.tokenSymbol}</span>}
          {formData.lockupPeriod && <span className="px-2 py-0.5 bg-secondary/60 rounded text-xs">🔒 {formData.lockupPeriod}</span>}
          {formData.minInvestment && <span className="px-2 py-0.5 bg-secondary/60 rounded text-xs">💵 {formData.minInvestment}</span>}
          {formData.investmentPeriod && <span className="px-2 py-0.5 bg-secondary/60 rounded text-xs">⏰ {formData.investmentPeriod}</span>}
          {formData.profitCycle && <span className="px-2 py-0.5 bg-secondary/60 rounded text-xs">🔄 {formData.profitCycle}</span>}
          {formData.feeInfo && <span className="px-2 py-0.5 bg-secondary/60 rounded text-xs">💸 {formData.feeInfo}</span>}
        </div>
      )}

      {/* 하이라이트 */}
      {highlights.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {highlights.map((h, i) => (
            <div key={i} className="text-center p-2 rounded-lg bg-background border border-border/40">
              <div className="text-lg">{h.icon}</div>
              <div className="text-[10px] text-muted-foreground">{h.title}</div>
              <div className="text-xs font-bold">{h.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* 이미지 */}
      {detailImages.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {detailImages.slice(0, 3).map((img, i) => (
            <div key={i} className="rounded overflow-hidden aspect-video bg-muted">
              <img src={img.url} alt={img.caption || `img-${i}`} className="w-full h-full object-cover" />
            </div>
          ))}
          {detailImages.length > 3 && (
            <div className="rounded bg-muted flex items-center justify-center text-xs text-muted-foreground aspect-video">
              +{detailImages.length - 3}장
            </div>
          )}
        </div>
      )}

      {/* 상세 설명 */}
      {formData.detailDescription && (
        <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed border-t border-border/40 pt-2">
          {formData.detailDescription.substring(0, 200)}{formData.detailDescription.length > 200 ? "..." : ""}
        </div>
      )}

      {/* 주의사항 */}
      {formData.noticeText && (
        <div className="p-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
          ⚠️ {formData.noticeText.substring(0, 100)}{formData.noticeText.length > 100 ? "..." : ""}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  메인 컴포넌트                                   */
/* ─────────────────────────────────────────────── */
export const AdminAddPlans = () => {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [showPreview, setShowPreview] = useState(false);
  // 언어별 콘텐츠 상태
  const [activeLangTab, setActiveLangTab] = useState<"en" | "zh" | "ko" | "ja">("en");
  const [langContent, setLangContent] = useState<{
    en: LangContent; zh: LangContent; ko: LangContent; ja: LangContent;
  }>({ en: {}, zh: {}, ko: {}, ja: {} });

  /* ── 폼 상태 ── */
  const [formData, setFormData] = useState({
    // 기본 정보
    name: "", label: "", dailyProfit: "",
    status: "Daily profit" as PlanStatus,
    focus: "", logo: "", dappUrl: "",
    description: "", tags: "",
    quickActionsDescription: "",
    youtubeUrl: "", telegram: "", twitter: "",
    recommendedAmount: "1000",
    // 세부 정보
    detailDescription: "",
    network: "", tokenSymbol: "",
    lockupPeriod: "", minInvestment: "",
    riskLevel: "" as "" | "Low" | "Medium" | "High",
    // 추가 세부 정보
    investmentPeriod: "",
    profitCycle: "",
    feeInfo: "",
    contractAddress: "",
    auditInfo: "",
    totalCapacity: "",
    currentParticipants: "",
    noticeText: "",
    // 카테고리 (투자 상품 분류)
    category: "NONE" as "NONE" | PlanCategory,
    // 지갑
    wallet1: "", wallet1Percentage: "0", useUserAddress1: false,
    wallet1TokenConversionRate: "0", wallet1TokenPrice: "0",
    wallet2: "", wallet2Percentage: "0", useUserAddress2: false,
    wallet2TokenConversionRate: "0", wallet2TokenPrice: "0",
    wallet3: "", wallet3Percentage: "0", useUserAddress3: false,
  });
  const [highlights, setHighlights] = useState<HighlightRow[]>([]);
  const [detailImages, setDetailImages] = useState<DetailImageItem[]>([]);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [pdfFiles, setPdfFiles] = useState<Array<{ title: string; url: string }>>([]);
  const [youtubeItems, setYoutubeItems] = useState<YoutubeItem[]>([]);
  const [externalLinks, setExternalLinks] = useState<Array<{ title: string; url: string }>>([]);
  const [blogLinks, setBlogLinks] = useState<BlogLinkRow[]>([]);
  // HTML 편집 미리보기 모드
  const [descHtmlMode, setDescHtmlMode] = useState(false);
  const [detailDescHtmlMode, setDetailDescHtmlMode] = useState(false);

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    try { setPlans(await getAllPlans()); }
    catch { toast.error("Failed to load plans"); }
  };

  const resetForm = () => {
    setFormData({
      name: "", label: "", dailyProfit: "",
      status: "Daily profit",
      focus: "", logo: "", dappUrl: "",
      description: "", tags: "",
      quickActionsDescription: "",
      youtubeUrl: "", telegram: "", twitter: "",
      recommendedAmount: "1000",
      detailDescription: "",
      network: "", tokenSymbol: "",
      lockupPeriod: "", minInvestment: "",
      riskLevel: "",
      investmentPeriod: "",
      profitCycle: "",
      feeInfo: "",
      contractAddress: "",
      auditInfo: "",
      totalCapacity: "",
      currentParticipants: "",
      noticeText: "",
      category: "NONE" as "NONE" | PlanCategory,
      wallet1: "", wallet1Percentage: "0", useUserAddress1: false,
      wallet1TokenConversionRate: "0", wallet1TokenPrice: "0",
      wallet2: "", wallet2Percentage: "0", useUserAddress2: false,
      wallet2TokenConversionRate: "0", wallet2TokenPrice: "0",
      wallet3: "", wallet3Percentage: "0", useUserAddress3: false,
    });
    setHighlights([]);
    setDetailImages([]);
    setMaterials([]);
    setPdfFiles([]);
    setYoutubeItems([]);
    setExternalLinks([]);
    setBlogLinks([]);
    setDescHtmlMode(false);
    setDetailDescHtmlMode(false);
    setEditingPlan(null);
    setActiveTab("basic");
    setShowPreview(false);
    setLangContent({ en: {}, zh: {}, ko: {}, ja: {} });
    setActiveLangTab("en");
  };

  /* ── 이미지 데이터 정규화 헬퍼 ── */
  const normalizeImages = (imgs: any[]): DetailImageItem[] => {
    if (!imgs) return [];
    return imgs.map((img) => {
      if (typeof img === "string") return { url: img, caption: "" };
      return { url: img.url || "", caption: img.caption || "" };
    });
  };

  const handleOpenDialog = (plan?: InvestmentPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name, label: plan.label, dailyProfit: plan.dailyProfit,
        status: plan.status || "Daily profit",
        focus: plan.focus, logo: plan.logo, dappUrl: plan.dappUrl,
        description: plan.description,
        tags: plan.tags.join(", "),
        quickActionsDescription: plan.quickActionsDescription,
        youtubeUrl: plan.youtubeUrl, telegram: plan.telegram, twitter: plan.twitter,
        recommendedAmount: plan.recommendedAmount,
        detailDescription: plan.detailDescription || "",
        network: plan.network || "", tokenSymbol: plan.tokenSymbol || "",
        lockupPeriod: plan.lockupPeriod || "", minInvestment: plan.minInvestment || "",
        riskLevel: (plan.riskLevel || "") as "" | "Low" | "Medium" | "High",
        investmentPeriod: plan.investmentPeriod || "",
        profitCycle: plan.profitCycle || "",
        feeInfo: plan.feeInfo || "",
        contractAddress: plan.contractAddress || "",
        auditInfo: plan.auditInfo || "",
        totalCapacity: plan.totalCapacity || "",
        currentParticipants: plan.currentParticipants || "",
        noticeText: plan.noticeText || "",
        category: (plan.category || "NONE") as "NONE" | PlanCategory,
        wallet1: plan.wallet1 || "", wallet1Percentage: plan.wallet1Percentage?.toString() || "0",
        useUserAddress1: plan.useUserAddress1 || false,
        wallet1TokenConversionRate: plan.wallet1TokenConversionRate?.toString() || "0",
        wallet1TokenPrice: plan.wallet1TokenPrice?.toString() || "0",
        wallet2: plan.wallet2 || "", wallet2Percentage: plan.wallet2Percentage?.toString() || "0",
        useUserAddress2: plan.useUserAddress2 || false,
        wallet2TokenConversionRate: plan.wallet2TokenConversionRate?.toString() || "0",
        wallet2TokenPrice: plan.wallet2TokenPrice?.toString() || "0",
        wallet3: plan.wallet3 || "", wallet3Percentage: plan.wallet3Percentage?.toString() || "0",
        useUserAddress3: plan.useUserAddress3 || false,
      });
      setHighlights(plan.highlights || []);
      setDetailImages(normalizeImages(plan.detailImages as any[] || []));
      setMaterials(plan.materials || []);
      setPdfFiles(plan.pdfFiles || []);
      setExternalLinks(plan.externalLinks || []);
      setBlogLinks((plan.blogLinks || []) as BlogLinkRow[]);
      // youtubeUrls 배열 우선, 없으면 기존 단일 youtubeUrl → 배열로 변환
      const existingUrls = plan.youtubeUrls && plan.youtubeUrls.length > 0
        ? plan.youtubeUrls
        : plan.youtubeUrl
          ? [{ url: plan.youtubeUrl, title: "영상 1" }]
          : [];
      setYoutubeItems(existingUrls);
      setLangContent({
        en: plan.langContent?.en || {},
        zh: plan.langContent?.zh || {},
        ko: plan.langContent?.ko || {},
        ja: plan.langContent?.ja || {},
      });
      setDescHtmlMode(false);
      setDetailDescHtmlMode(false);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => { setIsDialogOpen(false); resetForm(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = formData.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const isSelfCollection = formData.category === "SELF_COLLECTION";

    // 지갑 주소 실제 입력 여부 확인
    const hasW1addr = !!formData.wallet1.trim() || formData.useUserAddress1;
    const hasW2addr = !!formData.wallet2.trim() || formData.useUserAddress2;
    const hasW3addr = !!formData.wallet3.trim() || formData.useUserAddress3;

    // 셀프컬렉션 OR 지갑1만 있는 경우: wallet1 = 100%, wallet2/3 = 0 강제
    const isSingleWallet = isSelfCollection || (!hasW2addr && !hasW3addr);

    const wallet1Percent = isSingleWallet ? 100 : (parseFloat(formData.wallet1Percentage) || 0);
    const wallet2Percent = (isSingleWallet || !hasW2addr) ? 0 : (parseFloat(formData.wallet2Percentage) || 0);
    const wallet3Percent = (isSingleWallet || !hasW3addr) ? 0 : (parseFloat(formData.wallet3Percentage) || 0);

    if (!isSingleWallet && wallet1Percent + wallet2Percent + wallet3Percent > 100) {
      toast.error("Total wallet percentages cannot exceed 100%");
      return;
    }

    // 지갑1 주소 필수 체크 (셀프컬렉션이거나 단일지갑인 경우)
    if (isSingleWallet && !hasW1addr) {
      toast.error("지갑 1 주소를 입력해주세요. (투자금 수신 지갑)");
      return;
    }
    const planData = {
      id: editingPlan?.id,
      sortOrder: editingPlan?.sortOrder,
      createdAt: editingPlan?.createdAt,
      name: formData.name, label: formData.label, dailyProfit: formData.dailyProfit,
      status: formData.status, focus: formData.focus, logo: formData.logo,
      dappUrl: formData.dappUrl, description: formData.description,
      tags, quickActionsDescription: formData.quickActionsDescription,
      youtubeUrl: youtubeItems[0]?.url || formData.youtubeUrl, // 하위 호환용 첫 번째 URL
      youtubeUrls: youtubeItems,
      telegram: formData.telegram, twitter: formData.twitter,
      materials,
      pdfFiles,
      externalLinks,
      blogLinks,
      langContent: {
        en: Object.keys(langContent.en).length ? langContent.en : null,
        zh: Object.keys(langContent.zh).length ? langContent.zh : null,
        ko: Object.keys(langContent.ko).length ? langContent.ko : null,
        ja: Object.keys(langContent.ja).length ? langContent.ja : null,
      },
      recommendedAmount: formData.recommendedAmount,
      // 세부 정보
      detailDescription: formData.detailDescription,
      network: formData.network, tokenSymbol: formData.tokenSymbol,
      lockupPeriod: formData.lockupPeriod, minInvestment: formData.minInvestment,
      riskLevel: formData.riskLevel as "Low" | "Medium" | "High" | undefined || undefined,
      highlights,
      detailImages,
      // 추가 세부 정보
      investmentPeriod: formData.investmentPeriod,
      profitCycle: formData.profitCycle,
      feeInfo: formData.feeInfo,
      contractAddress: formData.contractAddress,
      auditInfo: formData.auditInfo,
      totalCapacity: formData.totalCapacity,
      currentParticipants: formData.currentParticipants,
      noticeText: formData.noticeText,
      // 카테고리 (NONE은 미지정으로 처리)
      category: (formData.category === "NONE" ? undefined : formData.category) as PlanCategory | undefined,
      // 지갑
      wallet1: formData.wallet1.trim(), wallet1Percentage: wallet1Percent,
      useUserAddress1: formData.useUserAddress1,
      wallet1TokenConversionRate: parseFloat(formData.wallet1TokenConversionRate) || 0,
      wallet1TokenPrice: parseFloat(formData.wallet1TokenPrice) || 0,
      wallet2: formData.wallet2.trim(), wallet2Percentage: wallet2Percent,
      useUserAddress2: formData.useUserAddress2,
      wallet2TokenConversionRate: parseFloat(formData.wallet2TokenConversionRate) || 0,
      wallet2TokenPrice: parseFloat(formData.wallet2TokenPrice) || 0,
      wallet3: formData.wallet3.trim(), wallet3Percentage: wallet3Percent,
      useUserAddress3: formData.useUserAddress3,
    };
    try {
      await savePlan(planData);
      toast.success(editingPlan ? "Plan updated!" : "Plan created!");
      handleCloseDialog();
      await loadPlans();
    } catch (err) {
      toast.error("Failed to save plan");
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    setIsDeleting(id);
    try {
      if (await deletePlan(id)) { toast.success("Deleted!"); await loadPlans(); }
      else toast.error("Failed to delete");
    } catch { toast.error("Failed to delete"); }
    finally { setIsDeleting(null); }
  };

  /* ── 드래그 앤 드롭 ── */
  const handleDragStart = (i: number) => setDraggedIndex(i);
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIndex(i); };
  const handleDragLeave = () => setDragOverIndex(null);
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault(); setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === dropIndex) { setDraggedIndex(null); return; }
    const next = [...plans];
    const [moved] = next.splice(draggedIndex, 1);
    next.splice(dropIndex, 0, moved);
    const planOrders = next.map((p, i) => ({ id: p.id, sortOrder: i }));
    try { await updatePlanOrder(planOrders); toast.success("Order updated!"); await loadPlans(); }
    catch { toast.error("Failed to update order"); }
    finally { setDraggedIndex(null); }
  };
  const handleMoveUp = async (i: number) => {
    if (i === 0) return;
    const next = [...plans]; [next[i - 1], next[i]] = [next[i], next[i - 1]];
    try { await updatePlanOrder(next.map((p, idx) => ({ id: p.id, sortOrder: idx }))); await loadPlans(); }
    catch { toast.error("Failed"); }
  };
  const handleMoveDown = async (i: number) => {
    if (i === plans.length - 1) return;
    const next = [...plans]; [next[i], next[i + 1]] = [next[i + 1], next[i]];
    try { await updatePlanOrder(next.map((p, idx) => ({ id: p.id, sortOrder: idx }))); await loadPlans(); }
    catch { toast.error("Failed"); }
  };

  /* ── 탭 완성도 계산 ── */
  const basicFilled = !!(formData.name && formData.label && formData.dailyProfit && formData.dappUrl);
  const detailFilled = !!(formData.detailDescription || highlights.length || detailImages.length || formData.noticeText);
  const walletTotal = (parseFloat(formData.wallet1Percentage) || 0) + (parseFloat(formData.wallet2Percentage) || 0) + (parseFloat(formData.wallet3Percentage) || 0);
  const extraDetailFilled = !!(formData.investmentPeriod || formData.profitCycle || formData.feeInfo || formData.contractAddress || formData.auditInfo);

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PlusSquare className="w-4 h-4 text-primary" />
                {t.admin.planManagement}
              </CardTitle>
              <CardDescription>투자 플랜을 생성하고 세부 정보를 관리합니다</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <PlusSquare className="w-4 h-4" /> {t.admin.addPlan}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t.admin.noPlans}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <GripVertical className="w-4 h-4 inline mx-1" /> 아이콘을 드래그하거나 화살표로 순서를 변경하세요.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">{t.admin.order}</TableHead>
                    <TableHead>{t.admin.logo}</TableHead>
                    <TableHead>{t.admin.planName}</TableHead>
                    <TableHead>{t.admin.label}</TableHead>
                    <TableHead>{t.admin.status}</TableHead>
                    <TableHead>{t.admin.dailyProfit}</TableHead>
                    <TableHead>{t.admin.detailInfo}</TableHead>
                    <TableHead className="text-right">{t.admin.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan, index) => (
                    <TableRow
                      key={plan.id} draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`cursor-move ${draggedIndex === index ? "opacity-50" : ""} ${dragOverIndex === index ? "border-2 border-primary" : ""}`}
                    >
                      <TableCell>
                        <div className="flex flex-col items-center gap-1">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                          <div className="flex flex-col gap-0.5">
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleMoveUp(index)} disabled={index === 0}><ChevronUp className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleMoveDown(index)} disabled={index === plans.length - 1}><ChevronDown className="w-3 h-3" /></Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><img src={plan.logo || "/logo.png"} alt={plan.label} className="w-10 h-10 object-contain" /></TableCell>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>{plan.label}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-1 text-xs font-semibold bg-primary/20 text-primary border border-primary/50 rounded-full">{plan.status || "Daily profit"}</span>
                          {plan.category && (
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                              plan.category === "SELF_COLLECTION"
                                ? "bg-amber-500/20 text-amber-500 border-amber-500/50"
                                : plan.category === "ABAG"
                                ? "bg-blue-500/20 text-blue-500 border-blue-500/50"
                                : plan.category === "BBAG"
                                ? "bg-green-500/20 text-green-500 border-green-500/50"
                                : "bg-purple-500/20 text-purple-500 border-purple-500/50"
                            }`}>
                              {plan.category === "SELF_COLLECTION" ? "셀프컬렉션" : plan.category}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{plan.dailyProfit}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {plan.detailImages && plan.detailImages.length > 0 && (
                            <span className="text-[10px] bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                              📷 {plan.detailImages.length}
                            </span>
                          )}
                          {plan.highlights && plan.highlights.length > 0 && (
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">
                              ⭐ {plan.highlights.length}
                            </span>
                          )}
                          {plan.riskLevel && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${plan.riskLevel === "Low" ? "bg-green-100 text-green-600" : plan.riskLevel === "Medium" ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"}`}>
                              {plan.riskLevel}
                            </span>
                          )}
                          {plan.noticeText && (
                            <span className="text-[10px] bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">
                              ⚠️ 공지
                            </span>
                          )}
                          {plan.contractAddress && (
                            <span className="text-[10px] bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded">
                              📋 계약
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(plan)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)} disabled={isDeleting === plan.id}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Create/Edit Dialog ─── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[94vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg">{editingPlan ? `✏️ ${t.admin.editPlan}` : `➕ ${t.admin.addPlan}`}</DialogTitle>
                <DialogDescription>각 탭에서 항목을 입력하고 저장하세요.</DialogDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-1.5 mr-8"
              >
                {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPreview ? t.buttons.closePreview : t.buttons.preview}
              </Button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {/* ══ 카테고리 선택 배너 (최상단, 항상 노출) ══ */}
            <div className="px-6 pt-4 pb-2">
              <div className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
                formData.category === 'SELF_COLLECTION'
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-primary/40 bg-primary/5'
              }`}>
                <div className="flex-1">
                  <Label htmlFor="category-top" className="text-sm font-bold text-foreground">📂 상품 유형 (카테고리) *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => {
                      const cat = v as "NONE" | PlanCategory;
                      setFormData({ ...formData, category: cat,
                        // 셀프컬렉션 선택 시 wallet1Percentage 자동 100 설정
                        wallet1Percentage: cat === 'SELF_COLLECTION' ? '100' : formData.wallet1Percentage,
                        wallet2Percentage: cat === 'SELF_COLLECTION' ? '0' : formData.wallet2Percentage,
                        wallet3Percentage: cat === 'SELF_COLLECTION' ? '0' : formData.wallet3Percentage,
                      });
                      // 셀프컬렉션 선택 시 지갑 배분 탭으로 자동 이동
                      if (cat === 'SELF_COLLECTION') setActiveTab('wallet');
                    }}
                  >
                    <SelectTrigger id="category-top" className={`mt-1 ${
                      formData.category === 'SELF_COLLECTION' ? 'border-amber-500 text-amber-500 font-bold' : ''
                    }`}>
                      <SelectValue placeholder="▼ 카테고리를 먼저 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">미지정 (기존 방식)</SelectItem>
                      <SelectItem value="ABAG">A BAG</SelectItem>
                      <SelectItem value="BBAG">B BAG</SelectItem>
                      <SelectItem value="CBAG">C BAG</SelectItem>
                      <SelectItem value="SELF_COLLECTION">🎯 셀프컬렉션 (단일상품 100%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.category === 'SELF_COLLECTION' && (
                  <div className="flex flex-col items-center justify-center bg-amber-500 text-white rounded-xl px-4 py-2 text-center min-w-[80px]">
                    <span className="text-2xl font-black">100%</span>
                    <span className="text-[10px] font-semibold">지갑1 전송</span>
                  </div>
                )}
              </div>
              {formData.category === 'SELF_COLLECTION' && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/40 text-xs text-amber-600">
                  ✅ <strong>셀프컬렉션 설정 방법:</strong> 아래 &quot;지갑 배분&quot; 탭에서 지갑 1 주소만 입력하세요. 투자금 100%가 해당 주소로 전송됩니다.
                </div>
              )}
            </div>

            <div className={`flex gap-0 ${showPreview ? "divide-x divide-border/50" : ""}`}>
              {/* ── 메인 편집 영역 ── */}
              <div className={showPreview ? "flex-1 min-w-0" : "w-full"}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  {/* ── 탭 헤더 ── */}
                  <div className="px-6 pt-4">
                    <TabsList className="grid w-full grid-cols-5 h-auto">
                      <TabsTrigger value="basic" className="flex flex-col gap-0.5 py-2 text-xs">
                        <Info className="w-4 h-4" />
                        <span>{t.admin.basicInfo}</span>
                        {basicFilled && <span className="text-[9px] text-green-500">✓</span>}
                      </TabsTrigger>
                      <TabsTrigger value="detail" className="flex flex-col gap-0.5 py-2 text-xs">
                        <Star className="w-4 h-4" />
                        <span>{t.admin.detailInfo}</span>
                        {(detailFilled || extraDetailFilled) && <span className="text-[9px] text-green-500">✓</span>}
                      </TabsTrigger>
                      <TabsTrigger value="links" className="flex flex-col gap-0.5 py-2 text-xs">
                        <Link className="w-4 h-4" />
                        <span>{t.admin.linksMedia}</span>
                        {materials.length > 0 && <span className="text-[9px] text-green-500">✓ {materials.length}</span>}
                      </TabsTrigger>
                      <TabsTrigger value="lang" className="flex flex-col gap-0.5 py-2 text-xs">
                        <Globe className="w-4 h-4" />
                        <span>{t.admin.langContent}</span>
                        {(langContent.en.description || langContent.zh.description || langContent.ja.description) && <span className="text-[9px] text-green-500">✓</span>}
                      </TabsTrigger>
                      <TabsTrigger value="wallet" className={`flex flex-col gap-0.5 py-2 text-xs ${formData.category === 'SELF_COLLECTION' ? 'text-amber-500' : ''}`}>
                        <Wallet className="w-4 h-4" />
                        <span>{t.admin.walletAllocation}</span>
                        {formData.category === 'SELF_COLLECTION'
                          ? <span className="text-[9px] text-amber-500 font-bold">100% 🎯</span>
                          : walletTotal > 0 && <span className="text-[9px] text-blue-500">{walletTotal.toFixed(0)}%</span>
                        }
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="px-6 py-5 space-y-0">

                    {/* ══════════════ 탭 1: 기본 정보 ══════════════ */}
                    <TabsContent value="basic" className="mt-0 space-y-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">플랜 이름 *</Label>
                          <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="예: B BAG MAXFI +SBAG+CBAG" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="label">라벨 *</Label>
                          <Input id="label" value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} placeholder="예: MaxFi" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dailyProfit">일일 수익 *</Label>
                          <Input id="dailyProfit" value={formData.dailyProfit} onChange={(e) => setFormData({ ...formData, dailyProfit: e.target.value })} placeholder="예: 0.6% ~ 2%" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">상태 *</Label>
                          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as PlanStatus })}>
                            <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Display Node">Display Node</SelectItem>
                              <SelectItem value="ICO">ICO</SelectItem>
                              <SelectItem value="Daily profit">Daily profit</SelectItem>
                              <SelectItem value="Trading">Trading</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="focus">포커스 *</Label>
                          <Input id="focus" value={formData.focus} onChange={(e) => setFormData({ ...formData, focus: e.target.value })} placeholder="예: 안정적인 / 분산 투자" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dappUrl">DApp URL *</Label>
                          <Input id="dappUrl" value={formData.dappUrl} onChange={(e) => setFormData({ ...formData, dappUrl: e.target.value })} placeholder="https://..." required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="recommendedAmount">권장 금액 (USDT)</Label>
                          <Input id="recommendedAmount" type="number" value={formData.recommendedAmount} onChange={(e) => setFormData({ ...formData, recommendedAmount: e.target.value })} placeholder="1000" />
                        </div>
                        {/* 카테고리는 상단 배너로 이동됨 — 여기서는 현재 선택 표시만 */}
                        {formData.category && formData.category !== "NONE" && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">현재 카테고리</Label>
                            <div className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                              formData.category === 'SELF_COLLECTION' ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/10 text-primary'
                            }`}>
                              {formData.category === 'SELF_COLLECTION' ? '🎯 셀프컬렉션 (단일 100%)' : formData.category}
                              <span className="text-xs font-normal ml-2 opacity-70">— 상단에서 변경</span>
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <ImageUpload value={formData.logo} onChange={(url) => setFormData({ ...formData, logo: url })} label="플랜 로고 *" folder="alphabag/plans" maxSizeMB={30} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="description">간략 설명 * <span className="text-xs text-muted-foreground">(카드에 표시됨, HTML 사용 가능)</span></Label>
                          <button
                            type="button"
                            onClick={() => setDescHtmlMode(!descHtmlMode)}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${descHtmlMode ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                          >
                            <Code2 className="w-3 h-3" />
                            {descHtmlMode ? "미리보기 OFF" : "HTML 미리보기"}
                          </button>
                        </div>
                        {descHtmlMode ? (
                          <div
                            className="min-h-[80px] p-3 rounded-md border border-border bg-muted/20 text-sm prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formData.description) }}
                          />
                        ) : (
                          <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder={"카드에 표시될 짧은 설명\n\nHTML 태그 사용 가능: <b>굵게</b>, <br>, <ul><li>항목</li></ul> 등"} rows={4} required />
                        )}
                        <p className="text-[11px] text-muted-foreground">💡 HTML 태그를 사용할 수 있습니다. 예: &lt;b&gt;굵게&lt;/b&gt;, &lt;br&gt;, &lt;ul&gt;&lt;li&gt;항목&lt;/li&gt;&lt;/ul&gt;</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quickActionsDescription">Quick Actions 설명</Label>
                        <Textarea id="quickActionsDescription" value={formData.quickActionsDescription} onChange={(e) => setFormData({ ...formData, quickActionsDescription: e.target.value })} placeholder="세부 정보 팝업의 우측 Quick Actions 영역 설명" rows={2} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
                        <Input id="tags" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="예: Resources, Video, Blog" />
                      </div>
                    </TabsContent>

                    {/* ══════════════ 탭 2: 세부 정보 ══════════════ */}
                    <TabsContent value="detail" className="mt-0 space-y-6">

                      {/* ── 섹션 A: 기본 스펙 ── */}
                      <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Info className="w-4 h-4 text-primary" /> 기본 스펙
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="network" className="text-xs">네트워크</Label>
                            <Input id="network" value={formData.network} onChange={(e) => setFormData({ ...formData, network: e.target.value })} placeholder="예: BSC, Ethereum" className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="tokenSymbol" className="text-xs">토큰 심볼</Label>
                            <Input id="tokenSymbol" value={formData.tokenSymbol} onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value })} placeholder="예: BBAG, SBAG" className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="lockupPeriod" className="text-xs">락업 기간</Label>
                            <Input id="lockupPeriod" value={formData.lockupPeriod} onChange={(e) => setFormData({ ...formData, lockupPeriod: e.target.value })} placeholder="예: 30일, 없음" className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="minInvestment" className="text-xs">최소 투자금</Label>
                            <Input id="minInvestment" value={formData.minInvestment} onChange={(e) => setFormData({ ...formData, minInvestment: e.target.value })} placeholder="예: 100 USDT" className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="investmentPeriod" className="text-xs">투자 기간</Label>
                            <Input id="investmentPeriod" value={formData.investmentPeriod} onChange={(e) => setFormData({ ...formData, investmentPeriod: e.target.value })} placeholder="예: 90일, 무기한" className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="profitCycle" className="text-xs">수익 지급 주기</Label>
                            <Input id="profitCycle" value={formData.profitCycle} onChange={(e) => setFormData({ ...formData, profitCycle: e.target.value })} placeholder="예: 매일, 매주" className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="riskLevel" className="text-xs">리스크 레벨</Label>
                            <Select value={formData.riskLevel} onValueChange={(v) => setFormData({ ...formData, riskLevel: v as "" | "Low" | "Medium" | "High" })}>
                              <SelectTrigger id="riskLevel" className="h-8 text-sm"><SelectValue placeholder="선택..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Low">🟢 Low (낮음)</SelectItem>
                                <SelectItem value="Medium">🟡 Medium (중간)</SelectItem>
                                <SelectItem value="High">🔴 High (높음)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="feeInfo" className="text-xs">수수료 정보</Label>
                            <Input id="feeInfo" value={formData.feeInfo} onChange={(e) => setFormData({ ...formData, feeInfo: e.target.value })} placeholder="예: 출금 수수료 2%" className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="totalCapacity" className="text-xs">총 모집 한도</Label>
                            <Input id="totalCapacity" value={formData.totalCapacity} onChange={(e) => setFormData({ ...formData, totalCapacity: e.target.value })} placeholder="예: 10,000 USDT" className="h-8 text-sm" />
                          </div>
                        </div>
                      </div>

                      {/* ── 섹션 B: 컨트랙트 & 감사 ── */}
                      <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-500" /> 컨트랙트 & 감사 정보
                        </h4>
                        <div className="space-y-1.5">
                          <Label htmlFor="contractAddress" className="text-xs">스마트 컨트랙트 주소</Label>
                          <Input
                            id="contractAddress"
                            value={formData.contractAddress}
                            onChange={(e) => setFormData({ ...formData, contractAddress: e.target.value })}
                            placeholder="0x... (BSCScan에서 확인 가능)"
                            className="font-mono text-xs h-8"
                          />
                          <p className="text-[11px] text-muted-foreground">입력 시 세부 정보 팝업에 BSCScan 링크로 표시됩니다.</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="auditInfo" className="text-xs">감사(Audit) 정보</Label>
                          <Input id="auditInfo" value={formData.auditInfo} onChange={(e) => setFormData({ ...formData, auditInfo: e.target.value })} placeholder="예: CertiK 감사 완료, Hacken 감사 중" className="h-8 text-sm" />
                        </div>
                      </div>

                      {/* ── 섹션 C: 상세 설명 (리치 에디터) ── */}
                      <div className="rounded-xl border border-border/60 bg-muted/10 overflow-hidden" data-color-mode="dark">
                        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Info className="w-4 h-4 text-primary" /> 상세 설명
                            <span className="text-xs font-normal text-muted-foreground">마크다운 · HTML · 이모지 모두 사용 가능</span>
                          </h4>
                          <span className="text-[11px] text-muted-foreground">{(formData.detailDescription || "").length}자</span>
                        </div>
                        <div className="px-4 pb-4">
                          <Suspense fallback={<div className="h-[400px] flex items-center justify-center text-muted-foreground text-sm">에디터 로딩 중...</div>}>
                          <MDEditor
                            value={formData.detailDescription}
                            onChange={(val) => setFormData({ ...formData, detailDescription: val || "" })}
                            height={400}
                            preview="live"
                            hideToolbar={false}
                            visibleDragbar={false}
                            textareaProps={{
                              placeholder: "여기에 상세 설명을 입력하세요.\n\n✅ 마크다운 사용 예시:\n**굵게** _기울기_ ~~취소선~~\n# 제목1  ## 제목2\n- 목록1\n- 목록2\n\n[링크 텍스트](https://example.com)\n\n✅ HTML도 가능:\n<b>굵게</b> <br> <ul><li>항목</li></ul>\n\n✅ 이모지:\n📌 투자 방식  📅 기간  💰 수익  🔒 락업",
                            }}
                            style={{ borderRadius: "0.5rem" }}
                          />
                          </Suspense>
                          <p className="text-[11px] text-muted-foreground mt-2">
                            💡 왼쪽 = 편집, 오른쪽 = 실시간 미리보기 · <strong>B</strong> <em>I</em> H ─ 링크 이미지 코드 표 등 툴바 사용 가능
                          </p>
                        </div>
                      </div>

                      {/* ── 섹션 D: 주의사항 / 공지 ── */}
                      <div className="p-4 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20 space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
                          <Bell className="w-4 h-4" /> 주의사항 / 공지
                          <span className="text-xs font-normal text-muted-foreground">(빨간 경고 박스로 표시)</span>
                        </h4>
                        <Textarea
                          id="noticeText"
                          value={formData.noticeText}
                          onChange={(e) => setFormData({ ...formData, noticeText: e.target.value })}
                          placeholder={"투자자에게 알려야 할 주의사항이나 공지를 입력하세요.\n예: 이 플랜은 고위험 투자입니다. 원금 손실 가능성이 있습니다.\n예: 현재 한시적으로 참여 가능한 플랜입니다."}
                          rows={3}
                          className="text-sm border-red-200 dark:border-red-800/50 focus:border-red-400"
                        />
                      </div>

                      {/* ── 섹션 E: 핵심 지표 (하이라이트 카드) ── */}
                      <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-500" /> 핵심 지표 (하이라이트 카드)
                          <span className="text-xs font-normal text-muted-foreground">세부 정보에 카드로 표시됨</span>
                        </h4>
                        <HighlightEditor highlights={highlights} onChange={setHighlights} />
                      </div>

                      {/* ── 섹션 F: 상세 이미지 갤러리 ── */}
                      <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-blue-500" /> 상세 이미지 갤러리
                          <span className="text-xs font-normal text-muted-foreground">
                            {detailImages.length}장 업로드됨 (최대 6장 권장)
                          </span>
                        </h4>
                        <DetailImageEditor images={detailImages} onChange={setDetailImages} />
                      </div>
                    </TabsContent>

                    {/* ══════════════ 탭 3: 링크·미디어 ══════════════ */}
                    <TabsContent value="links" className="mt-0 space-y-5">

                      {/* YouTube */}
                      <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Youtube className="w-4 h-4 text-red-500" /> YouTube 영상
                          {youtubeItems.length > 0 && (
                            <span className="text-xs font-normal text-green-500">✓ {youtubeItems.length}개 등록됨</span>
                          )}
                        </h4>
                        <YoutubeEditor items={youtubeItems} onChange={setYoutubeItems} />
                      </div>

                      {/* SNS */}
                      <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Link className="w-4 h-4 text-primary" /> SNS 채널
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="telegram" className="text-xs">✈️ 텔레그램</Label>
                            <Input id="telegram" value={formData.telegram} onChange={(e) => setFormData({ ...formData, telegram: e.target.value })} placeholder="https://t.me/..." className="h-8" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="twitter" className="text-xs">🐦 Twitter/X</Label>
                            <Input id="twitter" value={formData.twitter} onChange={(e) => setFormData({ ...formData, twitter: e.target.value })} placeholder="https://twitter.com/..." className="h-8" />
                          </div>
                        </div>
                      </div>

                      {/* 참고 자료 */}
                      <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" /> 참고 자료 링크
                          <span className="text-xs font-normal text-muted-foreground">백서, 공식문서, 블로그 등</span>
                        </h4>
                        <MaterialEditor materials={materials} onChange={setMaterials} />
                      </div>

                      {/* PDF 첨부 파일 */}
                      <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-red-500" /> PDF 첨부 파일
                          <span className="text-xs font-normal text-muted-foreground">언제서, 백서, 인증서 등 (최대 30MB)</span>
                        </h4>
                        <PdfUpload
                          files={pdfFiles}
                          onChange={setPdfFiles}
                          folder="alphabag/plans/pdf"
                          maxSizeMB={30}
                          maxFiles={5}
                        />
                      </div>

                      {/* 외부 URL 링크 (최대 5개) */}
                      <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-blue-500" /> 외부 URL 링크
                          <span className="text-xs font-normal text-muted-foreground">웹사이트, DApp, 공식 링크 등 (최대 5개)</span>
                          {externalLinks.length > 0 && <span className="text-xs text-green-500">✓ {externalLinks.length}개</span>}
                        </h4>
                        <MaterialEditor materials={externalLinks} onChange={setExternalLinks} maxItems={5} />
                      </div>

                      {/* 블로그/SNS 링크 (최대 5개) */}
                      <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-purple-500" /> 블로그 / SNS / 미디어 링크
                          <span className="text-xs font-normal text-muted-foreground">블로그, Medium, GitHub 등 (최대 5개)</span>
                          {blogLinks.length > 0 && <span className="text-xs text-green-500">✓ {blogLinks.length}개</span>}
                        </h4>
                        <BlogLinkEditor links={blogLinks} onChange={setBlogLinks} maxItems={5} />
                      </div>
                    </TabsContent>

                    {/* ══════════════ 탭 4: 언어별 콘텐츠 ══════════════ */}
                    <TabsContent value="lang" className="mt-0 space-y-5">
                      <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          💡 <strong>{t.admin.langContent}</strong>: 언어별로 설명, 자료, PDF를 개별 등록하세요. 미입력 시 기본(KO) 내용이 표시됩니다.
                        </p>
                      </div>

                      {/* 언어 탭 선택 */}
                      <div className="flex border-b border-border/60">
                        {(["en", "zh", "ko", "ja"] as const).map((lang) => {
                          const labels: Record<string, string> = { en: "🇺🇸 English", zh: "🇨🇳 中文", ko: "🇰🇷 한국어", ja: "🇯🇵 日本語" };
                          const hasData = !!(langContent[lang]?.description || langContent[lang]?.detailDescription ||
                            (langContent[lang]?.materials?.length ?? 0) > 0 ||
                            (langContent[lang]?.pdfFiles?.length ?? 0) > 0);
                          return (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => setActiveLangTab(lang)}
                              className={`flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                                activeLangTab === lang
                                  ? "border-b-2 border-primary text-foreground bg-background"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {labels[lang]}
                              {hasData && <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* 선택된 언어 콘텐츠 편집 */}
                      {(["en", "zh", "ko", "ja"] as const).map((lang) => {
                        if (lang !== activeLangTab) return null;
                        const langLabels: Record<string, string> = { en: "English", zh: "中文", ko: "한국어", ja: "日本語" };
                        const lc = langContent[lang];
                        const update = (patch: Partial<LangContent>) =>
                          setLangContent({ ...langContent, [lang]: { ...lc, ...patch } });
                        return (
                          <div key={lang} className="space-y-5">
                            {/* 간략 설명 - HTML 지원 */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">📝 {langLabels[lang]} 간략 설명 <span className="font-normal text-xs text-muted-foreground">(HTML 지원)</span></Label>
                              </div>
                              <Textarea
                                value={lc.description || ""}
                                onChange={(e) => update({ description: e.target.value })}
                                placeholder={`${langLabels[lang]}로 간략 설명 입력 (카드에 표시됨)\nHTML 태그 사용 가능: <b>굵게</b>, <br>, <ul><li>항목</li></ul>`}
                                rows={4}
                                className="text-sm font-mono"
                              />
                              {lc.description && (
                                <div className="p-3 rounded border border-dashed border-border bg-muted/10">
                                  <p className="text-[10px] text-muted-foreground mb-1">🔍 렌더링 미리보기</p>
                                  <div
                                    className="text-sm prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lc.description) }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* 상세 설명 - MDEditor (마크다운+HTML+이모지) */}
                            <div className="space-y-2" data-color-mode="dark">
                              <Label className="text-sm font-semibold">
                                📄 {langLabels[lang]} 상세 설명
                                <span className="font-normal text-xs text-muted-foreground ml-1">(마크다운·HTML·이모지 지원)</span>
                              </Label>
                              <Suspense fallback={<div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">에디터 로딩 중...</div>}>
                              <MDEditor
                                value={lc.detailDescription || ""}
                                onChange={(val) => update({ detailDescription: val || "" })}
                                height={320}
                                preview="live"
                                hideToolbar={false}
                                visibleDragbar={false}
                                textareaProps={{
                                  placeholder: `${langLabels[lang]}로 상세 설명 입력\n**굵게** _기울기_ # 제목 - 목록\nHTML도 가능: <b>굵게</b> <br>`,
                                }}
                                style={{ borderRadius: "0.5rem" }}
                              />
                              </Suspense>
                            </div>

                            {/* 참고 자료 */}
                            <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                              <Label className="text-sm font-semibold">
                                <FileText className="w-4 h-4 inline mr-1 text-primary" />
                                {langLabels[lang]} {t.admin.materials}
                              </Label>
                              <MaterialEditor
                                materials={lc.materials || []}
                                onChange={(m) => update({ materials: m })}
                                maxItems={5}
                              />
                            </div>

                            {/* 첨부파일 (PDF/DOC/XLS/ZIP 등, 최대 5개) */}
                            <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                              <Label className="text-sm font-semibold">
                                <FileText className="w-4 h-4 inline mr-1 text-red-500" />
                                {langLabels[lang]} 첨부파일 (최대 5개)
                                <span className="text-xs font-normal text-muted-foreground ml-1">PDF/DOC/XLS/ZIP 등</span>
                              </Label>
                              <PdfUpload
                                files={lc.pdfFiles || []}
                                onChange={(files) => update({ pdfFiles: files })}
                                folder={`alphabag/plans/pdf/${lang}`}
                                maxSizeMB={30}
                                maxFiles={5}
                              />
                            </div>

                            {/* 블로그/SNS 링크 */}
                            <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                              <Label className="text-sm font-semibold">
                                <BookOpen className="w-4 h-4 inline mr-1 text-purple-500" />
                                {langLabels[lang]} 블로그/SNS 링크
                              </Label>
                              <BlogLinkEditor
                                links={(lc.blogLinks || []) as BlogLinkRow[]}
                                onChange={(l) => update({ blogLinks: l })}
                                maxItems={5}
                              />
                            </div>

                            {/* 이미지 갤러리 */}
                            <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                              <Label className="text-sm font-semibold">
                                <ImageIcon className="w-4 h-4 inline mr-1 text-blue-500" />
                                {langLabels[lang]} {t.admin.detailImages}
                              </Label>
                              <DetailImageEditor
                                images={lc.detailImages || []}
                                onChange={(imgs) => update({ detailImages: imgs })}
                              />
                            </div>

                            {/* YouTube 영상 */}
                            <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                              <Label className="text-sm font-semibold">
                                <span className="text-red-500 mr-1">▶</span>
                                {langLabels[lang]} YouTube 영상
                              </Label>
                              <YoutubeEditor
                                items={lc.youtubeUrls || []}
                                onChange={(items) => update({ youtubeUrls: items })}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </TabsContent>

                    {/* ══════════════ 탭 5: 지갑 배분 ══════════════ */}
                    <TabsContent value="wallet" className="mt-0 space-y-4">

                      {/* ── 셀프컬렉션 모드: 지갑1에 100% 고정 ── */}
                      {formData.category === "SELF_COLLECTION" ? (
                        <div className="space-y-4">
                          {/* 안내 배너 */}
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/40">
                            <span className="text-xl flex-shrink-0">🎯</span>
                            <div>
                              <p className="text-sm font-semibold text-amber-500">셀프컬렉션 모드 — 단일 지갑 100%</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                투자금 전액(100%)이 아래 지갑 1 주소로 전송됩니다.<br />
                                지갑 2, 지갑 3은 사용하지 않습니다.
                              </p>
                            </div>
                          </div>

                          {/* 지갑 1 — 100% 고정 */}
                          <div className="space-y-3 p-4 border-2 border-amber-500/50 rounded-xl bg-amber-500/5">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-semibold text-amber-500">
                                🎯 지갑 1 <span className="text-muted-foreground font-normal">(수신 지갑)</span>
                              </Label>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="useUserAddress1_self"
                                  checked={formData.useUserAddress1}
                                  onCheckedChange={(c) =>
                                    setFormData({ ...formData, useUserAddress1: c === true, wallet1: c ? "" : formData.wallet1, wallet1Percentage: "100" })
                                  }
                                />
                                <Label htmlFor="useUserAddress1_self" className="text-xs text-muted-foreground cursor-pointer">
                                  투자자 주소 사용
                                </Label>
                              </div>
                            </div>
                            <Input
                              value={formData.wallet1}
                              onChange={(e) =>
                                setFormData({ ...formData, wallet1: e.target.value, useUserAddress1: false, wallet1Percentage: "100" })
                              }
                              placeholder={formData.useUserAddress1 ? "투자자 지갑 주소 사용됨" : "0x... (수신 지갑 주소)"}
                              className="font-mono text-sm border-amber-500/40 focus:border-amber-500"
                              disabled={formData.useUserAddress1}
                            />
                            {/* 100% 고정 표시 */}
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/10">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-amber-500">100%</span>
                                <span className="text-xs text-muted-foreground">(자동 설정 — 변경 불가)</span>
                              </div>
                            </div>
                            {/* hidden input: wallet1Percentage 항상 100으로 유지 */}
                          </div>

                          {/* 지갑 2, 3 비활성화 표시 */}
                          <div className="p-3 rounded-xl border border-border/30 bg-muted/10 text-center">
                            <p className="text-xs text-muted-foreground">
                              ✅ 셀프컬렉션은 지갑 2 · 지갑 3을 사용하지 않습니다
                            </p>
                          </div>
                        </div>

                      ) : (
                        /* ── 일반 모드: 3지갑 배분 ── */
                        <>
                          {/* 지갑주소 없을 때 단일 100% 안내 */}
                          {!formData.wallet1.trim() && !formData.useUserAddress1 && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                              <span className="text-lg">💡</span>
                              <div>
                                <p className="text-sm font-semibold text-blue-400">지갑 주소 미입력 상태</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  지갑 1 주소를 입력하면 배분이 적용됩니다.<br/>
                                  단일 지갑만 사용하려면 상단에서 <strong className="text-amber-500">셀프컬렉션</strong>을 선택하세요.
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                            <Wallet className="w-4 h-4 text-primary flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">투자 금액 배분 설정</p>
                              <p className="text-xs text-muted-foreground">현재 합계: <strong className={walletTotal > 100 ? "text-destructive" : walletTotal === 100 ? "text-green-500" : "text-foreground"}>{walletTotal.toFixed(1)}%</strong></p>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            {[1, 2].map((num) => {
                              const wKey = `wallet${num}` as "wallet1" | "wallet2";
                              const pKey = `wallet${num}Percentage` as "wallet1Percentage" | "wallet2Percentage";
                              const uKey = `useUserAddress${num}` as "useUserAddress1" | "useUserAddress2";
                              const rKey = `wallet${num}TokenConversionRate` as "wallet1TokenConversionRate" | "wallet2TokenConversionRate";
                              const tKey = `wallet${num}TokenPrice` as "wallet1TokenPrice" | "wallet2TokenPrice";
                              const tokenName = num === 1 ? "BBAG" : "SBAG";
                              return (
                                <div key={num} className="space-y-3 p-4 border border-border/60 rounded-xl bg-muted/20">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold">지갑 {num} <span className="text-muted-foreground font-normal">({tokenName})</span></Label>
                                    <div className="flex items-center gap-2">
                                      <Checkbox id={uKey} checked={formData[uKey] as boolean} onCheckedChange={(c) => setFormData({ ...formData, [uKey]: c === true, [wKey]: c ? "" : formData[wKey] })} />
                                      <Label htmlFor={uKey} className="text-xs text-muted-foreground cursor-pointer">투자자 주소 사용</Label>
                                    </div>
                                  </div>
                                  <Input value={formData[wKey] as string} onChange={(e) => setFormData({ ...formData, [wKey]: e.target.value, [uKey]: false })} placeholder={formData[uKey] ? "투자자 지갑 주소 사용됨" : "0x..."} className="font-mono text-sm" disabled={formData[uKey] as boolean} />
                                  <div className="flex items-center gap-2">
                                    <Input type="number" min="0" max="100" step="0.1" value={formData[pKey] as string} onChange={(e) => setFormData({ ...formData, [pKey]: e.target.value })} placeholder="0" className="w-24" />
                                    <span className="text-sm text-muted-foreground">%</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">{tokenName} 전환율 (USDT당 토큰수)</Label>
                                      <Input type="number" min="0" step="0.01" value={formData[rKey] as string} onChange={(e) => setFormData({ ...formData, [rKey]: e.target.value })} placeholder="예: 2" className="text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">{tokenName} 토큰 가격 (USDT)</Label>
                                      <Input type="number" min="0" step="0.0001" value={formData[tKey] as string} onChange={(e) => setFormData({ ...formData, [tKey]: e.target.value })} placeholder="예: 0.5" className="text-sm" />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* 지갑 3 */}
                          <div className="space-y-3 p-4 border border-border/60 rounded-xl bg-muted/20">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-semibold">지갑 3 <span className="text-muted-foreground font-normal">(CBAG 등 기타)</span></Label>
                              <div className="flex items-center gap-2">
                                <Checkbox id="useUserAddress3" checked={formData.useUserAddress3} onCheckedChange={(c) => setFormData({ ...formData, useUserAddress3: c === true, wallet3: c ? "" : formData.wallet3 })} />
                                <Label htmlFor="useUserAddress3" className="text-xs text-muted-foreground cursor-pointer">투자자 주소 사용</Label>
                              </div>
                            </div>
                            <Input value={formData.wallet3} onChange={(e) => setFormData({ ...formData, wallet3: e.target.value, useUserAddress3: false })} placeholder={formData.useUserAddress3 ? "투자자 지갑 주소 사용됨" : "0x..."} className="font-mono text-sm" disabled={formData.useUserAddress3} />
                            <div className="flex items-center gap-2">
                              <Input type="number" min="0" max="100" step="0.1" value={formData.wallet3Percentage} onChange={(e) => setFormData({ ...formData, wallet3Percentage: e.target.value })} placeholder="0" className="w-24" />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                          </div>
                        </>
                      )}
                    </TabsContent>
                  </div>

                  {/* ── 저장 버튼 ── */}
                  <div className="flex justify-end gap-2 px-6 py-4 border-t border-border/50 bg-muted/20">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      <X className="w-4 h-4 mr-2" /> {t.buttons.cancel}
                    </Button>
                    <Button type="submit" className="gap-2 min-w-28">
                      <Save className="w-4 h-4" />
                      {editingPlan ? t.admin.updatePlan : t.admin.createPlan}
                    </Button>
                  </div>
                </Tabs>
              </div>

              {/* ── 미리보기 패널 (사이드) ── */}
              {showPreview && (
                <div className="w-72 flex-shrink-0 p-4 overflow-y-auto max-h-[82vh]">
                  <DetailPreview formData={formData} highlights={highlights} detailImages={detailImages} />
                </div>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAddPlans;
