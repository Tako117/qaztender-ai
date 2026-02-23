"use client";

import { clamp } from "../../lib/utils";
import { useI18n } from "../providers/AppProviders";

type FactorScores = {
  technical_narrowness: number;
  price_deviation: number;
  quantity_anomaly: number;
  participant_count_risk: number;
  winner_history_pattern: number;
};

export function ContributionBars({
  factorScores,
  contributions
}: {
  factorScores: FactorScores;
  contributions: FactorScores;
}) {
  const { t } = useI18n();

  const rows: { key: keyof FactorScores; labelKey: string; weightKey: string }[] = [
    { key: "technical_narrowness", labelKey: "factors.technical", weightKey: "factors.weight25" },
    { key: "price_deviation", labelKey: "factors.price", weightKey: "factors.weight30" },
    { key: "quantity_anomaly", labelKey: "factors.quantity", weightKey: "factors.weight20" },
    { key: "participant_count_risk", labelKey: "factors.competition", weightKey: "factors.weight15" },
    { key: "winner_history_pattern", labelKey: "factors.history", weightKey: "factors.weight10" }
  ];

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const strength = clamp(factorScores[r.key]);
        const impact = Number(contributions[r.key] ?? 0);

        return (
          <div key={r.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs" style={{ color: "var(--tg-muted)" }}>
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--tg-fg)" }}>{t(r.labelKey)}</span>
                <span
                  className="px-2 py-0.5 rounded-full border"
                  style={{
                    borderColor: "var(--tg-border)",
                    background: "rgba(255,255,255,0.04)",
                    color: "var(--tg-muted)"
                  }}
                >
                  {t(r.weightKey)}
                </span>
              </div>

              <div style={{ color: "var(--tg-muted)" }}>
                {t("factors.strength")}: <span style={{ color: "var(--tg-fg)" }}>{strength.toFixed(0)}</span>
                {" · "}
                {t("factors.impact")}: <span style={{ color: "var(--tg-fg)" }}>{impact > 0 ? "+" : ""}{impact.toFixed(1)}</span>
              </div>
            </div>

            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full" style={{ width: `${strength}%`, background: "rgba(72,130,255,0.75)" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}