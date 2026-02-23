"use client";

export function InfoTip({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl p-3 tg-soft">
      <div className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--tg-muted-2)" }}>
        {title}
      </div>
      <div className="mt-1 text-sm leading-relaxed" style={{ color: "var(--tg-muted)" }}>
        {text}
      </div>
    </div>
  );
}