/**
 * useProfileData
 * Profile 페이지의 복잡한 데이터 로딩 로직을 한 곳에 집약한 custom hook.
 *
 * ✅ 무한루프 수정 (2024):
 *   - useEffect deps에서 useCallback 함수 제거 → address/isConnected만 의존
 *   - contractInvestments/decimals는 useRef로 최신값 유지 (deps 안 넣음)
 *   - loadAll 함수를 useEffect 내부에서 직접 정의해 closure 문제 제거
 */

import { useState, useEffect, useCallback, useRef } from "react";
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
  userNodes: UserNode[];
  isLoadingNodes: boolean;
  nodeReferralCodes: { [nodeId: string]: string };
  investmentsByCategory: Record<InvestmentCategory, UserInvestment[]>;
  isLoadingInvestments: boolean;
  sbagPositions: SBAGPosition[];
  isLoadingSBAG: boolean;
  sbagWalletInvestment: number;
  isLoadingSBAGWallet: boolean;
  bbagWallet: WalletData;
  sbagWallet: WalletData;
  cbagWallet: WalletData;
  targetPlan: InvestmentPlan | null;
  refreshSBAG: () => void;
}

const DEFAULT_WALLET_DATA: WalletData = {
  address: "",
  transfers: [],
  totalInvestment: 0,
  totalProfit: 0,
  isLoading: false,
};

