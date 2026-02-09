/**
 * Ad images storage and management utilities
 * Handles CRUD operations for ad images using Firebase Firestore
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type AdPlacement = "fixed" | "rotating";

export interface AdImage {
  id: string;
  imageUrl: string;
  alt: string;
  order: number;
  linkUrl?: string;
  isActive: boolean;
  placement: AdPlacement;
  createdAt: number;
  updatedAt: number;
}

const ADS_COLLECTION = "ad_images";

/**
 * Convert Firestore timestamp to number
 */
function timestampToNumber(timestamp: any): number {
  if (timestamp?.toMillis) {
    return timestamp.toMillis();
  }
  if (timestamp?.seconds) {
    return timestamp.seconds * 1000;
  }
  return timestamp || Date.now();
}

/**
 * Convert ad data from Firestore format
 */
function fromFirestore(docData: any, id: string): AdImage {
  return {
    id,
    imageUrl: docData.imageUrl || "",
    alt: docData.alt || "",
    order: docData.order || 0,
    linkUrl: docData.linkUrl || "",
    isActive: docData.isActive !== undefined ? docData.isActive : true,
    placement: docData.placement || "fixed",
    createdAt: timestampToNumber(docData.createdAt),
    updatedAt: timestampToNumber(docData.updatedAt),
  };
}

/**
 * Convert ad data to Firestore format
 */
function toFirestore(ad: Partial<AdImage>): any {
  const now = Timestamp.now();
  return {
    imageUrl: ad.imageUrl || "",
    alt: ad.alt || "",
    order: ad.order || 0,
    linkUrl: ad.linkUrl || "",
    isActive: ad.isActive !== undefined ? ad.isActive : true,
    placement: ad.placement || "fixed",
    createdAt: ad.createdAt ? Timestamp.fromMillis(ad.createdAt) : now,
    updatedAt: now,
  };
}

/**
 * Get all active ad images from Firestore
 */
export async function getActiveAds(): Promise<AdImage[]> {
  try {
    const adsRef = collection(db, ADS_COLLECTION);
    const q = query(adsRef, orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);
    
    const ads: AdImage[] = [];
    querySnapshot.forEach((doc) => {
      const ad = fromFirestore(doc.data(), doc.id);
      if (ad.isActive) {
        ads.push(ad);
      }
    });
    
    return ads;
  } catch (error) {
    console.error("Error getting ads from Firestore:", error);
    return getAdsFromLocalStorage().filter(ad => ad.isActive);
  }
}

/**
 * Get fixed ad (first active fixed ad)
 */
export async function getFixedAd(): Promise<AdImage | null> {
  try {
    const ads = await getActiveAds();
    const fixedAds = ads.filter(ad => ad.placement === "fixed");
    return fixedAds.length > 0 ? fixedAds[0] : null;
  } catch (error) {
    console.error("Error getting fixed ad:", error);
    return null;
  }
}

/**
 * Get rotating ads (up to 3 active rotating ads)
 */
export async function getRotatingAds(): Promise<AdImage[]> {
  try {
    const ads = await getActiveAds();
    const rotatingAds = ads.filter(ad => ad.placement === "rotating");
    return rotatingAds.slice(0, 3); // Return up to 3 ads
  } catch (error) {
    console.error("Error getting rotating ads:", error);
    return [];
  }
}

/**
 * Get all ad images (including inactive) from Firestore
 */
export async function getAllAds(): Promise<AdImage[]> {
  try {
    const adsRef = collection(db, ADS_COLLECTION);
    const q = query(adsRef, orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);
    
    const ads: AdImage[] = [];
    querySnapshot.forEach((doc) => {
      ads.push(fromFirestore(doc.data(), doc.id));
    });
    
    return ads;
  } catch (error) {
    console.error("Error getting ads from Firestore:", error);
    return getAdsFromLocalStorage();
  }
}

/**
 * Get an ad by ID from Firestore
 */
export async function getAdById(id: string): Promise<AdImage | null> {
  try {
    const adRef = doc(db, ADS_COLLECTION, id);
    const adSnap = await getDoc(adRef);
    
    if (adSnap.exists()) {
      return fromFirestore(adSnap.data(), adSnap.id);
    }
    
    return null;
  } catch (error) {
    console.error("Error getting ad from Firestore:", error);
    const ads = getAdsFromLocalStorage();
    return ads.find((a) => a.id === id) || null;
  }
}

/**
 * Save an ad (create or update) to Firestore
 */
export async function saveAd(
  ad: Omit<AdImage, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<AdImage> {
  try {
    const now = Date.now();
    const adId = ad.id || `ad_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    let existingAd: AdImage | null = null;
    if (ad.id) {
      existingAd = await getAdById(ad.id);
    }
    
    const adData = toFirestore({
      ...ad,
      createdAt: existingAd?.createdAt || now,
    });
    
    const adRef = doc(db, ADS_COLLECTION, adId);
    await setDoc(adRef, adData);
    
    const savedAd: AdImage = {
      ...ad,
      id: adId,
      createdAt: existingAd?.createdAt || now,
      updatedAt: now,
      placement: ad.placement || "fixed",
    } as AdImage;
    
    saveAdToLocalStorage(savedAd);
    
    return savedAd;
  } catch (error) {
    console.error("Error saving ad to Firestore:", error);
    return saveAdToLocalStorage(ad);
  }
}

/**
 * Delete an ad by ID from Firestore
 */
export async function deleteAd(id: string): Promise<boolean> {
  try {
    const adRef = doc(db, ADS_COLLECTION, id);
    await deleteDoc(adRef);
    
    deleteAdFromLocalStorage(id);
    
    return true;
  } catch (error) {
    console.error("Error deleting ad from Firestore:", error);
    return deleteAdFromLocalStorage(id);
  }
}

// ========== LocalStorage Fallback Functions ==========

const ADS_STORAGE_KEY = "alphabag_ads";

function getAdsFromLocalStorage(): AdImage[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = localStorage.getItem(ADS_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const ads = JSON.parse(stored);
    // Ensure all ads have placement field
    return ads.map((ad: any) => ({
      ...ad,
      placement: ad.placement || "fixed",
    }));
  } catch (e) {
    console.error("Failed to parse ads from localStorage:", e);
    return [];
  }
}

function saveAdToLocalStorage(
  ad: Omit<AdImage, "id" | "createdAt" | "updatedAt"> & { id?: string }
): AdImage {
  if (typeof window === "undefined") {
    throw new Error("Cannot save ad: window is undefined");
  }

  const ads = getAdsFromLocalStorage();
  const now = Date.now();

  if (ad.id && ads.some((a) => a.id === ad.id)) {
    const updatedAds = ads.map((a) =>
      a.id === ad.id
        ? {
            ...ad,
            id: ad.id,
            updatedAt: now,
            createdAt: a.createdAt,
          }
        : a
    );
    localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(updatedAds));
    return updatedAds.find((a) => a.id === ad.id)!;
  } else {
    const newAd: AdImage = {
      ...ad,
      id: ad.id || `ad_${now}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    ads.push(newAd);
    localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(ads));
    return newAd;
  }
}

function deleteAdFromLocalStorage(id: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const ads = getAdsFromLocalStorage();
  const filtered = ads.filter((a) => a.id !== id);
  
  if (filtered.length === ads.length) {
    return false;
  }

  localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

