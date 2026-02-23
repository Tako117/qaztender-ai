"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "../../../components/shell/GlassCard";
import { RiskRing } from "../../../components/risk/RiskRing";
import { RiskBadge } from "../../../components/risk/RiskBadge";
import { ContributionBars } from "../../../components/risk/ContributionBars";
import { MonteCarloHistogram } from "../../../components/charts/MonteCarloHistogram";
import { MarketCompareLine } from "../../../components/charts/MarketCompareLine";
import { saveAnalysis, loadAnalysis, formatMoney, riskGlow, clamp, riskCategory } from "../../../lib/utils";
import { analyzeTender, getServiceStatus, extractDraftFromSource, fetchDemo } from "../../../lib/api";
import { TenderWizard } from "../../../components/intake/TenderWizard";
import type { TenderDraft } from "../../../components/summary/ExtractedTenderCard";
import { ServiceStatusPill } from "../../../components/status/ServiceStatusPill";
import { Disclosure } from "../../../components/panels/Disclosure";
import { InfoTip } from "../../../components/panels/InfoTip";
import { TopReasons } from "../../../components/risk/TopReasons";
import { useI18n } from "../../../components/providers/AppProviders";

type Analysis = any;

function buildHumanReasons(
  t: (k: string) => string,
  analysis: any
): { title: string; detail: string; severity: "low" | "medium" | "high" }[] {
  if (!analysis) return [];
  const score = clamp(analysis.risk_score ?? 0);
  const sev: "low" | "medium" | "high" = score >= 67 ? "high" : score >= 34 ? "medium" : "low";

  const p = analysis.price_intelligence;
  const q = analysis.quantity_intelligence;
  const reasons: any[] = [];

  if (p?.deviation_pct != null) {
    const dev = Number(p.deviation_pct);
    if (dev > 30) {
      reasons.push({
        title: t("reasons.priceHigh.title"),
        detail: t("reasons.priceHigh.detail").replace("{pct}", dev.toFixed(0)),
        severity: dev > 60 ? "high" : "medium"
      });
    }
  }

  const frags = analysis.suspicious_fragments ?? [];
  if (frags.length) {
    reasons.push({
      title: t("reasons.specsRestrictive.title"),
      detail: t("reasons.specsRestrictive.detail"),
      severity: sev
    });
  }

  if (q?.ratio != null) {
    const r = Number(q.ratio);
    if (r >= 2) {
      reasons.push({
        title: t("reasons.quantityHigh.title"),
        detail: t("reasons.quantityHigh.detail").replace("{x}", r.toFixed(1)),
        severity: r >= 3 ? "high" : "medium"
      });
    }
  }

  const participants = analysis?.participants_count ?? analysis?.input?.participants_count;
  if (participants === 1) {
    reasons.push({
      title: t("reasons.lowCompetition.title"),
      detail: t("reasons.lowCompetition.detail"),
      severity: "medium"
    });
  }

  if (!reasons.length && (analysis.explanations?.length ?? 0)) {
    reasons.push({
      title: t("reasons.fallback.title"),
      detail: String(analysis.explanations[0]),
      severity: sev
    });
  }

  return reasons.slice(0, 3);
}

