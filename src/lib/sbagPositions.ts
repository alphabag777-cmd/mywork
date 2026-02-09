/**
 * SBAG Position tracking for NUMI via Binance Alpha
 * Tracks SBAG purchases, back-office confirmations, and sell delegations
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface SBAGPosition {
  id: string;
  userId: string; // Wallet address
  projectId: string; // Project/Plan ID
  projectName: string; // Project name (e.g., "Binance Alpha - NUMI")
  
  // Purchase information
  investedUSDT: number; // Initial investment amount in USDT
  investedAt: number; // Timestamp when investment was made
  
  // Back-office confirmation (entered 1-10 minutes after investment)
  purchasedNUMI: number; // Confirmed NUMI quantity purchased
  purchasePriceUSDT: number; // Purchase price per NUMI in USDT
  purchaseTimestamp: number; // Timestamp when back-office confirmed
  backofficeConfirmed: boolean; // Whether back-office has confirmed
  backofficeEnteredAt?: number; // Timestamp when back-office entered the data
  
  // Real-time price data (from CoinMarketCap)
  currentPriceUSDT?: number; // Current NUMI market price
  lastPriceUpdate?: number; // Timestamp of last price update
  
  // Sell delegation
  sellDelegations: SellDelegation[]; // Array of sell orders
  
  // Metadata
  transactionHash?: string; // Original investment transaction hash
  createdAt: number;
  updatedAt: number;
}

export interface SellDelegation {
  id: string;
  numiAmount: number; // Amount of NUMI to sell
  requestedAt: number; // Timestamp when sell was requested
  status: "pending" | "processing" | "completed" | "cancelled" | "failed";
  executedAt?: number; // Timestamp when sell was executed
  executedPriceUSDT?: number; // Price at which it was executed
  transactionHash?: string; // Transaction hash if executed
  slippage?: number; // Actual slippage percentage
  notes?: string; // Additional notes
}

const SBAG_POSITIONS_COLLECTION = "sbag_positions";
const SELL_DELEGATIONS_COLLECTION = "sell_delegations";

function timestampToNumber(timestamp: any): number {
  if (!timestamp) return Date.now();
  if (timestamp instanceof Timestamp) {
    return timestamp.toMillis();
  }
  if (typeof timestamp === "number") {
    return timestamp;
  }
  return Date.now();
}

function fromFirestore(docData: any, id: string): SBAGPosition {
  return {
    id,
    userId: docData.userId || "",
    projectId: docData.projectId || "",
    projectName: docData.projectName || "",
    investedUSDT: docData.investedUSDT || 0,
    investedAt: timestampToNumber(docData.investedAt),
    purchasedNUMI: docData.purchasedNUMI || 0,
    purchasePriceUSDT: docData.purchasePriceUSDT || 0,
    purchaseTimestamp: timestampToNumber(docData.purchaseTimestamp),
    backofficeConfirmed: docData.backofficeConfirmed || false,
    backofficeEnteredAt: docData.backofficeEnteredAt ? timestampToNumber(docData.backofficeEnteredAt) : undefined,
    currentPriceUSDT: docData.currentPriceUSDT || undefined,
    lastPriceUpdate: docData.lastPriceUpdate ? timestampToNumber(docData.lastPriceUpdate) : undefined,
    sellDelegations: docData.sellDelegations || [],
    transactionHash: docData.transactionHash || undefined,
    createdAt: timestampToNumber(docData.createdAt),
    updatedAt: timestampToNumber(docData.updatedAt),
  };
}

function toFirestore(position: Partial<SBAGPosition>): any {
  const now = Timestamp.now();
  return {
    userId: position.userId?.toLowerCase() || "",
    projectId: position.projectId || "",
    projectName: position.projectName || "",
    investedUSDT: position.investedUSDT || 0,
    investedAt: position.investedAt ? Timestamp.fromMillis(position.investedAt) : now,
    purchasedNUMI: position.purchasedNUMI || 0,
    purchasePriceUSDT: position.purchasePriceUSDT || 0,
    purchaseTimestamp: position.purchaseTimestamp ? Timestamp.fromMillis(position.purchaseTimestamp) : now,
    backofficeConfirmed: position.backofficeConfirmed || false,
    backofficeEnteredAt: position.backofficeEnteredAt ? Timestamp.fromMillis(position.backofficeEnteredAt) : null,
    currentPriceUSDT: position.currentPriceUSDT || null,
    lastPriceUpdate: position.lastPriceUpdate ? Timestamp.fromMillis(position.lastPriceUpdate) : null,
    sellDelegations: position.sellDelegations || [],
    transactionHash: position.transactionHash || null,
    createdAt: position.createdAt ? Timestamp.fromMillis(position.createdAt) : now,
    updatedAt: now,
  };
}

/**
 * Create a new SBAG position (when user invests)
 */
