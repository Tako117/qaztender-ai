"use client";

import { useMemo, useState } from "react";
import { UploadDropzone } from "./UploadDropzone";
import { LinkPaste } from "./LinkPaste";
import { TextPaste } from "./TextPaste";
import { TenderDraft, ExtractedTenderCard } from "../summary/ExtractedTenderCard";
import { cn } from "../../lib/utils";
import { useI18n } from "../providers/AppProviders";

type Mode = "upload" | "link" | "text";

function makeDraft(t: (k: string, p?: any) => string, partial?: Partial<TenderDraft>): TenderDraft {
  return {
    tender_id: partial?.tender_id || `TG-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
    title: partial?.title || t("intake.defaults.untitled"),
    category: partial?.category || "GENERAL",
    region: partial?.region || t("intake.defaults.unknown"),
    currency: partial?.currency || "KZT",
    spec_text: partial?.spec_text || "",
    items: partial?.items || [{ item_id: "I1", name: t("intake.defaults.item"), quantity: 1, unit: "pcs" }],
    bids: partial?.bids || [{ supplier_id: "S1", supplier_name: t("intake.defaults.bidder"), unit_price: 0 }],
    participants_count: partial?.participants_count || 1,
    source: partial?.source
  };
}

// MVP heuristic extraction from plain text
function extractFromText(t: (k: string, p?: any) => string, text: string): Partial<TenderDraft> {
  const raw = text ?? "";
  const s = raw.trim();

  const regionMatch = s.match(/\b(Shymkent|Almaty|Astana|Turkistan|Atyrau|Aktobe|Karaganda)\b/i);
  const region = regionMatch ? regionMatch[1] : undefined;

  const currency = /kzt|теңге|тенге/i.test(s) ? "KZT" : /usd|\$/i.test(s) ? "USD" : "KZT";

  const qtyMatch = s.match(/(\d+)\s*(pcs|шт|дана|units|pieces)/i);
  const quantity = qtyMatch ? Number(qtyMatch[1]) : undefined;

  const priceMatch = s.match(/(\d[\d\s]{3,})\s*(kzt|теңге|тенге)/i);
  const unitPrice = priceMatch ? Number(priceMatch[1].replace(/\s/g, "")) : undefined;

  // title guess: first line
  const title = s.split("\n").map((l) => l.trim()).filter(Boolean)[0]?.slice(0, 120);

  return {
    title: title || undefined,
    region,
    currency,
    spec_text: s.length > 0 ? s : "",
    items: [{ item_id: "I1", name: t("intake.defaults.item"), quantity: quantity || 1, unit: qtyMatch?.[2] || "pcs" }],
    bids: [{ supplier_id: "S1", supplier_name: t("intake.defaults.bidder"), unit_price: unitPrice || 0 }],
    participants_count: 1
  };
}

export function TenderWizard({
  onDraftReady
}: {
  onDraftReady: (draft: TenderDraft) => void;
}) {
  const { t } = useI18n();

  const [mode, setMode] = useState<Mode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  const extracted = useMemo(() => {
    if (mode === "text") return extractFromText(t, text);
    if (mode === "link") return { title: t("intake.extracted.fromLink"), spec_text: "", source: { type: "link" as const, value: url } };
    if (mode === "upload") return { title: t("intake.extracted.fromFile"), spec_text: "", source: { type: "upload" as const, value: file?.name, file } };
    return {};
  }, [mode, text, url, file, t]);

  const [draft, setDraft] = useState<TenderDraft>(() => makeDraft(t));

  const recompute = () => {
    const next = makeDraft(t, {
      ...draft,
      ...extracted,
      source:
        extracted.source ??
        {
          type: mode,
          value: mode === "text" ? "" : mode === "link" ? url : file?.name
        }
    });
    setDraft(next);
    onDraftReady(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Tab label={t("intake.tabs.upload")} active={mode === "upload"} onClick={() => setMode("upload")} />
        <Tab label={t("intake.tabs.link")} active={mode === "link"} onClick={() => setMode("link")} />
        <Tab label={t("intake.tabs.text")} active={mode === "text"} onClick={() => setMode("text")} />
      </div>

      <div className="tg-glass rounded-2xl p-4 border border-white/10">
        {mode === "upload" ? <UploadDropzone file={file} onFile={(f) => { setFile(f); }} /> : null}
        {mode === "link" ? <LinkPaste url={url} onUrl={setUrl} /> : null}
        {mode === "text" ? <TextPaste text={text} onText={setText} /> : null}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs tg-muted">{t("intake.nextHint")}</div>
          <button
            onClick={recompute}
            className="px-3 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90"
          >
            {t("common.continue")}
          </button>
        </div>
      </div>

      <div className="tg-glass rounded-2xl p-5 border border-white/10">
        <div className="text-xs tg-muted uppercase tracking-[0.2em]">{t("intake.extracted.title")}</div>
        <div className="text-sm tg-muted mt-1">{t("intake.extracted.subtitle")}</div>

        <div className="mt-4">
          <ExtractedTenderCard
            draft={draft}
            onChange={(d) => {
              setDraft(d);
              onDraftReady(d);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Tab({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-xl border text-sm transition",
        active
          ? "bg-white/10 border-white/15 text-white"
          : "bg-black/10 border-white/10 text-white/65 hover:text-white hover:bg-white/5"
      )}
    >
      {label}
    </button>
  );
}