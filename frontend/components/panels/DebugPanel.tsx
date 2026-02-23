"use client";

import { useState } from "react";
import { GlassCard } from "../shell/GlassCard";

export function DebugPanel({ debug }: { debug: any }) {
  const [open, setOpen] = useState(false);

  if (!debug) return null;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between">
        <div className="text-xs tg-muted uppercase tracking-[0.2em]">Debug</div>
        <button
          className="tg-soft px-3 py-1 rounded-lg text-xs tg-text hover:opacity-90 transition"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open ? (
        <pre className="mt-4 text-xs tg-faint overflow-auto whitespace-pre-wrap break-words">
{JSON.stringify(debug, null, 2)}
        </pre>
      ) : (
        <div className="mt-3 text-sm tg-muted">
          canonical_text_hash: <span className="tg-text font-mono">{debug.canonical_text_hash}</span>
        </div>
      )}
    </GlassCard>
  );
}
