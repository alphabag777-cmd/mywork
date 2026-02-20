/**
 * PlanSelector — 투자상품 선택 독립 컴포넌트
 *
 * ■ 주요 수정 (insertBefore / DOM reconciliation 에러 완전 차단)
 *   1. 훅 이후 early return null 완전 제거
 *      → 미연결 상태도 동일 DOM 트리로 렌더링 (display 토글)
 *   2. 저장 버튼 <> Fragment 제거
 *      → 항상 span 2개 고정, visibility 토글
 *   3. 미리보기 plan.logo 조건부 제거
 *      → img 항상 렌더링, logo 없으면 숨김
 *   4. 체크/뱃지 조건부 null 제거
 *      → visibility:hidden 으로 공간 유지
 */

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw, Check, Save, PackageCheck,
  Square, CheckSquare, X,
} from "lucide-react";
import { toast } from "sonner";
import type { InvestmentPlan } from "@/lib/plans";
import { getAllPlans } from "@/lib/plans";
import {
  getUserSelectedPlans,
  saveUserSelectedPlans,
  type UserSelectedPlans,
} from "@/lib/userSelectedPlans";

export default function PlanSelector() {
  const { address, isConnected } = useAccount();

  const [allPlans, setAllPlans]           = useState<InvestmentPlan[]>([]);
  const [userSelection, setUserSelection] = useState<UserSelectedPlans | null>(null);
  const [selectedIds, setSelectedIds]     = useState<string[]>([]);
  const [isSaving, setIsSaving]           = useState(false);
  const [isDirty, setIsDirty]             = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    setIsLoadingPlans(true);
    getAllPlans()
      .then(setAllPlans)
      .catch(console.error)
      .finally(() => setIsLoadingPlans(false));
  }, []);

  useEffect(() => {
    if (!address) return;
    getUserSelectedPlans(address)
      .then((sel) => {
        if (sel) {
          setUserSelection(sel);
          setSelectedIds(sel.planIds ?? []);
        }
      })
      .catch(console.error);
  }, [address]);

  const toggle = (planId: string) => {
    setIsDirty(true);
    setSelectedIds((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : [...prev, planId],
    );
  };

  const selectAll = () => {
    setIsDirty(true);
    setSelectedIds(allPlans.map((p) => p.id));
  };

  const clearAll = () => {
    setIsDirty(true);
    setSelectedIds([]);
  };

  const handleSave = async () => {
    if (!address) return;
    setIsSaving(true);
    try {
      const saved = await saveUserSelectedPlans(address, "multi", selectedIds);
      setUserSelection(saved);
      setIsDirty(false);
      toast.success("투자상품 선택이 저장되었습니다!");
    } catch {
      toast.error("저장 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── 연결 안 된 경우: 동일 DOM 구조 유지, 내부를 숨김 ──
  // early return null 완전 제거 → DOM reconciliation 에러 차단
  const connected = isConnected && !!address;

  // 선택된 상품 중 실제로 allPlans에 존재하는 것만 (null 반환 없이)
  const selectedPlansOrdered: { id: string; plan: InvestmentPlan }[] =
    connected
      ? selectedIds
          .map((id) => ({ id, plan: allPlans.find((p) => p.id === id) }))
          .filter((item): item is { id: string; plan: InvestmentPlan } =>
            item.plan !== undefined,
          )
      : [];

  const hasPreviews = selectedPlansOrdered.length > 0;

  return (
    <Card className="mb-8 border-primary/30" style={{ display: connected ? undefined : "none" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageCheck className="w-5 h-5 text-primary" />
          내 투자상품 선택
        </CardTitle>
        <CardDescription>
          홍보하고 싶은 투자상품을 자유롭게 선택하세요. 선택한 상품만 메인 화면에 표시되며,
          레퍼럴 링크도 해당 상품들로 연결됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* ── 헤더: 선택 수 + 전체선택/해제 ── */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            상품 선택&nbsp;
            {/* 뱃지 — 항상 렌더링, 선택 없으면 투명 */}
            <span
              className="ml-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold"
              style={{ visibility: selectedIds.length > 0 ? "visible" : "hidden" }}
            >
              {selectedIds.length}개 선택됨
            </span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              style={{ touchAction: "manipulation" }}
              className="text-xs text-primary hover:underline active:underline"
            >
              전체 선택
            </button>
            <span className="text-muted-foreground text-xs">|</span>
            <button
              type="button"
              onClick={clearAll}
              style={{ touchAction: "manipulation" }}
              className="text-xs text-muted-foreground hover:underline active:underline"
            >
              전체 해제
            </button>
          </div>
        </div>

        {/* ── 상품 목록 ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {isLoadingPlans ? (
            /* 로딩 스켈레톤 — 항상 같은 위치에 렌더링 */
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl border-2 border-border bg-muted/30 animate-pulse" />
            ))
          ) : (
            allPlans.map((plan) => {
              const selected = selectedIds.includes(plan.id);
              const order    = selectedIds.indexOf(plan.id);
              return (
                <PlanItem
                  key={plan.id}
                  plan={plan}
                  selected={selected}
                  order={order}
                  onToggle={toggle}
                />
              );
            })
          )}
        </div>

        {/* ── 선택 순서 미리보기 ── */}
        {/* display 토글 — 조건부 마운트/언마운트 제거 */}
        <div
          className="p-3 rounded-xl bg-muted/40 border border-border/60"
          style={{ display: hasPreviews ? "block" : "none" }}
        >
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            선택 순서 (레퍼럴 링크에 포함됨)
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedPlansOrdered.map(({ id, plan }, idx) => (
              <PreviewChip
                key={id}
                id={id}
                plan={plan}
                idx={idx}
                onRemove={toggle}
              />
            ))}
          </div>
        </div>

        {/* ── 저장 버튼 — Fragment 완전 제거, 고정 구조 ── */}
        <Button
          variant="gold"
          className="w-full"
          onClick={handleSave}
          disabled={isSaving}
          style={{ touchAction: "manipulation" }}
        >
          {/* 3가지 상태를 span display 토글로 처리 — <> Fragment 없음 */}
          <span style={{ display: isSaving ? "inline-flex" : "none" }} className="items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />저장 중…
          </span>
          <span style={{ display: !isSaving && isDirty ? "inline-flex" : "none" }} className="items-center gap-2">
            <Save className="w-4 h-4" />선택 저장하기
          </span>
          <span style={{ display: !isSaving && !isDirty ? "inline-flex" : "none" }} className="items-center gap-2">
            <Check className="w-4 h-4" />저장됨
          </span>
        </Button>

        {/* ── 저장 상태 안내 ── */}
        <p
          className="text-xs text-muted-foreground text-center"
          style={{ display: userSelection && !isDirty ? "block" : "none" }}
        >
          {userSelection && userSelection.planIds.length > 0
            ? `✅ ${userSelection.planIds.length}개 상품 저장됨 — 메인화면과 레퍼럴 링크에 반영`
            : "아직 선택된 상품이 없습니다. 상품을 선택하고 저장하세요."}
        </p>

      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────
// PlanItem — 각 상품 카드
// 조건부 자식 요소를 visibility/display로 처리해 DOM 구조 고정
// ──────────────────────────────────────────────────────────
interface PlanItemProps {
  plan: InvestmentPlan;
  selected: boolean;
  order: number;
  onToggle: (id: string) => void;
}

function PlanItem({ plan, selected, order, onToggle }: PlanItemProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(plan.id)}
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
      className={[
        "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors w-full",
        selected
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/50",
      ].join(" ")}
    >
      {/* 체크 아이콘 — 두 아이콘 모두 항상 렌더링, visibility 토글 */}
      <span className="flex-shrink-0 pointer-events-none w-5 h-5 relative">
        <CheckSquare
          className="w-5 h-5 text-primary absolute inset-0"
          style={{ opacity: selected ? 1 : 0 }}
          aria-hidden="true"
        />
        <Square
          className="w-5 h-5 text-muted-foreground absolute inset-0"
          style={{ opacity: selected ? 0 : 1 }}
          aria-hidden="true"
        />
      </span>

      {/* 로고 — img 항상 렌더링, logo 없으면 placeholder span 표시 */}
      <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center pointer-events-none relative">
        <img
          src={plan.logo || ""}
          alt=""
          aria-hidden="true"
          className="w-8 h-8 object-contain absolute inset-0"
          style={{ display: plan.logo ? "block" : "none" }}
        />
        <span
          className="w-8 h-8 rounded-full bg-muted absolute inset-0"
          style={{ display: plan.logo ? "none" : "block" }}
        />
      </span>

      {/* 텍스트 */}
      <span className="flex-1 min-w-0 pointer-events-none text-left">
        <span className="block text-sm font-semibold truncate">{plan.name}</span>
        <span className="block text-xs text-muted-foreground truncate">{plan.label}</span>
        {/* dailyProfit — 없으면 높이 0 span으로 공간 유지 */}
        <span
          className="block text-xs text-primary font-medium mt-0.5"
          style={{ visibility: plan.dailyProfit ? "visible" : "hidden", minHeight: "1em" }}
        >
          {plan.dailyProfit || "\u00A0"}
        </span>
      </span>

      {/* 순서 뱃지 — 항상 같은 크기 공간, 미선택 시 invisible */}
      <span className="w-8 flex-shrink-0 text-right pointer-events-none">
        <span
          className="text-xs font-bold text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded"
          style={{ visibility: selected ? "visible" : "hidden" }}
        >
          #{order + 1}
        </span>
      </span>
    </button>
  );
}

// ──────────────────────────────────────────────────────────
// PreviewChip — 선택 순서 미리보기 칩
// 고정 DOM 구조, logo 유무에 상관없이 동일 자식 수
// ──────────────────────────────────────────────────────────
interface PreviewChipProps {
  id: string;
  plan: InvestmentPlan;
  idx: number;
  onRemove: (id: string) => void;
}

function PreviewChip({ id, plan, idx, onRemove }: PreviewChipProps) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background border border-border text-xs">
      <span className="font-bold text-primary">#{idx + 1}</span>
      {/* 로고 영역 — 항상 같은 크기 */}
      <span className="w-3.5 h-3.5 flex-shrink-0 relative">
        <img
          src={plan.logo || ""}
          alt=""
          className="w-3.5 h-3.5 object-contain absolute inset-0"
          style={{ display: plan.logo ? "block" : "none" }}
        />
      </span>
      <span className="font-medium">{plan.name}</span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(id); }}
        style={{ touchAction: "manipulation" }}
        className="text-muted-foreground hover:text-red-500 active:text-red-500 ml-0.5 p-1.5 -m-1 rounded"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
