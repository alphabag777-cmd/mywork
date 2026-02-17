import { db } from "./firebase";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";

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
}

export const COLLECTION_NAME = "company_applications";

export const submitCompanyApplication = async (data: Omit<CompanyApplication, "id" | "status" | "createdAt">) => {
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
