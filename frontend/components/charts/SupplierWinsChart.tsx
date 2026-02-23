"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useI18n } from "../providers/AppProviders";

function ChartFrame({
  title,
  footerLeft,
  footerRight,
  children
}: {
  title?: string;
  footerLeft?: string;
  footerRight?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="tg-chart">
      {title ? <div className="text-xs tg-muted uppercase tracking-[0.2em] mb-3">{title}</div> : null}
      <div className="tg-chart-box">{children}</div>
      {(footerLeft || footerRight) && (
        <div className="mt-3 flex items-center justify-between gap-3 text-[11px] tg-faint">
          <div className="truncate">{footerLeft}</div>
          <div className="shrink-0">{footerRight}</div>
        </div>
      )}
    </div>
  );
}

export function SupplierWinsChart({
  data,
  dataSource,
  confidence
}: {
  data: { supplier: string; wins: number }[];
  dataSource?: string;
  confidence?: number | null;
}) {
  const { t } = useI18n();

  const footerLeft = `${t("charts.dataSource")}: ${dataSource || t("common.demo")}`;
  const footerRight =
    confidence === null || confidence === undefined
      ? `${t("charts.confidence")}: ${t("charts.confidenceNA")}`
      : `${t("charts.confidence")}: ${Math.round(confidence * 100)}%`;

  return (
    <ChartFrame title={t("history.repeatedTitle")} footerLeft={footerLeft} footerRight={footerRight}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 10 }}>
          <CartesianGrid stroke="var(--tg-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="supplier" tick={{ fill: "var(--tg-muted)", fontSize: 12 }} />
          <YAxis tick={{ fill: "var(--tg-muted)", fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "var(--tg-tooltip-bg)",
              border: "1px solid var(--tg-tooltip-border)",
              borderRadius: 12,
              color: "var(--tg-text)"
            }}
            formatter={(v: any) => [v, t("charts.wins")]}
          />
          <Bar dataKey="wins" radius={[10, 10, 0, 0]} fill="rgba(72,130,255,0.70)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}