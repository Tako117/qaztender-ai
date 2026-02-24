"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useI18n } from "../providers/AppProviders";

export default function AppHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="w-full border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center gap-3 min-w-[220px]">
          <Image
            src="/logo_qaztender.jpeg"
            alt="QazTender AI Logo"
            width={40}
            height={40}
            className="rounded-md object-cover"
            priority
          />
          <div className="leading-tight">
            <div className="text-lg font-semibold tracking-tight">QazTender AI</div>
            <div className="text-xs tg-muted">{t("app.tagline")}</div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/dashboard/overview"
            className={`hover:opacity-70 ${pathname?.includes("overview") ? "font-semibold" : ""}`}
          >
            {t("nav.overview")}
          </Link>
          <Link
            href="/dashboard/pricing"
            className={`hover:opacity-70 ${pathname?.includes("pricing") ? "font-semibold" : ""}`}
          >
            {t("nav.pricing")}
          </Link>
          <Link
            href="/dashboard/history"
            className={`hover:opacity-70 ${pathname?.includes("history") ? "font-semibold" : ""}`}
          >
            {t("nav.history")}
          </Link>
          <Link
            href="/dashboard/technical"
            className={`hover:opacity-70 ${pathname?.includes("technical") ? "font-semibold" : ""}`}
          >
            {t("nav.specs")}
          </Link>
        </nav>

        {/* Controls (Theme + Language) */}
        <div className="flex items-center gap-3 justify-end min-w-[220px]">
          <div className="flex items-center gap-2">
            <span className="text-xs tg-muted">{t("common.theme")}</span>
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="tg-btn px-3 py-1.5 rounded-lg text-xs"
            >
              {theme === "dark" ? t("common.dark") : t("common.light")}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs tg-muted">{t("common.language")}</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as any)}
              className="tg-input px-2 py-1.5 rounded-lg text-xs bg-transparent border border-neutral-200 dark:border-neutral-800"
            >
              <option value="en">EN</option>
              <option value="ru">RU</option>
              <option value="kk">KK</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}