export async function createSBAGPosition(
  position: Omit<SBAGPosition, "id" | "createdAt" | "updatedAt" | "backofficeConfirmed" | "purchasedNUMI" | "purchasePriceUSDT" | "purchaseTimestamp" | "sellDelegations">
): Promise<SBAGPosition> {
  try {
    const now = Date.now();
    const positionId = `sbag_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    const positionData: SBAGPosition = {
      ...position,
      id: positionId,
      backofficeConfirmed: false,
      purchasedNUMI: 0,
      purchasePriceUSDT: 0,
      purchaseTimestamp: now,
      sellDelegations: [],
      createdAt: now,
      updatedAt: now,
    };
    
    const positionRef = doc(db, SBAG_POSITIONS_COLLECTION, positionId);
    await setDoc(positionRef, toFirestore(positionData));
    
    return positionData;
  } catch (error) {
    console.error("Error creating SBAG position:", error);
    throw error;
  }
}

/**
 * Back-office confirmation: Update position with purchased NUMI amount and price
 */
export async function confirmSBAGPurchase(
  positionId: string,
  purchasedNUMI: number,
  purchasePriceUSDT: number
): Promise<SBAGPosition> {
  try {
    const positionRef = doc(db, SBAG_POSITIONS_COLLECTION, positionId);
    const existingDoc = await getDoc(positionRef);
    
    if (!existingDoc.exists()) {
      throw new Error("SBAG position not found");
    }
    
    const existingData = fromFirestore(existingDoc.data(), positionId);
    const now = Date.now();
    
    const updatedData: SBAGPosition = {
      ...existingData,
      purchasedNUMI,
      purchasePriceUSDT,
      purchaseTimestamp: now,
      backofficeConfirmed: true,
      backofficeEnteredAt: now,
      updatedAt: now,
    };
    
    await setDoc(positionRef, toFirestore(updatedData));
    return updatedData;
  } catch (error) {
    console.error("Error confirming SBAG purchase:", error);
    throw error;
  }
}

/**
 * Update current NUMI price from CoinMarketCap
 */
export async function updateSBAGPrice(
  positionId: string,
  currentPriceUSDT: number
): Promise<SBAGPosition> {
  try {
    const positionRef = doc(db, SBAG_POSITIONS_COLLECTION, positionId);
    const existingDoc = await getDoc(positionRef);
    
    if (!existingDoc.exists()) {
      throw new Error("SBAG position not found");
    }
    
    const existingData = fromFirestore(existingDoc.data(), positionId);
    const now = Date.now();
    
    const updatedData: SBAGPosition = {
      ...existingData,
      currentPriceUSDT,
      lastPriceUpdate: now,
      updatedAt: now,
    };
    
    await setDoc(positionRef, toFirestore(updatedData));
    return updatedData;
  } catch (error) {
    console.error("Error updating SBAG price:", error);
    throw error;
  }
}

/**
 * Get all SBAG positions for a user
 */
export async function getUserSBAGPositions(userId: string): Promise<SBAGPosition[]> {
  try {
    const positionsRef = collection(db, SBAG_POSITIONS_COLLECTION);
    const normalizedUserId = userId.toLowerCase();
    
    try {
      const q = query(
        positionsRef,
        where("userId", "==", normalizedUserId),
        orderBy("investedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      const positions: SBAGPosition[] = [];
      querySnapshot.forEach((doc) => {
        positions.push(fromFirestore(doc.data(), doc.id));
      });
      
      positions.sort((a, b) => b.investedAt - a.investedAt);
      
      return positions;
    } catch (orderByError: any) {
      if (orderByError.code === "failed-precondition") {
        console.warn("Composite index missing, fetching without orderBy:", orderByError);
        const q = query(
          positionsRef,
          where("userId", "==", normalizedUserId)
        );
        const querySnapshot = await getDocs(q);
        
        const positions: SBAGPosition[] = [];
        querySnapshot.forEach((doc) => {
          positions.push(fromFirestore(doc.data(), doc.id));
        });
        
        positions.sort((a, b) => b.investedAt - a.investedAt);
        
        return positions;
      }
      throw orderByError;
    }
  } catch (error) {
    console.error("Error getting user SBAG positions:", error);
    return [];
  }
}

/**
 * Get a single SBAG position by ID
 */
export async function getSBAGPosition(positionId: string): Promise<SBAGPosition | null> {
  try {
    const positionRef = doc(db, SBAG_POSITIONS_COLLECTION, positionId);
    const docSnapshot = await getDoc(positionRef);
    
    if (!docSnapshot.exists()) {
      return null;
    }
    
    return fromFirestore(docSnapshot.data(), positionId);
  } catch (error) {
    console.error("Error getting SBAG position:", error);
    return null;
  }
}

/**
 * Create a sell delegation (sell order request)
 */
export async function createSellDelegation(
  positionId: string,
  numiAmount: number
): Promise<SellDelegation> {
  try {
    const positionRef = doc(db, SBAG_POSITIONS_COLLECTION, positionId);
    const existingDoc = await getDoc(positionRef);
    
    if (!existingDoc.exists()) {
      throw new Error("SBAG position not found");
    }
    
    const existingData = fromFirestore(existingDoc.data(), positionId);
    
    // Check if user has enough NUMI
    const availableNUMI = existingData.purchasedNUMI - 
      existingData.sellDelegations
        .filter(sd => sd.status === "pending" || sd.status === "processing")
        .reduce((sum, sd) => sum + sd.numiAmount, 0);
    
    if (numiAmount > availableNUMI) {
      throw new Error("Insufficient NUMI balance");
    }
    
    const sellDelegation: SellDelegation = {
      id: `sell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      numiAmount,
      requestedAt: Date.now(),
      status: "pending",
    };
    
    const updatedSellDelegations = [...existingData.sellDelegations, sellDelegation];
    
    const updatedData: SBAGPosition = {
      ...existingData,
      sellDelegations: updatedSellDelegations,
      updatedAt: Date.now(),
    };
    
    await setDoc(positionRef, toFirestore(updatedData));
    return sellDelegation;
  } catch (error) {
    console.error("Error creating sell delegation:", error);
    throw error;
  }
}

