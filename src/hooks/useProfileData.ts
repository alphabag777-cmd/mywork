/**
 * useProfileData
 * Profile 페이지의 복잡한 데이터 로딩 로직을 한 곳에 집약한 custom hook.
 *
 * 개선 사항:
 * 1. Profile.tsx에 흩어진 6개 useEffect + 15개 상태 → 1개 hook으로 통합
 * 2. 독립적인 데이터(노드, 투자, SBAG 포지션, 플랜+전송내역)를 Promise.all 병렬 조회
 * 3. 각 섹션별 개별 isLoading flag 유지 → UI에서 세밀한 스켈레톤 제어 가능
 */

import { useState, useEffect, useCallback } from "react";
import { formatUnits } from "viem";
import { getUserNodePurchases } from "@/lib/nodePurchases";
import { getUserReferralCodes } from "@/lib/userReferralCodes";
import {
  getUserInvestmentsByCategory,
  UserInvestment,
  InvestmentCategory,
} from "@/lib/userInvestments";
import { getUserSBAGPositions, SBAGPosition } from "@/lib/sbagPositions";
import { getSBAGUSDTTransfers, getSBAGTotalInvestment } from "@/lib/sbagWalletTransfers";
import { getAllPlans, InvestmentPlan } from "@/lib/plans";
import { getUSDTTransfers, getTotalInvestment, USDTTransfer } from "@/lib/walletTransfers";

// ---------- 타입 정의 ----------

export interface UserNode {
  id: string;
  name: string;
  price: number;
  color: string;
  purchaseDate: string;
  status: "Active" | "Pending" | "Expired";
  transactionHash?: string;
  nodeId?: number;
}

export interface WalletData {
  address: string;
  transfers: USDTTransfer[];
  totalInvestment: number;
  totalProfit: number;
  isLoading: boolean;
}

export interface ProfileData {
  // 노드
  userNodes: UserNode[];
  isLoadingNodes: boolean;
  nodeReferralCodes: { [nodeId: string]: string };

  // 투자 내역
  investmentsByCategory: Record<InvestmentCategory, UserInvestment[]>;
  isLoadingInvestments: boolean;

  // SBAG 포지션
  sbagPositions: SBAGPosition[];
  isLoadingSBAG: boolean;

  // SBAG 지갑 전송
  sbagWalletInvestment: number;
  isLoadingSBAGWallet: boolean;

  // BBAG/SBAG/CBAG 지갑 전송 (특정 플랜)
  bbagWallet: WalletData;
  sbagWallet: WalletData;
  cbagWallet: WalletData;
  targetPlan: InvestmentPlan | null;

  // 액션
  refreshSBAG: () => void;
}

const DEFAULT_WALLET_DATA: WalletData = {
  address: "",
  transfers: [],
  totalInvestment: 0,
  totalProfit: 0,
  isLoading: false,
};

// ---------- Hook ----------

