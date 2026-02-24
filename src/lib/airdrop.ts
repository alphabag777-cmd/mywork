/**
 * Airdrop utilities
 * Admin can create airdrop campaigns and distribute tokens to users.
 * Users can claim their airdrop rewards.
 * All data is stored in Firebase Firestore.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AirdropStatus = "active" | "paused" | "ended";
export type ClaimStatus   = "pending" | "claimed" | "expired";
export type AirdropTarget = "all" | "selected";

export interface AirdropCampaign {
  id: string;
  title: string;
  description: string;
  tokenSymbol: string;       // e.g. "NUMI", "USDT", "BNB"
  tokenAmount: number;       // Amount per user
  totalBudget: number;       // Total tokens allocated
  totalClaimed: number;      // How many tokens have been claimed
  claimedCount: number;      // How many users have claimed
  targetType: AirdropTarget; // "all" = all users, "selected" = specific wallets
  targetWallets: string[];   // Used when targetType = "selected"
  status: AirdropStatus;
  startAt: number;
  endAt: number | null;      // null = no expiry
  createdAt: number;
  updatedAt: number;
  imageUrl?: string;
  requiresReferral: boolean; // Only users who have a referrer can claim
  maxClaimCount: number | null; // null = unlimited
  claimMessage: string;      // Message shown after successful claim
  networkId: string;         // e.g. "bsc", "eth", "tron"
}

export interface AirdropClaim {
  id: string;
  campaignId: string;
  campaignTitle: string;
  userId: string;            // wallet address
  tokenSymbol: string;
  tokenAmount: number;
  status: ClaimStatus;
  claimedAt: number | null;
  createdAt: number;
  txHash?: string;
}

// ─── Collection Names ─────────────────────────────────────────────────────────

const CAMPAIGNS_COL = "airdrop_campaigns";
const CLAIMS_COL    = "airdrop_claims";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tsToNum(ts: any): number {
  if (!ts) return Date.now();
  if (ts instanceof Timestamp) return ts.toMillis();
  if (typeof ts === "number")  return ts;
  return Date.now();
}

function campaignFromDoc(data: any, id: string): AirdropCampaign {
  return {
    id,
    title:            data.title            ?? "",
    description:      data.description      ?? "",
    tokenSymbol:      data.tokenSymbol       ?? "NUMI",
    tokenAmount:      data.tokenAmount       ?? 0,
    totalBudget:      data.totalBudget       ?? 0,
    totalClaimed:     data.totalClaimed      ?? 0,
    claimedCount:     data.claimedCount      ?? 0,
    targetType:       data.targetType        ?? "all",
    targetWallets:    data.targetWallets     ?? [],
    status:           data.status            ?? "active",
    startAt:          tsToNum(data.startAt),
    endAt:            data.endAt ? tsToNum(data.endAt) : null,
    createdAt:        tsToNum(data.createdAt),
    updatedAt:        tsToNum(data.updatedAt),
    imageUrl:         data.imageUrl          ?? "",
    requiresReferral: data.requiresReferral  ?? false,
    maxClaimCount:    data.maxClaimCount      ?? null,
    claimMessage:     data.claimMessage       ?? "에어드랍이 성공적으로 지급되었습니다!",
    networkId:        data.networkId          ?? "bsc",
  };
}

function claimFromDoc(data: any, id: string): AirdropClaim {
  return {
    id,
    campaignId:    data.campaignId    ?? "",
    campaignTitle: data.campaignTitle ?? "",
    userId:        data.userId        ?? "",
    tokenSymbol:   data.tokenSymbol   ?? "",
    tokenAmount:   data.tokenAmount   ?? 0,
    status:        data.status        ?? "pending",
    claimedAt:     data.claimedAt ? tsToNum(data.claimedAt) : null,
    createdAt:     tsToNum(data.createdAt),
    txHash:        data.txHash        ?? "",
  };
}

// ─── Campaign CRUD (Admin) ────────────────────────────────────────────────────

/**
 * Create a new airdrop campaign
 */
