"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { formatCompactMoney, formatMoney } from "../../lib/utils";
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

export function MarketCompareLine({
  marketMean,
  bidPrice,
  currency,
  dataSource,
  confidence
}: {
  marketMean: number;
  bidPrice: number;
  currency: string;
  dataSource?: string;
  confidence?: number | null;
}) {
  const { t } = useI18n();

  const data = [
    { name: t("charts.marketMean"), value: marketMean },
    { name: t("charts.bidPrice"), value: bidPrice }
  ];

  const footerLeft = `${t("charts.dataSource")}: ${dataSource || t("common.demo")}`;
  const footerRight =
    confidence === null || confidence === undefined
      ? `${t("charts.confidence")}: ${t("charts.confidenceNA")}`
      : `${t("charts.confidence")}: ${Math.round(confidence * 100)}%`;

  return (
    <ChartFrame title={t("charts.marketVsBidTitle")} footerLeft={footerLeft} footerRight={footerRight}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 6 }}>
          <CartesianGrid stroke="var(--tg-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: "var(--tg-muted)" }} />
          <YAxis
            tick={{ fill: "var(--tg-muted)" }}
            tickFormatter={(v) => formatCompactMoney(Number(v), currency)}
            width={60}
          />
          <Tooltip
            contentStyle={{
              background: "var(--tg-tooltip-bg)",
              border: "1px solid var(--tg-tooltip-border)",
              borderRadius: 12,
              color: "var(--tg-text)"
            }}
            formatter={(v) => formatMoney(Number(v), currency)}
          />
          <Line type="monotone" dataKey="value" strokeWidth={3} dot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}