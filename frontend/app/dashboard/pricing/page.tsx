"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "../../../components/shell/GlassCard";
import { RiskBadge } from "../../../components/risk/RiskBadge";
import { MonteCarloHistogram } from "../../../components/charts/MonteCarloHistogram";
import { MarketCompareLine } from "../../../components/charts/MarketCompareLine";
import { loadAnalysis, formatMoney } from "../../../lib/utils";
import { fetchDemo } from "../../../lib/api";
import { Disclosure } from "../../../components/panels/Disclosure";
import { EvidencePanel } from "../../../components/panels/EvidencePanel";
import { DebugPanel } from "../../../components/panels/DebugPanel";
import { InfoTip } from "../../../components/panels/InfoTip";
import { useI18n } from "../../../components/providers/AppProviders";

export default function PricingPage() {
  const { t } = useI18n();
  const [analysis, setAnalysis] = useState<any | null>(null);
  useEffect(() => {
    const a = loadAnalysis();
    if (a) {
      setAnalysis(a);
      return;
    }
    fetchDemo().then((d) => setAnalysis(d.analysis)).catch(() => {});
  }, []);

  if (!analysis) {
    return (
      <GlassCard className="p-6">
        <div className="tg-muted">{t("common.noAnalysis")}</div>
      </GlassCard>
    );
  }

  const p = analysis.price_intelligence;
  const q = analysis.quantity_intelligence;
  const currency = analysis.input?.currency ?? "KZT";
  const bidPrice = analysis?.graphs?.tender_unit_price ?? (p.market_mean * (1 + p.deviation_pct / 100));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs tg-muted uppercase tracking-[0.2em]">{t("nav.pricing")}</div>
          <h1 className="text-2xl font-semibold tracking-tight tg-text">{t("pricing.title")}</h1>
          <p className="tg-muted mt-1 max-w-2xl">{t("pricing.subtitle")}</p>
        </div>
        <RiskBadge score={analysis.risk_score} />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <GlassCard className="col-span-12 xl:col-span-7 p-6">
          <InfoTip title={t("pricing.whatMeans")} text={t("pricing.marketMeaning")} />

          <div className="mt-4">
            <MarketCompareLine
              marketMean={p.market_mean}
              bidPrice={bidPrice}
              currency={currency}
              dataSource={p.data_source}
              confidence={p.confidence ?? null}
            />
          </div>

          <div className="mt-4 text-sm tg-muted space-y-1">
            <div>
              {t("pricing.typical")}: <span className="tg-text">{formatMoney(p.market_mean, currency)}</span>
            </div>

            <div title={t("pricing.rangeTooltip")}>
              {t("pricing.range")}:{" "}
              <span className="tg-text">{formatMoney(p.ci95[0], currency)}</span> –{" "}
              <span className="tg-text">{formatMoney(p.ci95[1], currency)}</span>
            </div>

            <div>
              {t("pricing.aboveMarket")}: <span className="tg-text">{p.deviation_pct.toFixed(1)}%</span>
              {p.overpriced_flag ? <span className="text-red-500"> ({t("common.flagged")})</span> : null}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 xl:col-span-5 p-6">
          <div className="text-xs tg-muted uppercase tracking-[0.2em]">{t("pricing.quantityTitle")}</div>

          <InfoTip title={t("pricing.whatMeans")} text={t("pricing.quantityMeaning")} />

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="tg-soft rounded-xl p-4">
              <div className="text-xs tg-muted">{t("pricing.quantityTypical")}</div>
              <div className="text-xl font-semibold mt-1 tg-text">{q.expected_median}</div>
              <div className="mt-2 text-[11px] tg-faint">{t("charts.dataSource")}: {q.data_source || "Heuristic baseline"}</div>
            </div>

            <div className="tg-soft rounded-xl p-4">
              <div className="text-xs tg-muted">{t("pricing.quantityRatio")}</div>
              <div className="text-xl font-semibold mt-1 tg-text">{Number(q.ratio).toFixed(2)}×</div>
              <div className="mt-2 text-[11px] tg-faint">
                {t("charts.confidence")}: {q.confidence != null ? `${Math.round(q.confidence * 100)}%` : t("charts.confidenceNA")}
              </div>
            </div>
          </div>

          <Disclosure title={t("common.advanced")} defaultOpen={false}>
            <div className="text-sm tg-muted">{t("pricing.quantityAdvanced")}</div>
          </Disclosure>
        </GlassCard>

        <GlassCard className="col-span-12 p-6">
          <div className="mt-4">
            <MonteCarloHistogram
              samples={p.monte_carlo_samples}
              currency={currency}
              dataSource={p.data_source}
              confidence={p.confidence ?? null}
            />
          </div>

          <Disclosure title={t("common.advanced")} defaultOpen={false}>
            <div className="text-xs tg-muted">{t("charts.spreadAdvanced")}</div>
          </Disclosure>
        </GlassCard>
      </div>
    

      <div className="grid grid-cols-12 gap-6">
        <EvidencePanel
          className="col-span-12 xl:col-span-8"
          title={t("pricing.evidenceTitle") ?? "Evidence"}
          evidence={p.evidence ?? analysis.web_intel?.evidence ?? []}
        />
        <div className="col-span-12 xl:col-span-4">
          <DebugPanel debug={analysis.debug ?? null} />
        </div>
      </div>
</div>
  );
}