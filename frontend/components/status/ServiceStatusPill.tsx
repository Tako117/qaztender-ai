"use client";

import { cn } from "../../lib/utils";
import { useI18n } from "../providers/AppProviders";

export function ServiceStatusPill({ status }: { status: "online" | "offline" }) {
  const { t } = useI18n();
  const isOn = status === "online";

  const bg = isOn ? "rgba(40,200,140,0.10)" : "rgba(255,80,80,0.10)";
  const border = isOn ? "rgba(40,200,140,0.22)" : "rgba(255,80,80,0.22)";
  const dot = isOn ? "rgba(40,200,140,0.95)" : "rgba(255,80,80,0.95)";

  return (
    <div
      className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs")}
      style={{ background: bg, borderColor: border, color: "var(--tg-fg)" }}
      title={isOn ? t("common.online") : t("common.offline")}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
      <span>{isOn ? t("common.online") : t("common.offline")}</span>
    </div>
  );
}