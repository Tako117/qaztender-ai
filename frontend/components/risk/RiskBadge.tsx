import { cn, riskCategory } from "../../lib/utils";
import { useI18n } from "../providers/AppProviders";

type RiskLevel = "low" | "medium" | "high";

function toLevel(cat: string): RiskLevel {
  const c = (cat || "").toLowerCase();
  if (c.includes("high")) return "high";
  if (c.includes("medium")) return "medium";
  return "low";
}

export function RiskBadge({ score }: { score: number }) {
  const { t } = useI18n();

  const catRaw = riskCategory(score); // "High" | "Medium" | "Low"
  const level = toLevel(catRaw);

  const cls =
    level === "high"
      ? "bg-red-500/15 border-red-300/20 text-red-200"
      : level === "medium"
      ? "bg-amber-400/15 border-amber-200/20 text-amber-100"
      : "bg-emerald-400/15 border-emerald-200/20 text-emerald-100";

  const label =
    level === "high" ? t("risk.high") : level === "medium" ? t("risk.medium") : t("risk.low");

  return (
    <span className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm", cls)}>
      <span className="tg-muted">{t("risk.label")}</span>
      <span className="font-semibold">{label}</span>
      <span className="tg-muted">{Math.round(score)}</span>
    </span>
  );
}