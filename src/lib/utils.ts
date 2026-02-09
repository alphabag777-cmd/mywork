import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string, startLength: number = 6): string {
  if (!address) return "";
  const endLength = 4;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}
