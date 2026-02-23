"use client";

import { useI18n } from "../providers/AppProviders";

export function TextPaste({
  text,
  onText
}: {
  text: string;
  onText: (v: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      <div className="text-sm tg-text">{t("intake.text.title")}</div>
      <textarea
        value={text}
        onChange={(e) => onText(e.target.value)}
        className="w-full h-[180px] bg-black/25 border border-white/12 rounded-2xl p-3 text-sm outline-none"
        placeholder={t("intake.text.placeholder")}
      />
      <div className="text-xs tg-muted">{t("intake.text.note")}</div>
    </div>
  );
}