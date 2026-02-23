import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export function riskCategory(score: number) {
  const s = clamp(score);
  if (s >= 67) return "High";
  if (s >= 34) return "Medium";
  return "Low";
}

export function riskGlow(score: number) {
  const s = clamp(score);
  if (s >= 67) return "glow-high";
  if (s >= 34) return "glow-medium";
  return "glow-low";
}

export function formatMoney(v: number, currency = "KZT") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(v);
  } catch {
    return `${Math.round(v).toLocaleString()} ${currency}`;
  }
}

export function formatCompactMoney(v: number, currency = "KZT") {
  const n = Number(v) || 0;
  const abs = Math.abs(n);

  const suffix = abs >= 1_000_000 ? "M" : abs >= 1_000 ? "K" : "";
  const denom = abs >= 1_000_000 ? 1_000_000 : abs >= 1_000 ? 1_000 : 1;

  const val = denom === 1 ? Math.round(n) : Math.round((n / denom) * 10) / 10;
  return `${val}${suffix}`;
}

export const STORAGE_KEY = "tenderguard:last_analysis";
export function saveAnalysis(v: any) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
}
export function loadAnalysis<T = any>(): T | null {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem(STORAGE_KEY);
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}