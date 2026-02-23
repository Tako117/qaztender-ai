"use client";

import { useRef } from "react";
import { useI18n } from "../providers/AppProviders";

export function UploadDropzone({
  file,
  onFile
}: {
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-3">
      <div
        className="rounded-2xl border border-white/12 bg-black/20 p-5 cursor-pointer hover:bg-white/5 transition"
        onClick={() => ref.current?.click()}
      >
        <div className="text-sm tg-text">{t("intake.upload.title")}</div>
        <div className="text-xs tg-muted mt-1">{t("intake.upload.note")}</div>

        {file ? (
          <div className="mt-3 text-xs tg-muted">
            {t("intake.upload.selected")} <span className="tg-text">{file.name}</span>
          </div>
        ) : null}
      </div>

      <input
        ref={ref}
        type="file"
        className="hidden"
        accept=".pdf,image/*,.doc,.docx,.txt"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />

      {file ? (
        <button onClick={() => onFile(null)} className="text-xs tg-muted hover:tg-text underline">
          {t("intake.upload.remove")}
        </button>
      ) : null}
    </div>
  );
}