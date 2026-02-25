/**
 * AuthContext.tsx
 * Firebase Auth (이메일/구글) 로그인 상태 전역 관리
 */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveUser, getUserByWallet } from "@/lib/users";
import { generateReferralCode } from "@/lib/referral";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  // 이메일 로그인/회원가입
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, displayName: string, referralCode?: string) => Promise<void>;
  // 구글 로그인
  signInGoogle: (referralCode?: string) => Promise<void>;
  // 로그아웃
  logout: () => Promise<void>;
  // 비밀번호 재설정
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Firestore users 컬렉션에 사용자 저장 (이메일/구글 공통)
  async function saveAuthUser(
    fbUser: FirebaseUser,
    provider: "email" | "google",
    referrerCode?: string
  ) {
    try {
      const uid = fbUser.uid;
      // uid를 기반으로 더미 지갑 주소 형태로 저장 (지갑 미연결 상태)
      const userId = `auth_${uid}`;
      const existingUser = await getUserByWallet(userId).catch(() => null);
      const referralCode = existingUser?.referralCode || generateReferralCode();

      await saveUser(userId, {
        id: userId,
        walletAddress: "",
        email: fbUser.email || "",
        displayName: fbUser.displayName || "",
        photoURL: fbUser.photoURL || "",
        authProvider: provider,
        firebaseUid: uid,
        referralCode,
        referrerCode: existingUser?.referrerCode || referrerCode || null,
        referrerWallet: existingUser?.referrerWallet || null,
        isRegistered: true,
      });
    } catch (e) {
      console.error("saveAuthUser error:", e);
    }
  }

  // 이메일 로그인
  async function signInEmail(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  // 이메일 회원가입
  async function signUpEmail(
    email: string,
    password: string,
    displayName: string,
    referrerCode?: string
  ) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    await saveAuthUser(result.user, "email", referrerCode);
  }

  // 구글 로그인
  async function signInGoogle(referrerCode?: string) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    await saveAuthUser(result.user, "google", referrerCode);
  }

  // 로그아웃
  async function logout() {
    await signOut(auth);
  }

  // 비밀번호 재설정
  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      loading,
      signInEmail,
      signUpEmail,
      signInGoogle,
      logout,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
