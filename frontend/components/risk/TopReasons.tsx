"use client";

import { useI18n } from "../providers/AppProviders";

function palette(sev: "low" | "medium" | "high") {
  if (sev === "high") return { bg: "rgba(255,80,80,0.10)", bd: "rgba(255,80,80,0.22)", fg: "rgba(255,80,80,0.95)" };
  if (sev === "medium") return { bg: "rgba(255,170,40,0.10)", bd: "rgba(255,170,40,0.22)", fg: "rgba(255,170,40,0.95)" };
  return { bg: "rgba(40,200,140,0.10)", bd: "rgba(40,200,140,0.22)", fg: "rgba(40,200,140,0.95)" };
}

export function TopReasons({
  reasons
}: {
  reasons: { title: string; detail: string; severity: "low" | "medium" | "high" }[];
}) {
  const { t } = useI18n();

  if (!reasons?.length) {
    return <div className="text-sm" style={{ color: "var(--tg-muted)" }}>{t("overview.noReasons")}</div>;
  }

  return (
    <div className="space-y-3">
      {reasons.slice(0, 3).map((r, i) => {
        const p = palette(r.severity);
        const sevKey = r.severity === "high" ? "risk.high" : r.severity === "medium" ? "risk.medium" : "risk.low";

        return (
          <div key={i} className="rounded-2xl p-4 tg-soft">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium" style={{ color: "var(--tg-fg)" }}>
                {r.title}
              </div>
              <span className="px-2 py-1 rounded-full border text-xs" style={{ background: p.bg, borderColor: p.bd, color: p.fg }}>
                {t(sevKey)}
              </span>
            </div>
            <div className="mt-2 text-sm leading-relaxed" style={{ color: "var(--tg-muted)" }}>
              {r.detail}
            </div>
          </div>
        );
      })}
    </div>
  );
}