const EMPTY_INVESTMENTS: Record<InvestmentCategory, UserInvestment[]> = {
  BBAG: [],
  SBAG: [],
  CBAG: [],
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
  >(EMPTY_INVESTMENTS);
  const [isLoadingInvestments, setIsLoadingInvestments] = useState(false);

  const [sbagPositions, setSbagPositions] = useState<SBAGPosition[]>([]);
  const [isLoadingSBAG, setIsLoadingSBAG] = useState(false);

  const [sbagWalletInvestment, setSbagWalletInvestment] = useState<number>(0);
  const [isLoadingSBAGWallet, setIsLoadingSBAGWallet] = useState(false);

  const [bbagWallet, setBbagWallet] = useState<WalletData>(DEFAULT_WALLET_DATA);
  const [sbagWallet, setSbagWallet] = useState<WalletData>(DEFAULT_WALLET_DATA);
  const [cbagWallet, setCbagWallet] = useState<WalletData>(DEFAULT_WALLET_DATA);
  const [targetPlan, setTargetPlan] = useState<InvestmentPlan | null>(null);

  // ✅ ref로 최신값 유지 (deps에 넣지 않아 무한루프 방지)
  const contractInvestmentsRef = useRef(contractInvestments);
  const decimalsRef = useRef(decimals);
  useEffect(() => { contractInvestmentsRef.current = contractInvestments; }, [contractInvestments]);
  useEffect(() => { decimalsRef.current = decimals; }, [decimals]);

  /** SBAG 포지션 새로고침 (외부에서 호출 가능) */
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

  // ✅ 핵심 수정: address/isConnected만 deps — callback 함수를 deps에서 제거
  useEffect(() => {
    if (!isConnected || !address) {
      setUserNodes([]);
      setSbagPositions([]);
      setInvestmentsByCategory(EMPTY_INVESTMENTS);
      setBbagWallet(DEFAULT_WALLET_DATA);
      setSbagWallet(DEFAULT_WALLET_DATA);
      setCbagWallet(DEFAULT_WALLET_DATA);
      setTargetPlan(null);
      return;
    }

    let cancelled = false;
    const normalizedAddress = address.toLowerCase();

    // ── 노드 로드 ──
    const loadNodes = async () => {
      setIsLoadingNodes(true);
      try {
        const purchases = await getUserNodePurchases(normalizedAddress);
        if (cancelled) return;
        if (purchases && purchases.length > 0) {
          const nodes: UserNode[] = purchases.map((p) => ({
            id: p.id,
            name: p.nodeName,
            price: p.nodePrice,
            color: p.nodeColor,
            purchaseDate: new Date(p.purchaseDate).toISOString(),
            status:
              p.status === "completed" ? "Active"
              : p.status === "pending"  ? "Pending"
              : "Expired",
            transactionHash: p.transactionHash,
            nodeId: p.nodeId,
          }));
          if (!cancelled) setUserNodes(nodes);
          try {
            const userCodes = await getUserReferralCodes(normalizedAddress);
            if (!cancelled && userCodes) setNodeReferralCodes(userCodes.nodeCodes);
          } catch { /* ignore */ }
        } else {
          if (!cancelled) setUserNodes([]);
        }
      } catch (err) {
        console.error("Failed to load user nodes:", err);
        if (!cancelled) {
          const stored = localStorage.getItem(`user_nodes_${address}`);
          try { setUserNodes(stored ? JSON.parse(stored) : []); } catch { setUserNodes([]); }
        }
      } finally {
        if (!cancelled) setIsLoadingNodes(false);
      }
    };

    // ── 투자 내역 로드 ──
    const loadInvestments = async () => {
      setIsLoadingInvestments(true);
      setIsLoadingSBAGWallet(true);
      try {
        const [firebaseInvestments, sbagTransfers, sbagTotal] = await Promise.all([
          getUserInvestmentsByCategory(normalizedAddress),
          getSBAGUSDTTransfers(normalizedAddress).catch(() => [] as USDTTransfer[]),
          getSBAGTotalInvestment(normalizedAddress).catch(() => 0),
        ]);
        if (cancelled) return;

        setSbagWalletInvestment(sbagTotal);

        // 컨트랙트 투자 목록 변환 (ref에서 최신값 읽기)
        const contractList: UserInvestment[] = [];
        const ci = contractInvestmentsRef.current;
        const dec = decimalsRef.current;
        if (ci && ci.length > 0 && dec) {
          ci.forEach((inv, idx) => {
            try {
              const amount = parseFloat(formatUnits(inv.amount, dec));
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
            } catch { /* skip bad entry */ }
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

        if (!cancelled) setInvestmentsByCategory(unique);
      } catch (err) {
        console.error("Failed to load investments:", err);
      } finally {
        if (!cancelled) {
          setIsLoadingInvestments(false);
          setIsLoadingSBAGWallet(false);
        }
      }
    };

    // ── SBAG 포지션 로드 ──
    const loadSBAG = async () => {
      setIsLoadingSBAG(true);
      try {
        const positions = await getUserSBAGPositions(normalizedAddress);
        if (!cancelled) setSbagPositions(positions);
      } catch (err) {
        console.error("Failed to load SBAG positions:", err);
      } finally {
        if (!cancelled) setIsLoadingSBAG(false);
      }
    };

    // ── 플랜 지갑 전송 로드 ──
    const loadPlanWallets = async () => {
      try {
        const plans = await getAllPlans();
        if (cancelled) return;
        const plan = plans.find((p) => {
          const n = p.name.toUpperCase();
          return n.includes("BBAG") && n.includes("SBAG") && n.includes("CBAG") &&
            (n.includes("BINANCEALPHA") || n.includes("NUMI"));
        });
        if (!plan || cancelled) return;

        setTargetPlan(plan);

        const walletAddresses = [
          plan.useUserAddress1 ? address : plan.wallet1 || "",
          plan.useUserAddress2 ? address : plan.wallet2 || "",
          plan.useUserAddress3 ? address : plan.wallet3 || "",
        ];

        if (!cancelled) {
          setBbagWallet((p) => ({ ...p, address: walletAddresses[0], isLoading: true }));
          setSbagWallet((p) => ({ ...p, address: walletAddresses[1], isLoading: true }));
          setCbagWallet((p) => ({ ...p, address: walletAddresses[2], isLoading: true }));
        }

        const [bbagResult, sbagResult, cbagResult] = await Promise.allSettled([
          walletAddresses[0]
            ? Promise.all([getUSDTTransfers(normalizedAddress, walletAddresses[0]), getTotalInvestment(normalizedAddress, walletAddresses[0])])
            : Promise.resolve([[], 0] as [USDTTransfer[], number]),
          walletAddresses[1]
            ? Promise.all([getUSDTTransfers(normalizedAddress, walletAddresses[1]), getTotalInvestment(normalizedAddress, walletAddresses[1])])
            : Promise.resolve([[], 0] as [USDTTransfer[], number]),
          walletAddresses[2]
            ? Promise.all([getUSDTTransfers(normalizedAddress, walletAddresses[2]), getTotalInvestment(normalizedAddress, walletAddresses[2])])
            : Promise.resolve([[], 0] as [USDTTransfer[], number]),
        ]);

        if (cancelled) return;

        if (bbagResult.status === "fulfilled") {
          const [transfers, total] = bbagResult.value as [USDTTransfer[], number];
          const profit = plan.wallet1TokenConversionRate && plan.wallet1TokenPrice
            ? total * plan.wallet1TokenConversionRate * plan.wallet1TokenPrice : 0;
          setBbagWallet({ address: walletAddresses[0], transfers, totalInvestment: total, totalProfit: profit, isLoading: false });
        } else {
          setBbagWallet((p) => ({ ...p, isLoading: false }));
        }

        if (sbagResult.status === "fulfilled") {
          const [transfers, total] = sbagResult.value as [USDTTransfer[], number];
          const profit = plan.wallet2TokenConversionRate && plan.wallet2TokenPrice
            ? total * plan.wallet2TokenConversionRate * plan.wallet2TokenPrice : 0;
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
    };

    // 모든 섹션 병렬 실행 (각각 독립적으로 에러 격리)
    Promise.allSettled([loadNodes(), loadInvestments(), loadSBAG(), loadPlanWallets()]);

    return () => { cancelled = true; };
    // ✅ address/isConnected만 deps (callback 함수 제거 → 무한루프 방지)
  }, [isConnected, address]); // eslint-disable-line react-hooks/exhaustive-deps

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