/**
 * Update sell delegation status (for trading executor)
 */
export async function updateSellDelegation(
  positionId: string,
  sellDelegationId: string,
  updates: Partial<SellDelegation>
): Promise<SBAGPosition> {
  try {
    const positionRef = doc(db, SBAG_POSITIONS_COLLECTION, positionId);
    const existingDoc = await getDoc(positionRef);
    
    if (!existingDoc.exists()) {
      throw new Error("SBAG position not found");
    }
    
    const existingData = fromFirestore(existingDoc.data(), positionId);
    
    const updatedSellDelegations = existingData.sellDelegations.map((sd) => {
      if (sd.id === sellDelegationId) {
        return { ...sd, ...updates };
      }
      return sd;
    });
    
    const updatedData: SBAGPosition = {
      ...existingData,
      sellDelegations: updatedSellDelegations,
      updatedAt: Date.now(),
    };
    
    await setDoc(positionRef, toFirestore(updatedData));
    return updatedData;
  } catch (error) {
    console.error("Error updating sell delegation:", error);
    throw error;
  }
}

/**
 * Get all SBAG positions (admin function)
 */
export async function getAllSBAGPositions(): Promise<SBAGPosition[]> {
  try {
    const positionsRef = collection(db, SBAG_POSITIONS_COLLECTION);
    const q = query(positionsRef, orderBy("investedAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const positions: SBAGPosition[] = [];
    querySnapshot.forEach((doc) => {
      positions.push(fromFirestore(doc.data(), doc.id));
    });
    
    return positions;
  } catch (error) {
    console.error("Error getting all SBAG positions:", error);
    return [];
  }
}

/**
 * Delete a SBAG position (admin function)
 */
export async function deleteSBAGPosition(positionId: string): Promise<boolean> {
  try {
    const positionRef = doc(db, SBAG_POSITIONS_COLLECTION, positionId);
    await deleteDoc(positionRef);
    return true;
  } catch (error) {
    console.error("Error deleting SBAG position:", error);
    throw error;
  }
}
