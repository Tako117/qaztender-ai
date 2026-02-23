"use client";

import { useId, useState } from "react";
import { cn } from "../../lib/utils";

export function Disclosure({
  title,
  children,
  defaultOpen = false
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="rounded-2xl overflow-hidden tg-soft">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm transition"
        style={{ color: "var(--tg-fg)" }}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span>{title}</span>
        <span
          className={cn("transition", open ? "rotate-180" : "")}
          style={{ color: "var(--tg-muted)" }}
          aria-hidden="true"
        >
          ⌄
        </span>
      </button>

      {open ? <div id={panelId} className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}