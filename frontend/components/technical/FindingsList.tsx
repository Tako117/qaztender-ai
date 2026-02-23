"use client";

import { cn } from "../../lib/utils";
import { useI18n } from "../providers/AppProviders";

type Frag = {
  id?: string;
  text?: string;
  reason?: string;
  severity?: string;
  fix?: string;
};

function sevClass(sev?: string) {
  const s = (sev || "").toLowerCase();
  if (s === "high") return "bg-red-500/15 border-red-300/20 text-red-600 dark:text-red-100";
  if (s === "medium") return "bg-amber-400/15 border-amber-200/20 text-amber-700 dark:text-amber-100";
  return "bg-emerald-400/15 border-emerald-200/20 text-emerald-700 dark:text-emerald-100";
}

export function FindingsList({
  fragments,
  onSelect
}: {
  fragments: Frag[];
  onSelect?: (id: string) => void;
}) {
  const { t, format } = useI18n();

  if (!fragments?.length) {
    return <div className="text-sm tg-muted">{t("specs.noneFound")}</div>;
  }

  return (
    <div className="space-y-3">
      {fragments.slice(0, 12).map((f, i) => {
        const id = f.id || `f-${i}`;
        const evidence = f.text ? format("specs.evidenceQuoted", { text: f.text }) : t("specs.evidenceSeeHighlight");
        const why = f.reason || t("specs.defaultWhy");
        const fix = f.fix || suggestFixFromText(t, f.text || "");

        return (
          <button
            key={id}
            onClick={() => onSelect?.(id)}
            className="w-full text-left tg-soft rounded-2xl p-4 hover:brightness-[1.02] transition"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs tg-muted uppercase tracking-[0.2em]">{t("specs.finding")}</div>
              <span className={cn("px-2 py-1 rounded-full border text-xs", sevClass(f.severity))}>
                {(f.severity || "low").toUpperCase()}
              </span>
            </div>

            <div className="mt-2 text-sm tg-text font-medium">{t("specs.whatWeSaw")}</div>
            <div className="mt-1 text-sm tg-muted leading-relaxed">{evidence}</div>

            <div className="mt-3 text-sm tg-text font-medium">{t("specs.whyMatters")}</div>
            <div className="mt-1 text-sm tg-muted leading-relaxed">{why}</div>

            <div className="mt-3 text-sm tg-text font-medium">{t("specs.howFix")}</div>
            <div className="mt-1 text-sm tg-muted leading-relaxed">{fix}</div>
          </button>
        );
      })}
    </div>
  );
}

function suggestFixFromText(t: (k: string) => string, text: string) {
  const s = (text || "").toLowerCase();

  if (/dell|hp|lenovo|apple|asus|acer|latitude|thinkpad|probook/.test(s)) {
    return t("specs.fix.brand");
  }
  if (/no alternative|no equivalent|without equivalent|or equivalent/.test(s)) {
    return t("specs.fix.allowEquivalent");
  }
  if (/delivery within|within \d+ days/.test(s)) {
    return t("specs.fix.delivery");
  }
  if (/exact|only|must be/.test(s)) {
    return t("specs.fix.absoluteTerms");
  }
  return t("specs.fix.general");
}