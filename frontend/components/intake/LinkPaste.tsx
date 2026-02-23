"use client";

import { useI18n } from "../providers/AppProviders";

export function LinkPaste({
  url,
  onUrl
}: {
  url: string;
  onUrl: (v: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      <div className="text-sm tg-text">{t("intake.link.title")}</div>
      <input
        value={url}
        onChange={(e) => onUrl(e.target.value)}
        placeholder={t("intake.link.placeholder")}
        className="w-full bg-black/25 border border-white/12 rounded-xl px-3 py-2 text-sm outline-none"
      />
      <div className="text-xs tg-muted">{t("intake.link.note")}</div>
    </div>
  );
}