export function useProfileData(
  address: `0x${string}` | undefined,
  isConnected: boolean,
  contractInvestments: Array<{
    investId: bigint;
    tokenAddress: string;
    amount: bigint;
    transactionHash?: string;
    timestamp?: number;
  }> | undefined,
  decimals: number
): ProfileData {
  const [userNodes, setUserNodes] = useState<UserNode[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  const [nodeReferralCodes, setNodeReferralCodes] = useState<{ [nodeId: string]: string }>({});

  const [investmentsByCategory, setInvestmentsByCategory] = useState<
    Record<InvestmentCategory, UserInvestment[]>
  >({ BBAG: [], SBAG: [], CBAG: [] });
  const [isLoadingInvestments, setIsLoadingInvestments] = useState(false);

  const [sbagPositions, setSbagPositions] = useState<SBAGPosition[]>([]);
  const [isLoadingSBAG, setIsLoadingSBAG] = useState(false);

  const [sbagWalletInvestment, setSbagWalletInvestment] = useState<number>(0);
  const [isLoadingSBAGWallet, setIsLoadingSBAGWallet] = useState(false);

  const [bbagWallet, setBbagWallet] = useState<WalletData>(DEFAULT_WALLET_DATA);
  const [sbagWallet, setSbagWallet] = useState<WalletData>(DEFAULT_WALLET_DATA);
  const [cbagWallet, setCbagWallet] = useState<WalletData>(DEFAULT_WALLET_DATA);
  const [targetPlan, setTargetPlan] = useState<InvestmentPlan | null>(null);

  /** SBAG 포지션 새로고침 */
  const refreshSBAG = useCallback(async () => {
    if (!address) return;
    setIsLoadingSBAG(true);
    try {
      const positions = await getUserSBAGPositions(address.toLowerCase());
      setSbagPositions(positions);
    } catch (err) {
      console.error("Failed to refresh SBAG positions:", err);
    } finally {
      setIsLoadingSBAG(false);
    }
  }, [address]);

  /** 노드 정보 로드 */
  const loadNodes = useCallback(async () => {
    if (!address) return;
    setIsLoadingNodes(true);
    try {
      const normalizedAddress = address.toLowerCase();
      const purchases = await getUserNodePurchases(normalizedAddress);
      if (purchases && purchases.length > 0) {
        const nodes: UserNode[] = purchases.map((p) => ({
          id: p.id,
          name: p.nodeName,
          price: p.nodePrice,
          color: p.nodeColor,
          purchaseDate: new Date(p.purchaseDate).toISOString(),
          status:
            p.status === "completed"
              ? "Active"
              : p.status === "pending"
              ? "Pending"
              : "Expired",
          transactionHash: p.transactionHash,
          nodeId: p.nodeId,
        }));
        setUserNodes(nodes);

        // 노드 추천 코드 로드
        try {
          const userCodes = await getUserReferralCodes(normalizedAddress);
          if (userCodes) setNodeReferralCodes(userCodes.nodeCodes);
        } catch (e) {
          console.error("Failed to load node referral codes:", e);
        }
      } else {
        setUserNodes([]);
      }
    } catch (err) {
      console.error("Failed to load user nodes:", err);
      // localStorage 폴백
      const stored = localStorage.getItem(`user_nodes_${address}`);
      if (stored) {
        try {
          setUserNodes(JSON.parse(stored));
        } catch {
          setUserNodes([]);
        }
      } else {
        setUserNodes([]);
      }
    } finally {
      setIsLoadingNodes(false);
    }
  }, [address]);

  /** 투자 내역 로드 (Firebase + 컨트랙트 이벤트 병합) */
  const loadInvestments = useCallback(async () => {
    if (!address) return;
    setIsLoadingInvestments(true);
    setIsLoadingSBAGWallet(true);
    try {
      const normalizedAddress = address.toLowerCase();

      // Firebase 투자 + SBAG 지갑 전송 동시 조회
      const [firebaseInvestments, sbagTransfers, sbagTotal] = await Promise.all([
        getUserInvestmentsByCategory(normalizedAddress),
        getSBAGUSDTTransfers(normalizedAddress).catch(() => []),
        getSBAGTotalInvestment(normalizedAddress).catch(() => 0),
      ]);

      setSbagWalletInvestment(sbagTotal);

      // 컨트랙트 투자 목록 변환
      const contractList: UserInvestment[] = [];
      if (contractInvestments && contractInvestments.length > 0 && decimals) {
        contractInvestments.forEach((inv, idx) => {
          const amount = parseFloat(formatUnits(inv.amount, decimals));
          if (amount > 0) {
            contractList.push({
              id: `contract_${inv.investId}_${inv.transactionHash || idx}`,
              userId: normalizedAddress,
              category: "BBAG" as InvestmentCategory,
              projectId: `contract_invest_${inv.investId}`,
              projectName: inv.transactionHash
                ? `Investment (${new Date(inv.timestamp || Date.now()).toLocaleDateString()})`
                : `Investment #${inv.investId}`,
              amount,
              ownershipPercentage: 0,
              transactionHash: inv.transactionHash || undefined,
              investedAt: inv.timestamp || Date.now(),
              createdAt: inv.timestamp || Date.now(),
              updatedAt: Date.now(),
            });
          }
        });
      }

      const sbagWalletList: UserInvestment[] = sbagTransfers.map((t, idx) => ({
        id: `sbag_wallet_${t.transactionHash}_${idx}`,
        userId: normalizedAddress,
        category: "SBAG" as InvestmentCategory,
        projectId: "sbag_wallet_0xFdb440cA2285Ab6d09A88B13a4b49A0323C94CE6",
        projectName: "SBAG Wallet (0xFdb440cA2285Ab6d09A88B13a4b49A0323C94CE6)",
        amount: Number(t.amount),
        ownershipPercentage: 0,
        transactionHash: t.transactionHash,
        investedAt: t.timestamp,
        createdAt: t.timestamp,
        updatedAt: t.timestamp,
      }));

      // 병합 + 중복 제거
      const merged: Record<InvestmentCategory, UserInvestment[]> = {
        BBAG: [...firebaseInvestments.BBAG, ...contractList.filter((i) => i.category === "BBAG")],
        SBAG: [...contractList.filter((i) => i.category === "SBAG"), ...sbagWalletList],
        CBAG: [...firebaseInvestments.CBAG, ...contractList.filter((i) => i.category === "CBAG")],
      };

      const unique: Record<InvestmentCategory, UserInvestment[]> = { BBAG: [], SBAG: [], CBAG: [] };
      const seenHashes = new Set<string>();
      const seenContractIds = new Set<string>();

      (Object.keys(merged) as InvestmentCategory[]).forEach((cat) => {
        merged[cat].forEach((inv) => {
          if (inv.id.startsWith("contract_")) {
            if (!seenContractIds.has(inv.projectId)) {
              seenContractIds.add(inv.projectId);
              unique[cat].push(inv);
            }
          } else if (inv.transactionHash) {
            if (!seenHashes.has(inv.transactionHash)) {
              seenHashes.add(inv.transactionHash);
              unique[cat].push(inv);
            }
          } else {
            unique[cat].push(inv);
          }
        });
      });

      setInvestmentsByCategory(unique);
    } catch (err) {
      console.error("Failed to load investments:", err);
    } finally {
      setIsLoadingInvestments(false);
      setIsLoadingSBAGWallet(false);
    }
  }, [address, contractInvestments, decimals]);

  /** 특정 플랜의 지갑 전송 내역 로드 (BBAG/SBAG/CBAG) */
  const loadPlanWallets = useCallback(async () => {
    if (!address) return;
    try {
      const plans = await getAllPlans();
      const plan = plans.find((p) => {
        const nameUpper = p.name.toUpperCase();
        return (
          nameUpper.includes("BBAG") &&
          nameUpper.includes("SBAG") &&
          nameUpper.includes("CBAG") &&
          (nameUpper.includes("BINANCEALPHA") || nameUpper.includes("NUMI"))
        );
      });
      if (!plan) return;

      setTargetPlan(plan);
      const normalizedAddress = address.toLowerCase();

      const walletAddresses = [
        plan.useUserAddress1 ? address : plan.wallet1 || "",
        plan.useUserAddress2 ? address : plan.wallet2 || "",
        plan.useUserAddress3 ? address : plan.wallet3 || "",
      ];

      // 3개 지갑 전송 내역 병렬 조회
      setBbagWallet((p) => ({ ...p, address: walletAddresses[0], isLoading: true }));
      setSbagWallet((p) => ({ ...p, address: walletAddresses[1], isLoading: true }));
      setCbagWallet((p) => ({ ...p, address: walletAddresses[2], isLoading: true }));

      const [bbagResult, sbagResult, cbagResult] = await Promise.allSettled([
        walletAddresses[0]
          ? Promise.all([
              getUSDTTransfers(normalizedAddress, walletAddresses[0]),
              getTotalInvestment(normalizedAddress, walletAddresses[0]),
            ])
          : Promise.resolve([[], 0]),
        walletAddresses[1]
          ? Promise.all([
              getUSDTTransfers(normalizedAddress, walletAddresses[1]),
              getTotalInvestment(normalizedAddress, walletAddresses[1]),
            ])
          : Promise.resolve([[], 0]),
        walletAddresses[2]
          ? Promise.all([
              getUSDTTransfers(normalizedAddress, walletAddresses[2]),
              getTotalInvestment(normalizedAddress, walletAddresses[2]),
            ])
          : Promise.resolve([[], 0]),
      ]);

      if (bbagResult.status === "fulfilled") {
        const [transfers, total] = bbagResult.value as [USDTTransfer[], number];
        const profit =
          plan.wallet1TokenConversionRate && plan.wallet1TokenPrice
            ? total * plan.wallet1TokenConversionRate * plan.wallet1TokenPrice
            : 0;
        setBbagWallet({ address: walletAddresses[0], transfers, totalInvestment: total, totalProfit: profit, isLoading: false });
      } else {
        setBbagWallet((p) => ({ ...p, isLoading: false }));
      }

      if (sbagResult.status === "fulfilled") {
        const [transfers, total] = sbagResult.value as [USDTTransfer[], number];
        const profit =
          plan.wallet2TokenConversionRate && plan.wallet2TokenPrice
            ? total * plan.wallet2TokenConversionRate * plan.wallet2TokenPrice
            : 0;
        setSbagWallet({ address: walletAddresses[1], transfers, totalInvestment: total, totalProfit: profit, isLoading: false });
      } else {
        setSbagWallet((p) => ({ ...p, isLoading: false }));
      }

      if (cbagResult.status === "fulfilled") {
        const [transfers, total] = cbagResult.value as [USDTTransfer[], number];
        setCbagWallet({ address: walletAddresses[2], transfers, totalInvestment: total, totalProfit: 0, isLoading: false });
      } else {
        setCbagWallet((p) => ({ ...p, isLoading: false }));
      }
    } catch (err) {
      console.error("Failed to load plan wallets:", err);
    }
  }, [address]);

  // 연결 시 모든 데이터를 병렬로 초기 로드
  useEffect(() => {
    if (!isConnected || !address) {
      setUserNodes([]);
      setSbagPositions([]);
      setInvestmentsByCategory({ BBAG: [], SBAG: [], CBAG: [] });
      setBbagWallet(DEFAULT_WALLET_DATA);
      setSbagWallet(DEFAULT_WALLET_DATA);
      setCbagWallet(DEFAULT_WALLET_DATA);
      return;
    }

    // 모든 독립적인 섹션 병렬 로드
    Promise.all([loadNodes(), loadInvestments(), refreshSBAG(), loadPlanWallets()]);
  }, [isConnected, address, loadNodes, loadInvestments, refreshSBAG, loadPlanWallets]);

  return {
    userNodes,
    isLoadingNodes,
    nodeReferralCodes,
    investmentsByCategory,
    isLoadingInvestments,
    sbagPositions,
    isLoadingSBAG,
    sbagWalletInvestment,
    isLoadingSBAGWallet,
    bbagWallet,
    sbagWallet,
    cbagWallet,
    targetPlan,
    refreshSBAG,
  };
}
