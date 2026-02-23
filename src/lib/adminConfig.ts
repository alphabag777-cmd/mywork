/**
 * adminConfig.ts
 * Firestore 기반 어드민 계정 관리
 * - 컬렉션: admin_config / 문서: credentials
 * - 최초 접속 시 기본값(admin / admin123) 자동 초기화
 * - 패스워드는 SHA-256 해시로 저장
 */

import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const CONFIG_DOC = "admin_config/credentials";

/** SHA-256 해시 (Web Crypto API) */
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Firestore에서 자격증명 가져오기 (없으면 기본값으로 초기화) */
async function getOrInitCredentials(): Promise<{
  username: string;
  passwordHash: string;
}> {
  const ref = doc(db, CONFIG_DOC);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as { username: string; passwordHash: string };
  }

  // 최초 초기화 — admin / admin123
  const defaultHash = await sha256("admin123");
  const defaults = {
    username: "admin",
    passwordHash: defaultHash,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, defaults);
  return { username: "admin", passwordHash: defaultHash };
}

/** 로그인 검증 */
export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  try {
    const creds = await getOrInitCredentials();
    const inputHash = await sha256(password);
    return creds.username === username && creds.passwordHash === inputHash;
  } catch (e) {
    console.error("verifyAdminCredentials error:", e);
    // Firestore 오류 시 하드코딩 fallback (보안 최소 유지)
    return username === "admin" && password === "admin123";
  }
}

/** 패스워드 변경
 *  - currentPassword: 현재 비밀번호 (검증용)
 *  - newPassword: 새 비밀번호
 */
export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; message: string }> {
  if (newPassword.length < 6) {
    return { ok: false, message: "새 비밀번호는 6자 이상이어야 합니다." };
  }

  // 현재 비밀번호 검증
  const creds = await getOrInitCredentials();
  const currentHash = await sha256(currentPassword);
  if (creds.passwordHash !== currentHash) {
    return { ok: false, message: "현재 비밀번호가 올바르지 않습니다." };
  }

  // 새 비밀번호 저장
  const newHash = await sha256(newPassword);
  const ref = doc(db, CONFIG_DOC);
  await setDoc(
    ref,
    { passwordHash: newHash, updatedAt: serverTimestamp() },
    { merge: true }
  );
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

  const creds = await getOrInitCredentials();
  const currentHash = await sha256(currentPassword);
  if (creds.passwordHash !== currentHash) {
    return { ok: false, message: "현재 비밀번호가 올바르지 않습니다." };
  }

  const ref = doc(db, CONFIG_DOC);
  await setDoc(
    ref,
    { username: newUsername.trim(), updatedAt: serverTimestamp() },
    { merge: true }
  );
  return { ok: true, message: "아이디가 변경되었습니다." };
}
