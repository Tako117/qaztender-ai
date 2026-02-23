"use client";

import { GlassCard } from "../shell/GlassCard";

type Evidence = {
  url: string;
  domain: string;
  title: string;
  snippet?: string;
  extracted_price?: number;
  currency?: string;
  raw_text?: string;
};

export function EvidencePanel({
  evidence,
  title = "Evidence",
  className = ""
}: {
  evidence: Evidence[] | undefined | null;
  title?: string;
  className?: string;
}) {
  const rows = (evidence ?? []).filter(Boolean);

  return (
    <GlassCard className={`p-6 ${className}`}>
      <div className="text-xs tg-muted uppercase tracking-[0.2em]">{title}</div>
      <div className="mt-3 space-y-3">
        {!rows.length ? (
          <div className="tg-muted text-sm">No web sources were captured for this run.</div>
        ) : (
          rows.map((e, i) => (
            <div key={i} className="tg-soft rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="tg-text text-sm font-medium truncate">{e.title || e.domain}</div>
                  <div className="tg-faint text-xs mt-1 truncate">{e.url}</div>
                </div>
                <div className="text-right shrink-0">
                  {typeof e.extracted_price === "number" ? (
                    <div className="tg-text text-sm font-semibold">
                      {Math.round(e.extracted_price).toLocaleString()} {e.currency || ""}
                    </div>
                  ) : null}
                  <div className="tg-muted text-[11px] mt-1">{e.domain}</div>
                </div>
              </div>

              {e.snippet ? <div className="tg-muted text-xs mt-2 line-clamp-2">{e.snippet}</div> : null}
              {e.raw_text ? <div className="tg-faint text-[11px] mt-2">Matched: {e.raw_text}</div> : null}
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}
