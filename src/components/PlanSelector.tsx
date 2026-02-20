/**
 * PlanSelector — 투자상품 선택 독립 컴포넌트
 *
 * Profile.tsx에서 완전히 분리되어, 자체 상태만 관리합니다.
 * 이 컴포넌트가 크래시해도 Profile의 나머지 섹션에 영향 없음.
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
import { RefreshCw, Check, Save, PackageCheck, Square, CheckSquare, X } from "lucide-react";
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

  const [allPlans, setAllPlans] = useState<InvestmentPlan[]>([]);
  const [userSelection, setUserSelection] = useState<UserSelectedPlans | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // 상품 목록 로드
  useEffect(() => {
    setIsLoadingPlans(true);
    getAllPlans()
      .then(setAllPlans)
      .catch(console.error)
      .finally(() => setIsLoadingPlans(false));
  }, []);

  // 저장된 선택 로드
  useEffect(() => {
    if (!address) return;
    getUserSelectedPlans(address)
      .then((sel) => {
        if (sel) {
          setUserSelection(sel);
          setSelectedIds(sel.planIds);
        }
      })
      .catch(console.error);
  }, [address]);

  // 토글 — 단순 추가/제거, 제한 없음
  const toggle = (planId: string) => {
    setIsDirty(true);
    setSelectedIds((prev) =>
      prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]
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

  if (!isConnected || !address) return null;

  return (
    <Card className="mb-8 border-primary/30">
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
        {/* 헤더: 선택 수 + 전체선택/해제 */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            상품 선택
            {selectedIds.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                {selectedIds.length}개 선택됨
              </span>
            )}
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

        {/* 상품 목록 */}
        {isLoadingPlans ? (
          <p className="text-sm text-muted-foreground">투자상품을 불러오는 중…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allPlans.map((plan) => {
              const selected = selectedIds.includes(plan.id);
              const order = selectedIds.indexOf(plan.id);
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => toggle(plan.id)}
                  style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all w-full ${
                    selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="flex-shrink-0 pointer-events-none">
                    {selected ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground" />
                    )}
                  </span>
                  {plan.logo && (
                    <img
                      src={plan.logo}
                      alt=""
                      aria-hidden="true"
                      className="w-8 h-8 object-contain flex-shrink-0 pointer-events-none"
                    />
                  )}
                  <span className="flex-1 min-w-0 pointer-events-none text-left">
                    <span className="block text-sm font-semibold truncate">{plan.name}</span>
                    <span className="block text-xs text-muted-foreground truncate">{plan.label}</span>
                    {plan.dailyProfit && (
                      <span className="block text-xs text-primary font-medium mt-0.5">
                        {plan.dailyProfit}
                      </span>
                    )}
                  </span>
                  {selected && (
                    <span className="text-xs font-bold text-primary/70 flex-shrink-0 bg-primary/10 px-1.5 py-0.5 rounded pointer-events-none">
                      #{order + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 선택 순서 미리보기 */}
        {selectedIds.length > 0 && (
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              선택 순서 (레퍼럴 링크에 포함됨)
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedIds.map((id, idx) => {
                const plan = allPlans.find((p) => p.id === id);
                if (!plan) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background border border-border text-xs"
                  >
                    <span className="font-bold text-primary">#{idx + 1}</span>
                    {plan.logo && (
                      <img
                        src={plan.logo}
                        alt=""
                        className="w-3.5 h-3.5 object-contain pointer-events-none"
                      />
                    )}
                    <span className="font-medium">{plan.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(id);
                      }}
                      style={{ touchAction: "manipulation" }}
                      className="text-muted-foreground hover:text-red-500 active:text-red-500 ml-0.5 p-1.5 -m-1 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 저장 버튼 */}
        <Button
          variant="gold"
          className="w-full"
          onClick={handleSave}
          disabled={isSaving}
          style={{ touchAction: "manipulation" }}
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> 저장 중…
            </>
          ) : isDirty ? (
            <>
              <Save className="w-4 h-4 mr-2" /> 선택 저장하기
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" /> 저장됨
            </>
          )}
        </Button>

        {/* 저장 상태 안내 */}
        {userSelection && !isDirty && (
          <div className="text-xs text-muted-foreground text-center">
            {userSelection.planIds.length > 0
              ? `✅ ${userSelection.planIds.length}개 상품 저장됨 — 메인화면과 레퍼럴 링크에 반영`
              : "아직 선택된 상품이 없습니다. 상품을 선택하고 저장하세요."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
