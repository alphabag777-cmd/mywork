/**
 * adminConfig.ts
 * Firestore 기반 어드민 계정 관리
 * - 컬렉션: admin_config / 문서: credentials
 * - 최초 접속 시 기본값(admin / admin123) 자동 초기화
 * - 패스워드는 SHA-256 해시로 저장
 * - sessionStorage 캐시로 Firestore 반복 조회 최소화
 */

import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const CONFIG_DOC = "admin_config/credentials";
const CACHE_KEY  = "alphabag_admin_creds_cache";
const CACHE_TTL  = 5 * 60 * 1000; // 5분

interface CredsCache {
  username: string;
  passwordHash: string;
  cachedAt: number;
}

/** SHA-256 해시 (Web Crypto API) */
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** sessionStorage 캐시에서 읽기 */
function readCache(): { username: string; passwordHash: string } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: CredsCache = JSON.parse(raw);
    if (Date.now() - cache.cachedAt > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return { username: cache.username, passwordHash: cache.passwordHash };
  } catch {
    return null;
  }
}

/** sessionStorage 캐시에 쓰기 */
function writeCache(username: string, passwordHash: string): void {
  try {
    const cache: CredsCache = { username, passwordHash, cachedAt: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // sessionStorage 사용 불가 환경 무시
  }
}

/** 캐시 무효화 (자격증명 변경 시 호출) */
function invalidateCache(): void {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch { /* noop */ }
}

/** Firestore에서 자격증명 가져오기 (없으면 기본값으로 초기화) */
async function getOrInitCredentials(): Promise<{
  username: string;
  passwordHash: string;
}> {
  // 1) 캐시 우선 확인 → 있으면 Firestore 왕복 없이 즉시 반환
  const cached = readCache();
  if (cached) return cached;

  // 2) Firestore 조회
  const ref  = doc(db, CONFIG_DOC);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const creds = snap.data() as { username: string; passwordHash: string };
    writeCache(creds.username, creds.passwordHash);
    return creds;
  }

  // 3) 최초 초기화 — admin / admin123
  const defaultHash = await sha256("admin123");
  const defaults = {
    username:     "admin",
    passwordHash: defaultHash,
    createdAt:    serverTimestamp(),
    updatedAt:    serverTimestamp(),
  };
  await setDoc(ref, defaults);
  writeCache("admin", defaultHash);
  return { username: "admin", passwordHash: defaultHash };
}

/** 로그인 검증 */
export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  try {
    const [creds, inputHash] = await Promise.all([
      getOrInitCredentials(),
      sha256(password),
    ]);
    return creds.username === username && creds.passwordHash === inputHash;
  } catch (e) {
    console.error("verifyAdminCredentials error:", e);
    // Firestore 오류 시 하드코딩 fallback
    return username === "admin" && password === "admin123";
  }
}

/** 패스워드 변경 */
export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; message: string }> {
  if (newPassword.length < 6) {
    return { ok: false, message: "새 비밀번호는 6자 이상이어야 합니다." };
  }

  const [creds, currentHash] = await Promise.all([
    getOrInitCredentials(),
    sha256(currentPassword),
  ]);

  if (creds.passwordHash !== currentHash) {
    return { ok: false, message: "현재 비밀번호가 올바르지 않습니다." };
  }

  const newHash = await sha256(newPassword);
  const ref = doc(db, CONFIG_DOC);
  await setDoc(ref, { passwordHash: newHash, updatedAt: serverTimestamp() }, { merge: true });
  invalidateCache(); // 캐시 무효화
  return { ok: true, message: "비밀번호가 변경되었습니다." };
}

/** 아이디 변경 */
export async function changeAdminUsername(
  currentPassword: string,
  newUsername: string
): Promise<{ ok: boolean; message: string }> {
  if (!newUsername.trim() || newUsername.length < 3) {
    return { ok: false, message: "아이디는 3자 이상이어야 합니다." };
  }

  const [creds, currentHash] = await Promise.all([
    getOrInitCredentials(),
    sha256(currentPassword),
  ]);

  if (creds.passwordHash !== currentHash) {
    return { ok: false, message: "현재 비밀번호가 올바르지 않습니다." };
  }

  const ref = doc(db, CONFIG_DOC);
  await setDoc(ref, { username: newUsername.trim(), updatedAt: serverTimestamp() }, { merge: true });
  invalidateCache(); // 캐시 무효화
  return { ok: true, message: "아이디가 변경되었습니다." };
}
