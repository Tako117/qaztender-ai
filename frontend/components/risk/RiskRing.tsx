"use client";

import { motion } from "framer-motion";
import { useI18n } from "../providers/AppProviders";

export function RiskRing({ score }: { score: number }) {
  const { t } = useI18n();

  const r = 64;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * c;

  const glow =
    pct >= 67
      ? "shadow-[0_0_24px_rgba(255,80,80,0.65)]"
      : pct >= 34
      ? "shadow-[0_0_24px_rgba(255,200,80,0.55)]"
      : "shadow-[0_0_24px_rgba(80,255,180,0.45)]";

  return (
    <div className={`relative w-[180px] h-[180px] ${glow} rounded-full`}>
      <svg width="180" height="180" viewBox="0 0 180 180" className="rotate-[-90deg]">
        <circle cx="90" cy="90" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="14" fill="none" />
        <motion.circle
          cx="90"
          cy="90"
          r={r}
          stroke="rgba(255,255,255,0.92)"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${dash} ${c - dash}` }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-[40px] font-semibold tracking-tight tg-text">{pct.toFixed(0)}</div>
          <div className="text-xs uppercase tracking-[0.2em] tg-muted">{t("risk.score")}</div>
        </div>
      </div>
    </div>
  );
}