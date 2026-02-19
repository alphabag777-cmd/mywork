import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusSquare, Trash2, Edit, Save, X, GripVertical, ChevronUp, ChevronDown,
  Image as ImageIcon, Star, AlertTriangle, Plus, Info, Link, Wallet,
  Eye, EyeOff, ArrowUp, ArrowDown, FileText, Bell,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { InvestmentPlan, PlanStatus, getAllPlans, savePlan, deletePlan, updatePlanOrder } from "@/lib/plans";
import { ImageUpload } from "@/components/ImageUpload";
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
/*  Detail Image 행 편집 컴포넌트 (캡션 지원)       */
/* ─────────────────────────────────────────────── */
interface DetailImageItem { url: string; caption: string }

function DetailImageEditor({
  images, onChange,
}: { images: DetailImageItem[]; onChange: (imgs: DetailImageItem[]) => void }) {
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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {images.map((item, i) => (
          <div key={i} className="rounded-lg border border-border/60 overflow-hidden bg-muted/30">
            {/* 이미지 */}
            <div className="relative group">
              {item.url ? (
                <img src={item.url} alt={`detail-${i}`} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 flex items-center justify-center text-muted-foreground text-xs">
                  이미지 없음
                </div>
              )}
              {/* 오버레이 버튼 */}
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
                  className="bg-black/60 text-white rounded w-6 h-6 flex items-center justify-center hover:bg-black/80 disabled:opacity-30">
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button type="button" onClick={() => moveDown(i)} disabled={i === images.length - 1}
                  className="bg-black/60 text-white rounded w-6 h-6 flex items-center justify-center hover:bg-black/80 disabled:opacity-30">
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button type="button" onClick={() => remove(i)}
                  className="bg-destructive text-white rounded w-6 h-6 flex items-center justify-center hover:bg-destructive/80">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] px-2 py-0.5">
                이미지 {i + 1}
              </div>
            </div>
            {/* 캡션 입력 */}
            <div className="p-2">
              <Input
                placeholder="이미지 캡션 (선택 사항)"
                value={item.caption || ""}
                onChange={(e) => updateCaption(i, e.target.value)}
                className="text-xs h-7"
              />
            </div>
          </div>
        ))}
      </div>
      {/* 새 이미지 추가 */}
      <div className="p-3 border-2 border-dashed border-border/50 rounded-lg">
        <ImageUpload
          value=""
          onChange={(url) => { if (url) onChange([...images, { url, caption: "" }]); }}
          label="이미지 추가 (클릭하여 업로드)"
          folder="alphabag/plans/detail"
          maxSizeMB={5}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        💡 이미지 위에 마우스를 올리면 순서 변경 및 삭제 버튼이 나타납니다. 각 이미지에 캡션을 입력할 수 있습니다.
      </p>
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
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [showPreview, setShowPreview] = useState(false);

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
      wallet1: "", wallet1Percentage: "0", useUserAddress1: false,
      wallet1TokenConversionRate: "0", wallet1TokenPrice: "0",
      wallet2: "", wallet2Percentage: "0", useUserAddress2: false,
      wallet2TokenConversionRate: "0", wallet2TokenPrice: "0",
      wallet3: "", wallet3Percentage: "0", useUserAddress3: false,
    });
    setHighlights([]);
    setDetailImages([]);
    setMaterials([]);
    setEditingPlan(null);
    setActiveTab("basic");
    setShowPreview(false);
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
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => { setIsDialogOpen(false); resetForm(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = formData.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const wallet1Percent = parseFloat(formData.wallet1Percentage) || 0;
    const wallet2Percent = parseFloat(formData.wallet2Percentage) || 0;
    const wallet3Percent = parseFloat(formData.wallet3Percentage) || 0;
    if (wallet1Percent + wallet2Percent + wallet3Percent > 100) {
      toast.error("Total wallet percentages cannot exceed 100%");
      return;
    }
    const planData = {
      id: editingPlan?.id,
      name: formData.name, label: formData.label, dailyProfit: formData.dailyProfit,
      status: formData.status, focus: formData.focus, logo: formData.logo,
      dappUrl: formData.dappUrl, description: formData.description,
      tags, quickActionsDescription: formData.quickActionsDescription,
      youtubeUrl: formData.youtubeUrl, telegram: formData.telegram, twitter: formData.twitter,
      materials,
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
      await loadPlans();
      handleCloseDialog();
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
                Manage Investment Plans
              </CardTitle>
              <CardDescription>투자 플랜을 생성하고 세부 정보를 관리합니다</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <PlusSquare className="w-4 h-4" /> Add New Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No plans yet. Click "Add New Plan" to create one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <GripVertical className="w-4 h-4 inline mx-1" /> 아이콘을 드래그하거나 화살표로 순서를 변경하세요.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">순서</TableHead>
                    <TableHead>로고</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>라벨</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>일일수익</TableHead>
                    <TableHead>세부정보</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                        <span className="px-2 py-1 text-xs font-semibold bg-primary/20 text-primary border border-primary/50 rounded-full">{plan.status || "Daily profit"}</span>
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
                <DialogTitle className="text-lg">{editingPlan ? "✏️ 플랜 수정" : "➕ 새 플랜 추가"}</DialogTitle>
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
                {showPreview ? "미리보기 닫기" : "미리보기"}
              </Button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className={`flex gap-0 ${showPreview ? "divide-x divide-border/50" : ""}`}>
              {/* ── 메인 편집 영역 ── */}
              <div className={showPreview ? "flex-1 min-w-0" : "w-full"}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  {/* ── 탭 헤더 ── */}
                  <div className="px-6 pt-4">
                    <TabsList className="grid w-full grid-cols-4 h-auto">
                      <TabsTrigger value="basic" className="flex flex-col gap-0.5 py-2 text-xs">
                        <Info className="w-4 h-4" />
                        <span>기본 정보</span>
                        {basicFilled && <span className="text-[9px] text-green-500">✓ 완료</span>}
                      </TabsTrigger>
                      <TabsTrigger value="detail" className="flex flex-col gap-0.5 py-2 text-xs">
                        <Star className="w-4 h-4" />
                        <span>세부 정보</span>
                        {(detailFilled || extraDetailFilled) && <span className="text-[9px] text-green-500">✓ 입력됨</span>}
                      </TabsTrigger>
                      <TabsTrigger value="links" className="flex flex-col gap-0.5 py-2 text-xs">
                        <Link className="w-4 h-4" />
                        <span>링크·미디어</span>
                        {materials.length > 0 && <span className="text-[9px] text-green-500">✓ {materials.length}개</span>}
                      </TabsTrigger>
                      <TabsTrigger value="wallet" className="flex flex-col gap-0.5 py-2 text-xs">
                        <Wallet className="w-4 h-4" />
                        <span>지갑 배분</span>
                        {walletTotal > 0 && <span className="text-[9px] text-blue-500">{walletTotal.toFixed(0)}%</span>}
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
                        <div className="space-y-2">
                          <ImageUpload value={formData.logo} onChange={(url) => setFormData({ ...formData, logo: url })} label="플랜 로고 *" folder="alphabag/plans" maxSizeMB={2} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">간략 설명 * <span className="text-xs text-muted-foreground">(카드에 표시됨)</span></Label>
                        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="카드에 표시될 짧은 설명" rows={3} required />
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

                      {/* ── 섹션 C: 상세 설명 ── */}
                      <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Info className="w-4 h-4 text-primary" /> 상세 설명
                          <span className="text-xs font-normal text-muted-foreground">(세부 정보 팝업 하단에 표시)</span>
                        </h4>
                        <Textarea
                          id="detailDescription"
                          value={formData.detailDescription}
                          onChange={(e) => setFormData({ ...formData, detailDescription: e.target.value })}
                          placeholder={"상세 설명을 입력하세요.\n줄바꿈은 그대로 반영됩니다.\n\n예시:\n📌 투자 방식: BBAG 40% + SBAG 40% + CBAG 20%\n📌 수익 지급: 매일 자동 지급\n📌 원금 회수: 30일 후 가능"}
                          rows={7}
                          className="font-mono text-sm"
                        />
                        <p className="text-[11px] text-muted-foreground">💡 이모지와 줄바꿈을 활용하여 가독성을 높이세요.</p>
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
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="youtubeUrl">YouTube URL</Label>
                          <Input id="youtubeUrl" value={formData.youtubeUrl} onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })} placeholder="https://www.youtube.com/embed/..." />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="telegram">텔레그램 URL</Label>
                          <Input id="telegram" value={formData.telegram} onChange={(e) => setFormData({ ...formData, telegram: e.target.value })} placeholder="https://t.me/..." />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="twitter">Twitter/X URL</Label>
                          <Input id="twitter" value={formData.twitter} onChange={(e) => setFormData({ ...formData, twitter: e.target.value })} placeholder="https://twitter.com/..." />
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Link className="w-4 h-4 text-primary" /> 참고 자료 링크
                        </h4>
                        <MaterialEditor materials={materials} onChange={setMaterials} />
                      </div>
                    </TabsContent>

                    {/* ══════════════ 탭 4: 지갑 배분 ══════════════ */}
                    <TabsContent value="wallet" className="mt-0 space-y-4">
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
                    </TabsContent>
                  </div>

                  {/* ── 저장 버튼 ── */}
                  <div className="flex justify-end gap-2 px-6 py-4 border-t border-border/50 bg-muted/20">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      <X className="w-4 h-4 mr-2" /> 취소
                    </Button>
                    <Button type="submit" className="gap-2 min-w-28">
                      <Save className="w-4 h-4" />
                      {editingPlan ? "수정 저장" : "플랜 생성"}
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
