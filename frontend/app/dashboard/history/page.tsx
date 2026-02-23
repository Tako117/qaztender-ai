"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "../../../components/shell/GlassCard";
import { RiskBadge } from "../../../components/risk/RiskBadge";
import { SupplierWinsChart } from "../../../components/charts/SupplierWinsChart";
import { loadAnalysis } from "../../../lib/utils";
import { fetchDemo } from "../../../lib/api";
import { Disclosure } from "../../../components/panels/Disclosure";
import { InfoTip } from "../../../components/panels/InfoTip";
import { useI18n } from "../../../components/providers/AppProviders";

export default function HistoryPage() {
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

  // ✅ Hooks must run on every render (even when analysis is null)
  const participants = useMemo(() => {
    return analysis?.participants_count ?? analysis?.input?.participants_count ?? null;
  }, [analysis]);

  const chartData = useMemo(() => {
    const top = analysis?.history_intelligence?.top_suppliers ?? [];
    if (Array.isArray(top) && top.length) return top;

    // fallback: old demo
    return [
      { supplier: "TechSupply LLP", wins: 4 },
      { supplier: "DigitalPartner", wins: 1 },
      { supplier: "CityIT", wins: 1 }
    ];
  }, [analysis]);

  const ds = useMemo(() => analysis?.history_intelligence?.data_source, [analysis]);
  const conf = useMemo(() => analysis?.history_intelligence?.confidence ?? null, [analysis]);

  // ✅ Render guard AFTER hooks
  if (!analysis) {
    return (
      <GlassCard className="p-6">
        <div className="tg-muted">{t("errors.noAnalysis")}</div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--tg-muted-2)" }}>
            {t("nav.history")}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--tg-text)" }}>
            {t("history.title")}
          </h1>
          <p className="mt-1 max-w-2xl" style={{ color: "var(--tg-muted)" }}>
            {t("history.subtitle")}
          </p>
        </div>
        <RiskBadge score={analysis.risk_score} />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <GlassCard className="col-span-12 xl:col-span-7 p-6">
          <InfoTip title={t("common.whatMeans")} text={t("history.tipRepeated")} />

          <div className="mt-4">
            <SupplierWinsChart data={chartData} dataSource={ds} confidence={conf} />
          </div>

          <div className="mt-3 text-xs tg-muted">{t("history.demoNote")}</div>
        </GlassCard>

        <GlassCard className="col-span-12 xl:col-span-5 p-6">
          <div className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--tg-muted-2)" }}>
            {t("history.snapshotTitle")}
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl p-4 tg-soft">
              <div className="text-xs tg-muted">{t("history.participants")}</div>
              <div className="text-xl font-semibold mt-1 tg-text">{participants ?? "—"}</div>
              <div className="text-sm mt-2 tg-muted">{t("history.participantsHint")}</div>
            </div>

            <Disclosure title={t("history.dataUsed")} defaultOpen={false}>
              <div className="space-y-3">
                <InfoTip title={t("history.dataTitle")} text={t("history.dataText")} />
                <InfoTip title={t("history.improveTitle")} text={t("history.improveText")} />
              </div>
            </Disclosure>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}