"use client";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import { useI18n } from "../providers/AppProviders";

function isDemoMode() {
  // Explicit switch (cannot confuse users)
  // .env.local: NEXT_PUBLIC_DEMO_MODE=1 or 0
  const v = (process.env.NEXT_PUBLIC_DEMO_MODE ?? "1").trim();
  return v !== "0" && v.toLowerCase() !== "false";
}

export function TopBar() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === "dark";
  const demo = useMemo(() => isDemoMode(), []);

  return (
    <div className="sticky top-0 z-30 px-6 py-4">
      <div className={cn("tg-glass rounded-2xl px-4 py-3 border tg-border")}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl tg-panel border tg-border flex items-center justify-center font-semibold tg-text">
                TG
              </div>

              <div className="min-w-0">
                <div className="text-sm font-semibold leading-tight tg-text">{t("app.name")}</div>
                <div className="text-xs tg-muted truncate">{t("app.tagline")}</div>
              </div>

              <span
                className={cn(
                  "ml-2 text-[11px] px-2 py-1 rounded-full border",
                  demo ? "tg-panel tg-border tg-text" : "bg-emerald-400/15 border-emerald-300/25 text-emerald-200"
                )}
                title={demo ? t("common.demo") : t("common.real")}
              >
                {demo ? t("common.demo") : t("common.real")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language */}
            <div className="flex items-center gap-1 tg-panel border tg-border rounded-xl p-1">
              {(["en", "ru", "kk"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs transition",
                    locale === l ? "bg-white text-black" : "tg-muted hover:tg-text"
                  )}
                  aria-label={`${t("common.language")}: ${l.toUpperCase()}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Theme */}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="px-3 py-2 rounded-xl tg-panel border tg-border text-xs tg-muted hover:tg-text transition"
              title={t("common.theme")}
            >
              {isDark ? t("common.dark") : t("common.light")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}