export default function OverviewPage() {
  const { t } = useI18n();

  const [service, setService] = useState<"online" | "offline">("offline");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [draft, setDraft] = useState<TenderDraft | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  // Prevent infinite extraction loops when the backend can't extract spec_text.
  // We attempt extraction at most once per unique source key.
  const [extractKey, setExtractKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => setService(await getServiceStatus()))();
    const a = loadAnalysis<Analysis>();
    if (a) {
      setAnalysis(a);
      return;
    }

    // Demo-first so graphs are never empty.
    fetchDemo()
      .then((d) => {
        setDraft(d.draft);
        setAnalysis(d.analysis);
        saveAnalysis(d.analysis);
      })
      .catch(() => {
        // ignore (offline)
      });
  }, []);

  // If the user selected file or link, ask backend to extract spec_text/items deterministically.
  useEffect(() => {
    const s: any = (draft as any)?.source;
    if (!draft || !s?.type) return;
    if (s.type === "text") return;
    if (isExtracting) return;
    if (draft.spec_text && draft.spec_text.trim().length > 40) return;

    const key = `${String(s.type)}:${String(s.value ?? "")}`;
    if (extractKey === key) return;
    setExtractKey(key);

    setIsExtracting(true);
    extractDraftFromSource(s, {
      title: draft.title,
      category: draft.category,
      region: draft.region,
      currency: draft.currency
    })
      .then((extracted) => {
        setDraft((prev) => {
          if (!prev) return extracted;
          return {
            ...prev,
            title: extracted.tender_title ?? prev.title,
            category: extracted.category ?? prev.category,
            region: extracted.region ?? prev.region,
            currency: extracted.currency ?? prev.currency,
            spec_text: extracted.spec_text ?? prev.spec_text,
            items: extracted.items ?? (prev as any).items,
            bids: extracted.bids ?? (prev as any).bids
          } as any;
        });
      })
      .finally(() => setIsExtracting(false));
  }, [draft, isExtracting, extractKey]);

  const score = analysis?.risk_score ?? 0;
  const glow = riskGlow(score);
  const reasons = useMemo(() => buildHumanReasons(t, analysis), [analysis, t]);

  async function runAnalyze(d?: TenderDraft | null) {
    setErr(null);
    const target = d ?? draft;
    if (!target) {
      setErr(t("overview.errors.noTender"));
      return;
    }
    setLoading(true);
    try {
      const data = await analyzeTender(target);
      const enriched = { ...data, input: target, participants_count: target.participants_count, spec_text: target.spec_text };
      setAnalysis(enriched);
      saveAnalysis(enriched);
      setService(await getServiceStatus());
    } catch (e: any) {
      setErr(e?.message ?? t("common.requestFailed"));
      setService("offline");
    } finally {
      setLoading(false);
    }
  }

  const currency = analysis?.input?.currency ?? "KZT";
  const priceSource = analysis?.price_intelligence?.data_source;
  const priceConf = analysis?.price_intelligence?.confidence ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-sm tg-muted tracking-wide uppercase">{t("app.name")}</div>
          <h1 className="text-2xl font-semibold tracking-tight tg-text">{t("nav.overview")}</h1>
          <p className="tg-muted mt-1 max-w-2xl">{t("overview.riskMeaning")}</p>
        </div>

        <GlassCard className={`p-4 ${glow}`}>
          <div className="flex items-center gap-3">
            <ServiceStatusPill status={service} />
            <button
              onClick={() => runAnalyze()}
              disabled={loading}
              className="tg-btn-primary px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
            >
              {loading ? t("common.analyzing") : t("common.analyze")}
            </button>
          </div>
          {err && <div className="mt-2 text-xs text-red-500 whitespace-pre-wrap">{err}</div>}
        </GlassCard>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <GlassCard className="col-span-12 xl:col-span-4 p-5">
          <div className="text-xs tg-muted uppercase tracking-[0.2em]">{t("overview.riskTitle")}</div>
          <div className="mt-2 flex items-center justify-between">
            <RiskBadge score={score} />
            <div className="text-xs tg-faint">
              {riskCategory(score)} {t("risk.short")}
            </div>
          </div>

          <div className="mt-5 flex justify-center">
            <RiskRing score={score} />
          </div>

          <div className="mt-5 space-y-2">
            <div className="text-xs tg-muted uppercase tracking-[0.2em]">{t("overview.topReasons")}</div>
            <TopReasons reasons={reasons} />
          </div>

          <div className="mt-5">
            <Disclosure title={t("common.advanced")} defaultOpen={false}>
              {analysis ? (
                <div className="space-y-4">
                  <InfoTip title={t("common.whatMeans")} text={t("overview.advancedHint")} />
                  <div className="text-xs tg-muted uppercase tracking-[0.2em]">{t("overview.driversTitle")}</div>
                  <ContributionBars factorScores={analysis.factor_scores} contributions={analysis.weighted_contributions} />
                </div>
              ) : (
                <div className="text-sm tg-muted">{t("overview.runToSeeAdvanced")}</div>
              )}
            </Disclosure>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 xl:col-span-8 p-5">
          <div className="text-xs tg-muted uppercase tracking-[0.2em]">{t("overview.addTender")}</div>
          <div className="text-sm tg-muted mt-1">{t("overview.addTenderHint")}</div>

          <div className="mt-4">
            <TenderWizard
              onDraftReady={(d) => {
                setDraft(d);
                // Auto-analyze for a smoother demo (user can still click Analyze).
                setTimeout(() => runAnalyze(d), 250);
              }}
            />
          </div>

          {analysis ? (
            <div className="mt-6 grid grid-cols-12 gap-4">
              <GlassCard className="col-span-12 lg:col-span-6 p-4">
                <MarketCompareLine
                  marketMean={analysis.price_intelligence.market_mean}
                  bidPrice={analysis?.graphs?.tender_unit_price ?? (analysis.price_intelligence.market_mean * (1 + analysis.price_intelligence.deviation_pct / 100))}
                  currency={currency}
                  dataSource={priceSource}
                  confidence={priceConf}
                />
                <div className="mt-3 text-sm tg-muted">
                  {t("charts.typicalMarket")}:{" "}
                  <span className="tg-text">{formatMoney(analysis.price_intelligence.market_mean, currency)}</span>
                  {" · "}
                  {t("charts.aboveTypical")}:{" "}
                  <span className="tg-text">{analysis.price_intelligence.deviation_pct.toFixed(1)}%</span>
                </div>
              </GlassCard>

              <GlassCard className="col-span-12 lg:col-span-6 p-4">
                <MonteCarloHistogram
                  samples={analysis.price_intelligence.monte_carlo_samples}
                  currency={currency}
                  dataSource={priceSource}
                  confidence={priceConf}
                />
              </GlassCard>

              <GlassCard className="col-span-12 p-4">
                <Disclosure title={t("overview.dataUsedTitle")} defaultOpen={false}>
                  <div className="space-y-3">
                    <InfoTip title={t("overview.data.marketTitle")} text={t("overview.data.marketText")} />
                    <InfoTip title={t("overview.data.historyTitle")} text={t("overview.data.historyText")} />
                    <InfoTip title={t("overview.data.scoreTitle")} text={t("overview.data.scoreText")} />
                  </div>
                </Disclosure>
              </GlassCard>
            </div>
          ) : null}
        </GlassCard>
      </div>
    </div>
  );
}