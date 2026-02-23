"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import { useI18n } from "../providers/AppProviders";

function Item({ href, label }: { href: string; label: string }) {
  const path = usePathname();
  const active = path === href;

  return (
    <Link
      href={href}
      className={cn(
        "block px-3 py-2 rounded-xl text-sm border transition tg-border",
        active ? "tg-panel tg-text" : "tg-panel tg-muted hover:tg-text hover:brightness-110"
      )}
    >
      {label}
    </Link>
  );
}

export function AppSidebar() {
  const { t } = useI18n();

  return (
    <aside className="hidden lg:block w-[260px] p-6">
      <div className="tg-glass rounded-2xl p-4 border tg-border h-[calc(100vh-3rem)] sticky top-6">
        <div className="text-xs tg-muted uppercase tracking-[0.2em] mb-3">{t("sidebar.navigation")}</div>

        <div className="space-y-2">
          <Item href="/dashboard/overview" label={t("nav.overview")} />
          <Item href="/dashboard/technical" label={t("nav.specs")} />
          <Item href="/dashboard/pricing" label={t("nav.pricing")} />
          <Item href="/dashboard/history" label={t("nav.history")} />
        </div>

        <div className="mt-6 text-xs tg-faint leading-relaxed">{t("sidebar.demoNote")}</div>
      </div>
    </aside>
  );
}