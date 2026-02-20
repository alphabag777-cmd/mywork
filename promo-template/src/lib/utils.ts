/**
 * utils.ts — 공통 유틸리티
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function applyBrandColors(colors: {
  primary50: string;
  primary100: string;
  primary500: string;
  primary600: string;
  primary700: string;
  primary900: string;
}) {
  const root = document.documentElement;
  root.style.setProperty("--color-primary-50", colors.primary50);
  root.style.setProperty("--color-primary-100", colors.primary100);
  root.style.setProperty("--color-primary-500", colors.primary500);
  root.style.setProperty("--color-primary-600", colors.primary600);
  root.style.setProperty("--color-primary-700", colors.primary700);
  root.style.setProperty("--color-primary-900", colors.primary900);
}