export async function createAirdropCampaign(
  data: Omit<AirdropCampaign, "id" | "createdAt" | "updatedAt" | "totalClaimed" | "claimedCount">
): Promise<string> {
  const ref = await addDoc(collection(db, CAMPAIGNS_COL), {
    ...data,
    totalClaimed: 0,
    claimedCount: 0,
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
  });
  return ref.id;
}

/**
 * Update an existing campaign
 */
export async function updateAirdropCampaign(
  id: string,
  data: Partial<Omit<AirdropCampaign, "id" | "createdAt">>
): Promise<void> {
  const ref = doc(db, CAMPAIGNS_COL, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

/**
 * Delete a campaign
 */
export async function deleteAirdropCampaign(id: string): Promise<void> {
  const ref = doc(db, CAMPAIGNS_COL, id);
  await updateDoc(ref, { status: "ended", updatedAt: serverTimestamp() });
}

/**
 * Get all campaigns (admin)
 */
export async function getAllAirdropCampaigns(): Promise<AirdropCampaign[]> {
  const q = query(collection(db, CAMPAIGNS_COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => campaignFromDoc(d.data(), d.id));
}

/**
 * Get active campaigns only
 */
export async function getActiveCampaigns(): Promise<AirdropCampaign[]> {
  const q = query(
    collection(db, CAMPAIGNS_COL),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  const now = Date.now();
  return snap.docs
    .map(d => campaignFromDoc(d.data(), d.id))
    .filter(c => !c.endAt || c.endAt > now);
}

/**
 * Get a single campaign by id
 */
export async function getAirdropCampaign(id: string): Promise<AirdropCampaign | null> {
  const snap = await getDoc(doc(db, CAMPAIGNS_COL, id));
  if (!snap.exists()) return null;
  return campaignFromDoc(snap.data(), snap.id);
}

// ─── Distribute (Admin bulk assign) ──────────────────────────────────────────

/**
 * Admin bulk-distributes an airdrop to a list of wallet addresses.
 * Creates a "pending" claim doc for each wallet.
 * Skips wallets that already have a claim for this campaign.
 */
export async function distributeAirdrop(
  campaign: AirdropCampaign,
  walletAddresses: string[]
): Promise<{ success: number; skipped: number }> {
  // Fetch existing claims for this campaign to avoid duplicates
  const existingQ = query(
    collection(db, CLAIMS_COL),
    where("campaignId", "==", campaign.id)
  );
  const existingSnap = await getDocs(existingQ);
  const alreadyClaimed = new Set(
    existingSnap.docs.map(d => (d.data().userId as string).toLowerCase())
  );

  const toCreate = walletAddresses
    .map(w => w.toLowerCase())
    .filter(w => !alreadyClaimed.has(w));

  const BATCH_SIZE = 400;
  let success = 0;

  for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = toCreate.slice(i, i + BATCH_SIZE);
    for (const wallet of chunk) {
      const ref = doc(collection(db, CLAIMS_COL));
      batch.set(ref, {
        campaignId:    campaign.id,
        campaignTitle: campaign.title,
        userId:        wallet,
        tokenSymbol:   campaign.tokenSymbol,
        tokenAmount:   campaign.tokenAmount,
        status:        "pending",
        claimedAt:     null,
        createdAt:     serverTimestamp(),
        txHash:        "",
      });
    }
    await batch.commit();
    success += chunk.length;
  }

  return { success, skipped: walletAddresses.length - success };
}

// ─── Claim (User) ─────────────────────────────────────────────────────────────

/**
 * Check if a user has a pending/claimable airdrop for a campaign
 */
export async function getUserClaim(
  campaignId: string,
  userId: string
): Promise<AirdropClaim | null> {
  const q = query(
    collection(db, CLAIMS_COL),
    where("campaignId", "==", campaignId),
    where("userId", "==", userId.toLowerCase()),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return claimFromDoc(snap.docs[0].data(), snap.docs[0].id);
}

/**
 * Get all claims for a user
 */
export async function getUserAllClaims(userId: string): Promise<AirdropClaim[]> {
  const q = query(
    collection(db, CLAIMS_COL),
    where("userId", "==", userId.toLowerCase()),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => claimFromDoc(d.data(), d.id));
}

/**
 * User claims their airdrop reward
 * Returns { ok, message }
 */
export async function claimAirdrop(
  campaignId: string,
  userId: string
): Promise<{ ok: boolean; message: string; claim?: AirdropClaim }> {
  const campaign = await getAirdropCampaign(campaignId);
  if (!campaign) return { ok: false, message: "캠페인을 찾을 수 없습니다." };
  if (campaign.status !== "active") return { ok: false, message: "현재 진행 중인 에어드랍이 아닙니다." };
  if (campaign.endAt && campaign.endAt < Date.now()) return { ok: false, message: "에어드랍 기간이 종료되었습니다." };

  // Max claim count check
  if (campaign.maxClaimCount !== null && campaign.claimedCount >= campaign.maxClaimCount) {
    return { ok: false, message: "에어드랍 수량이 모두 소진되었습니다." };
  }

  const existing = await getUserClaim(campaignId, userId);

  if (existing) {
    if (existing.status === "claimed") return { ok: false, message: "이미 클레임한 에어드랍입니다." };
    if (existing.status === "expired") return { ok: false, message: "에어드랍 기간이 만료되었습니다." };

    // Mark as claimed
    const claimRef = doc(db, CLAIMS_COL, existing.id);
    await updateDoc(claimRef, {
      status:    "claimed",
      claimedAt: serverTimestamp(),
    });

    // Update campaign stats
    const campRef = doc(db, CAMPAIGNS_COL, campaignId);
    await updateDoc(campRef, {
      totalClaimed: (campaign.totalClaimed ?? 0) + campaign.tokenAmount,
      claimedCount: (campaign.claimedCount ?? 0) + 1,
      updatedAt:    serverTimestamp(),
    });

    const updated: AirdropClaim = { ...existing, status: "claimed", claimedAt: Date.now() };
    return { ok: true, message: campaign.claimMessage, claim: updated };
  }

  // "all" target — create claim on the fly
  if (campaign.targetType === "all") {
    const claimRef = await addDoc(collection(db, CLAIMS_COL), {
      campaignId:    campaign.id,
      campaignTitle: campaign.title,
      userId:        userId.toLowerCase(),
      tokenSymbol:   campaign.tokenSymbol,
      tokenAmount:   campaign.tokenAmount,
      status:        "claimed",
      claimedAt:     serverTimestamp(),
      createdAt:     serverTimestamp(),
      txHash:        "",
    });

    // Update campaign stats
    const campRef = doc(db, CAMPAIGNS_COL, campaignId);
    await updateDoc(campRef, {
      totalClaimed: (campaign.totalClaimed ?? 0) + campaign.tokenAmount,
      claimedCount: (campaign.claimedCount ?? 0) + 1,
      updatedAt:    serverTimestamp(),
    });

    const newClaim: AirdropClaim = {
      id:            claimRef.id,
      campaignId:    campaign.id,
      campaignTitle: campaign.title,
      userId:        userId.toLowerCase(),
      tokenSymbol:   campaign.tokenSymbol,
      tokenAmount:   campaign.tokenAmount,
      status:        "claimed",
      claimedAt:     Date.now(),
      createdAt:     Date.now(),
    };
    return { ok: true, message: campaign.claimMessage, claim: newClaim };
  }

  return { ok: false, message: "이 에어드랍은 선택된 사용자만 클레임할 수 있습니다." };
}

// ─── Airdrop Settings (Admin Wallet + Networks) ──────────────────────────────

export interface AirdropNetwork {
  id: string;          // e.g. "bsc", "eth", "tron"
  name: string;        // e.g. "BNB Smart Chain (BSC)"
  chainId?: string;    // e.g. "56"
  rpcUrl?: string;
  explorerUrl?: string;// e.g. "https://bscscan.com"
  nativeCurrency: string; // e.g. "BNB"
  enabled: boolean;
}

export interface AirdropTokenSymbol {
  symbol: string;   // e.g. "NUMI", "USDT"
  name: string;     // e.g. "NUMI Token"
  enabled: boolean;
}

export interface AirdropSettings {
  adminWalletAddress: string;   // 에어드랍 송금 지갑 주소
  adminWalletNote: string;      // 메모 (선택)
  networks: AirdropNetwork[];   // 지원 네트워크 목록
  tokenSymbols: AirdropTokenSymbol[]; // 지원 토큰 심볼 목록
  updatedAt: number;
}

const SETTINGS_DOC = "airdrop_settings/config";

const DEFAULT_TOKEN_SYMBOLS: AirdropTokenSymbol[] = [
  { symbol: "NUMI",  name: "NUMI Token",   enabled: true  },
  { symbol: "USDT",  name: "Tether USD",   enabled: true  },
  { symbol: "BNB",   name: "BNB",          enabled: true  },
  { symbol: "SBAG",  name: "SBAG Token",   enabled: true  },
  { symbol: "BBAG",  name: "BBAG Token",   enabled: true  },
];

const DEFAULT_NETWORKS: AirdropNetwork[] = [
  { id: "bsc",   name: "BNB Smart Chain (BSC)", chainId: "56",         explorerUrl: "https://bscscan.com",    nativeCurrency: "BNB",  enabled: true  },
  { id: "eth",   name: "Ethereum (ERC-20)",      chainId: "1",          explorerUrl: "https://etherscan.io",   nativeCurrency: "ETH",  enabled: true  },
  { id: "tron",  name: "Tron (TRC-20)",           chainId: "",           explorerUrl: "https://tronscan.org",   nativeCurrency: "TRX",  enabled: true  },
  { id: "matic", name: "Polygon (MATIC)",          chainId: "137",        explorerUrl: "https://polygonscan.com",nativeCurrency: "MATIC",enabled: false },
  { id: "sol",   name: "Solana (SOL)",             chainId: "",           explorerUrl: "https://solscan.io",     nativeCurrency: "SOL",  enabled: false },
];

/** Airdrop 설정 불러오기 */
export async function getAirdropSettings(): Promise<AirdropSettings> {
  const ref  = doc(db, SETTINGS_DOC);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const d = snap.data();
    return {
      adminWalletAddress: d.adminWalletAddress ?? "",
      adminWalletNote:    d.adminWalletNote    ?? "",
      networks:           d.networks           ?? DEFAULT_NETWORKS,
      tokenSymbols:       d.tokenSymbols       ?? DEFAULT_TOKEN_SYMBOLS,
      updatedAt:          tsToNum(d.updatedAt),
    };
  }
  // 최초 기본값
  return {
    adminWalletAddress: "",
    adminWalletNote:    "",
    networks:           DEFAULT_NETWORKS,
    tokenSymbols:       DEFAULT_TOKEN_SYMBOLS,
    updatedAt:          Date.now(),
  };
}

/** Airdrop 설정 저장 */
export async function saveAirdropSettings(
  settings: Omit<AirdropSettings, "updatedAt">
): Promise<void> {
  const ref = doc(db, SETTINGS_DOC);
  await setDoc(ref, { ...settings, updatedAt: serverTimestamp() }, { merge: true });
}


/**
 * Get all claims for a campaign (admin)
 */
export async function getCampaignClaims(campaignId: string): Promise<AirdropClaim[]> {
  const q = query(
    collection(db, CLAIMS_COL),
    where("campaignId", "==", campaignId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => claimFromDoc(d.data(), d.id));
}

/**
 * Get all claims across all campaigns (admin overview)
 */
export async function getAllClaims(limitCount = 100): Promise<AirdropClaim[]> {
  const q = query(
    collection(db, CLAIMS_COL),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => claimFromDoc(d.data(), d.id));
}

/**
 * Subscribe to campaigns in real-time (for user page)
 */
export function subscribeCampaigns(callback: (campaigns: AirdropCampaign[]) => void) {
  const q = query(
    collection(db, CAMPAIGNS_COL),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, snap => {
    const now = Date.now();
    const campaigns = snap.docs
      .map(d => campaignFromDoc(d.data(), d.id))
      .filter(c => !c.endAt || c.endAt > now);
    callback(campaigns);
  });
}
