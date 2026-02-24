/**
 * Firebase configuration and initialization
 * - Firestore 연결을 앱 시작 시 즉시 warm-up하여 첫 요청 지연을 최소화합니다.
 */

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, doc, getDoc } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "",
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || "",
};

// Initialize Firebase (only if not already initialized)
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firestore
export const db: Firestore = getFirestore(app);

// Initialize Firebase Storage
export const storage: FirebaseStorage = getStorage(app);

/**
 * Firestore 연결 warm-up
 * - 앱이 처음 로드될 때 admin_config/credentials를 미리 읽어
 *   TCP 연결·인증 오버헤드를 제거합니다.
 * - 실패해도 앱 동작에는 영향 없습니다.
 */
function warmUpFirestore(): void {
  // 이미 캐시가 있으면 warm-up 불필요
  try {
    const cached = sessionStorage.getItem("alphabag_admin_creds_cache");
    if (cached) return;
  } catch { /* noop */ }

  // 백그라운드에서 credentials 미리 로드 (결과 무시)
  const ref = doc(db, "admin_config/credentials");
  getDoc(ref).catch(() => { /* 네트워크 오류 무시 */ });
}

// 앱 시작 시 즉시 실행
warmUpFirestore();

export default app;
