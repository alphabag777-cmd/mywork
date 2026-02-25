/**
 * kyc.ts
 * KYC (Know Your Customer) 인증 데이터 관리
 * - 이름 + 이메일 + 휴대폰 번호 + Firebase Phone Auth SMS 인증
 */

import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type KycStatus = "none" | "pending" | "approved" | "rejected";

export interface KycData {
  id: string;               // walletAddress 또는 auth_<uid>
  name: string;             // 실명
  email: string;            // 이메일 (단순 입력)
  phone: string;            // 휴대폰 번호 (국제 형식 +82...)
  phoneVerified: boolean;   // SMS 인증 완료 여부
  status: KycStatus;        // 심사 상태
  submittedAt: number;      // 제출 시각
  reviewedAt?: number;      // 관리자 검토 시각
  rejectReason?: string;    // 거절 사유
}

const KYC_COLLECTION = "kyc";

/** KYC 정보 저장 / 업데이트 */
export async function saveKyc(userId: string, data: Partial<KycData>): Promise<void> {
  const ref = doc(db, KYC_COLLECTION, userId.toLowerCase());
  const existing = await getDoc(ref);
  const now = Date.now();

  if (existing.exists()) {
    await updateDoc(ref, {
      ...data,
      submittedAt: existing.data().submittedAt ?? now,
    });
  } else {
    await setDoc(ref, {
      id: userId.toLowerCase(),
      name: data.name || "",
      email: data.email || "",
      phone: data.phone || "",
      phoneVerified: data.phoneVerified ?? false,
      status: "pending" as KycStatus,
      submittedAt: now,
      ...data,
    });
  }
}

/** KYC 정보 조회 */
export async function getKyc(userId: string): Promise<KycData | null> {
  try {
    const ref = doc(db, KYC_COLLECTION, userId.toLowerCase());
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      id: snap.id,
      name: d.name || "",
      email: d.email || "",
      phone: d.phone || "",
      phoneVerified: d.phoneVerified ?? false,
      status: d.status || "none",
      submittedAt: d.submittedAt instanceof Timestamp
        ? d.submittedAt.toMillis()
        : d.submittedAt || 0,
      reviewedAt: d.reviewedAt instanceof Timestamp
        ? d.reviewedAt.toMillis()
        : d.reviewedAt,
      rejectReason: d.rejectReason,
    };
  } catch {
    return null;
  }
}

/** 전체 KYC 목록 조회 (관리자용) */
export async function getAllKyc(): Promise<KycData[]> {
  try {
    const ref = collection(db, KYC_COLLECTION);
    const q = query(ref, orderBy("submittedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        phoneVerified: data.phoneVerified ?? false,
        status: data.status || "none",
        submittedAt: data.submittedAt instanceof Timestamp
          ? data.submittedAt.toMillis()
          : data.submittedAt || 0,
        reviewedAt: data.reviewedAt instanceof Timestamp
          ? data.reviewedAt.toMillis()
          : data.reviewedAt,
        rejectReason: data.rejectReason,
      } as KycData;
    });
  } catch {
    return [];
  }
}

/** KYC 승인 (관리자) */
export async function approveKyc(userId: string): Promise<void> {
  const ref = doc(db, KYC_COLLECTION, userId.toLowerCase());
  await updateDoc(ref, {
    status: "approved",
    reviewedAt: Date.now(),
    rejectReason: null,
  });
}

/** KYC 거절 (관리자) */
export async function rejectKyc(userId: string, reason: string): Promise<void> {
  const ref = doc(db, KYC_COLLECTION, userId.toLowerCase());
  await updateDoc(ref, {
    status: "rejected",
    reviewedAt: Date.now(),
    rejectReason: reason,
  });
}
