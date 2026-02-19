import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";

export interface CompanyApplication {
  id?: string;
  companyName: string;
  contactPerson: string;
  email: string;
  telegramId: string;
  websiteUrl: string;
  description: string;
  logoUrl?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  adminNote?: string; // 관리자 메모
  reviewedAt?: number; // 검토 일시
}

export const COLLECTION_NAME = "company_applications";

/** 신청서 제출 (공개 폼) */
export const submitCompanyApplication = async (
  data: Omit<CompanyApplication, "id" | "status" | "createdAt">
) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      status: "pending",
      createdAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error submitting company application:", error);
    throw error;
  }
};

/** 전체 신청서 목록 조회 (관리자용) */
export const getAllCompanyApplications = async (): Promise<CompanyApplication[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<CompanyApplication, "id">),
    }));
  } catch (error) {
    console.error("Error fetching company applications:", error);
    throw error;
  }
};

/** 단건 조회 */
export const getCompanyApplication = async (id: string): Promise<CompanyApplication | null> => {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...(docSnap.data() as Omit<CompanyApplication, "id">) };
  } catch (error) {
    console.error("Error fetching company application:", error);
    throw error;
  }
};

/** 상태 및 관리자 메모 업데이트 */
export const updateCompanyApplicationStatus = async (
  id: string,
  status: CompanyApplication["status"],
  adminNote?: string
) => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status,
      ...(adminNote !== undefined ? { adminNote } : {}),
      reviewedAt: Date.now(),
    });
  } catch (error) {
    console.error("Error updating company application:", error);
    throw error;
  }
};

/** 삭제 */
export const deleteCompanyApplication = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Error deleting company application:", error);
    throw error;
  }
};
