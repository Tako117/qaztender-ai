"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "../../../components/shell/GlassCard";
import { RiskBadge } from "../../../components/risk/RiskBadge";
import { SpecHighlighter } from "../../../components/technical/SpecHighlighter";
import { FindingsList } from "../../../components/technical/FindingsList";
import { loadAnalysis } from "../../../lib/utils";
import { useI18n } from "../../../components/providers/AppProviders";

export default function TechnicalPage() {
  const { t } = useI18n();
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => setAnalysis(loadAnalysis()), []);

  const fragments = useMemo(() => {
    const raw = analysis?.suspicious_fragments ?? [];
    return raw.map((f: any, i: number) => ({ ...f, id: f.id || `f-${i}` }));
  }, [analysis]);

  const specText =
    analysis?.spec_text ||
    analysis?.input?.spec_text ||
    "";

  const onSelect = (id: string) => {
    setFocusId(id);
    const el = document.getElementById(`evidence-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--tg-muted-2)" }}>
            {t("nav.specs")}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--tg-fg)" }}>
            {t("specs.title")}
          </h1>
          <p className="mt-1 max-w-2xl" style={{ color: "var(--tg-muted)" }}>
            {t("specs.subtitle")}
          </p>
        </div>
        <div>{analysis ? <RiskBadge score={analysis.risk_score} /> : null}</div>
      </div>

      {!analysis ? (
        <GlassCard className="p-6">
          <div style={{ color: "var(--tg-muted)" }}>{t("errors.noAnalysis")}</div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          <GlassCard className="col-span-12 xl:col-span-8 p-6">
            <div className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--tg-muted-2)" }}>
              {t("specs.evidenceInText")}
            </div>
            <div className="mt-4">
              {specText ? (
                <SpecHighlighter text={specText} frags={fragments} focusId={focusId} />
              ) : (
                <div style={{ color: "var(--tg-muted)" }}>
                  {t("specs.missingSpec")}
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard className="col-span-12 xl:col-span-4 p-6">
            <div className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--tg-muted-2)" }}>
              {t("specs.findingsTitle")}
            </div>
            <div className="mt-4">
              <FindingsList fragments={fragments} onSelect={onSelect} />
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}