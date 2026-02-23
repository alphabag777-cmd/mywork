/**
 * userActivityLog.ts
 * Firestore 기반 사용자 활동 로그 컬렉션
 *
 * 컬렉션: user_activity_logs
 * 문서 구조: { userId, action, metadata, createdAt }
 *
 * 어드민 대시보드에서 조회 가능하며,
 * 앱 전반에서 logActivity()를 호출해 기록합니다.
 */

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ActivityAction =
  | "page_view"          // 페이지 방문
  | "wallet_connect"     // 지갑 연결
  | "wallet_disconnect"  // 지갑 해제
  | "investment_made"    // 투자 실행
  | "ticket_created"     // 지원 티켓 생성
  | "ticket_reply"       // 티켓 답글
  | "referral_link_copy" // 추천 링크 복사
  | "plan_viewed"        // 투자 상품 조회
  | "certificate_download" // 인증서 다운로드
  | "profile_updated";   // 프로필(코드/이름) 변경

export interface ActivityLog {
  id: string;
  userId: string;         // 지갑 주소 (lowercase)
  action: ActivityAction;
  metadata?: Record<string, unknown>; // 추가 컨텍스트 (planName, amount 등)
  createdAt: number;      // millis
}

const COLLECTION = "user_activity_logs";

function fromDoc(d: any): ActivityLog {
  const data = d.data();
  return {
    id: d.id,
    userId: data.userId ?? "",
    action: data.action ?? "page_view",
    metadata: data.metadata ?? {},
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toMillis()
      : data.createdAt ?? Date.now(),
  };
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * 사용자 활동을 기록합니다.
 * 실패해도 앱 동작에 영향을 주지 않도록 오류를 무시합니다.
 */
export async function logActivity(
  userId: string,
  action: ActivityAction,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!userId) return;
  try {
    await addDoc(collection(db, COLLECTION), {
      userId: userId.toLowerCase(),
      action,
      metadata: metadata ?? {},
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // 로그 실패는 무시 (비필수 기능)
    console.debug("[ActivityLog] Failed to write:", err);
  }
}

// ── Read ──────────────────────────────────────────────────────────────────────

/** 특정 유저의 최근 활동 로그를 가져옵니다 */
export async function getUserActivityLogs(
  userId: string,
  limitCount = 50
): Promise<ActivityLog[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where("userId", "==", userId.toLowerCase()),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(fromDoc);
  } catch (err) {
    console.error("[ActivityLog] Failed to fetch user logs:", err);
    return [];
  }
}

/** 전체 유저의 최근 활동 로그를 가져옵니다 (어드민 전용) */
export async function getAllActivityLogs(
  limitCount = 200
): Promise<ActivityLog[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(fromDoc);
  } catch (err) {
    console.error("[ActivityLog] Failed to fetch all logs:", err);
    return [];
  }
}

/** 특정 액션 타입 집계 (어드민 통계용) */
export async function getActivityCountByAction(
  action: ActivityAction,
  since?: number // millis
): Promise<number> {
  try {
    let q = query(
      collection(db, COLLECTION),
      where("action", "==", action)
    );
    // Firestore에서 count 쿼리 미지원 시 getDocs 대안 사용
    const snap = await getDocs(q);
    if (!since) return snap.size;
    return snap.docs.filter(d => {
      const ts = d.data().createdAt;
      const ms = ts instanceof Timestamp ? ts.toMillis() : ts ?? 0;
      return ms >= since;
    }).length;
  } catch {
    return 0;
  }
}
