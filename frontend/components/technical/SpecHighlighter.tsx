"use client";

import { useMemo } from "react";
import { cn } from "../../lib/utils";
import { useI18n } from "../providers/AppProviders";

type Frag = {
  text?: string;
  start?: number;
  end?: number;
  reason?: string;
  severity?: string;
  fix?: string;
  id?: string;
};

function sevColors(sev?: string) {
  const s = (sev || "").toLowerCase();
  if (s === "high") return { bg: "rgba(255,80,80,0.16)", bd: "rgba(255,80,80,0.28)" };
  if (s === "medium") return { bg: "rgba(255,170,40,0.16)", bd: "rgba(255,170,40,0.28)" };
  return { bg: "rgba(40,200,140,0.12)", bd: "rgba(40,200,140,0.24)" };
}

function normalize(s: string) {
  return (s || "").replace(/\s+/g, " ").trim();
}

export function SpecHighlighter({
  text,
  frags,
  focusId
}: {
  text: string;
  frags: Frag[];
  focusId?: string | null;
}) {
  const { t } = useI18n();
  const base = text ?? "";

  const ranges = useMemo(() => {
    const items: { start: number; end: number; frag: Frag }[] = [];
    if (!base) return items;

    for (const f of frags ?? []) {
      if (typeof f.start === "number" && typeof f.end === "number" && f.end > f.start) {
        items.push({ start: f.start, end: f.end, frag: f });
      }
    }

    if (!items.length) {
      const lower = base.toLowerCase();
      const used: boolean[] = new Array(base.length).fill(false);

      const list = (frags ?? [])
        .filter((f) => f?.text && normalize(f.text!).length >= 2)
        .sort((a, b) => normalize(b.text!).length - normalize(a.text!).length);

      for (const frag of list) {
        const needle = normalize(frag.text!).toLowerCase();
        let idx = 0;
        while (idx < lower.length) {
          const found = lower.indexOf(needle, idx);
          if (found === -1) break;

          const start = found;
          const end = found + needle.length;

          let ok = true;
          for (let i = start; i < end; i++) {
            if (used[i]) { ok = false; break; }
          }

          if (ok) {
            for (let i = start; i < end; i++) used[i] = true;
            items.push({ start, end, frag });
          }

          idx = found + needle.length;
        }
      }
    }

    items.sort((a, b) => a.start - b.start);
    return items;
  }, [base, frags]);

  if (!base) return <div className="text-sm" style={{ color: "var(--tg-muted)" }}>{t("specs.noSpecText")}</div>;

  if (!ranges.length) {
    return (
      <div className="text-sm leading-relaxed whitespace-pre-wrap rounded-2xl p-4 tg-soft" style={{ color: "var(--tg-fg)" }}>
        {base}
      </div>
    );
  }

  const out: React.ReactNode[] = [];
  let cursor = 0;

  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    const id = r.frag.id || `f-${i}-${r.start}`;

    if (r.start > cursor) {
      out.push(
        <span key={`t-${i}-${cursor}`} className="whitespace-pre-wrap" style={{ color: "var(--tg-fg)" }}>
          {base.slice(cursor, r.start)}
        </span>
      );
    }

    const snippet = base.slice(r.start, r.end);
    const focused = focusId === id;
    const c = sevColors(r.frag.severity);

    out.push(
      <span
        key={`h-${i}-${r.start}`}
        id={`evidence-${id}`}
        className={cn(
          "inline-flex items-center px-2 py-0.5 mx-0.5 rounded-lg border transition hover:brightness-110",
          focused ? "ring-2 shadow-[0_0_30px_rgba(255,255,255,0.12)]" : ""
        )}
        style={{
          background: c.bg,
          borderColor: c.bd,
          color: "var(--tg-fg)",
          ...(focused ? { outlineColor: "var(--tg-border-strong)" } : {})
        }}
        title={r.frag.reason || t("specs.evidenceTitle")}
      >
        {snippet}
      </span>
    );

    cursor = r.end;
  }

  if (cursor < base.length) {
    out.push(
      <span key="t-end" className="whitespace-pre-wrap" style={{ color: "var(--tg-fg)" }}>
        {base.slice(cursor)}
      </span>
    );
  }

  return (
    <div className="text-sm leading-relaxed">
      <div className="text-xs mb-3" style={{ color: "var(--tg-muted-2)" }}>
        {t("specs.clickToJump")}
      </div>
      <div className="rounded-2xl p-4 tg-soft">
        {out}
      </div>
    </div>
  );
}