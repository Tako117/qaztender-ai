"use client";

import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useI18n } from "../providers/AppProviders";

type BucketRow = {
  from: number;
  to: number;
  count: number;
  label: string;
};

function bucket(samples: number[], bins = 18, currency = "KZT"): BucketRow[] {
  const s = [...(samples ?? [])].filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!s.length) return [];

  const min = s[0];
  const max = s[s.length - 1];
  const w = (max - min) / bins || 1;

  const rows: BucketRow[] = [];
  for (let i = 0; i < bins; i++) {
    const from = min + i * w;
    const to = i === bins - 1 ? max : min + (i + 1) * w;
    rows.push({ from, to, count: 0, label: `${formatCompact(from, currency)}–${formatCompact(to, currency)}` });
  }

  for (const v of s) {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / w)));
    rows[idx].count += 1;
  }

  return rows;
}

function formatMoney(x: number, currency: string) {
  const v = Number.isFinite(x) ? x : 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "KZT",
      maximumFractionDigits: 0
    }).format(v);
  } catch {
    return `${Math.round(v)} ${currency || "KZT"}`;
  }
}

function formatCompact(x: number, currency: string) {
  const v = Number.isFinite(x) ? x : 0;
  const n = Math.round(v);
  if (n >= 1_000_000) return `${Math.round(n / 1_000_00) / 10}M`;
  if (n >= 1_000) return `${Math.round(n / 100) / 10}k`;
  return `${n}`;
}

function ChartFrame({
  title,
  subtitle,
  footerLeft,
  footerRight,
  children
}: {
  title?: string;
  subtitle?: string;
  footerLeft?: string;
  footerRight?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="tg-chart">
      {(title || subtitle) && (
        <div className="mb-3">
          {title ? <div className="text-xs tg-muted uppercase tracking-[0.2em]">{title}</div> : null}
          {subtitle ? <div className="text-sm tg-muted mt-1">{subtitle}</div> : null}
        </div>
      )}

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

export function MonteCarloHistogram({
  samples,
  currency = "KZT",
  dataSource,
  confidence
}: {
  samples: number[];
  currency?: string;
  dataSource?: string;
  confidence?: number | null;
}) {
  const { t } = useI18n();

  const data = useMemo(() => bucket(samples ?? [], 18, currency), [samples, currency]);
  const maxCount = useMemo(() => Math.max(1, ...data.map((d) => d.count)), [data]);

  if (!samples?.length || !data.length) {
    return <div className="text-sm tg-muted">{t("charts.noDistribution")}</div>;
  }

  const footerLeft = `${t("charts.dataSource")}: ${dataSource || t("common.demo")}`;
  const footerRight =
    confidence === null || confidence === undefined
      ? `${t("charts.confidence")}: ${t("charts.confidenceNA")}`
      : `${t("charts.confidence")}: ${Math.round(confidence * 100)}%`;

  return (
    <ChartFrame
      title={t("charts.spreadTitle")}
      subtitle={t("charts.spreadSubtitle")}
      footerLeft={footerLeft}
      footerRight={footerRight}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 22 }}>
          <CartesianGrid stroke="var(--tg-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--tg-muted)", fontSize: 11 }}
            interval={Math.max(0, Math.floor(data.length / 6))}
            angle={0}
            height={40}
          />
          <YAxis
            tick={{ fill: "var(--tg-muted)", fontSize: 11 }}
            allowDecimals={false}
            domain={[0, Math.ceil(maxCount * 1.15)]}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: "var(--tg-tooltip-bg)",
              border: "1px solid var(--tg-tooltip-border)",
              borderRadius: 12,
              color: "var(--tg-text)"
            }}
            formatter={(v: any, _name, ctx: any) => {
              const row = ctx?.payload as BucketRow | undefined;
              const range = row ? `${formatMoney(row.from, currency)} – ${formatMoney(row.to, currency)}` : "";
              return [`${v}`, `${range}`];
            }}
            labelFormatter={() => ""}
          />
          <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="rgba(72,130,255,0.70)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}