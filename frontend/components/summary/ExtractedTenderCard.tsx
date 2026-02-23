"use client";

import { useI18n } from "../providers/AppProviders";

export type TenderDraft = {
  tender_id: string;
  title: string;
  category: string;
  region: string;
  currency: string;
  spec_text: string;
  items: { item_id: string; name: string; quantity: number; unit: string }[];
  bids: { supplier_id: string; supplier_name: string; unit_price: number }[];
  participants_count: number;
  source?: { type: "upload" | "link" | "text"; value?: string };
};

export function ExtractedTenderCard({
  draft,
  onChange
}: {
  draft: TenderDraft;
  onChange: (d: TenderDraft) => void;
}) {
  const { t } = useI18n();
  const d = draft;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-3">
        <Field
          label={t("fields.title")}
          value={d.title}
          onValue={(v) => onChange({ ...d, title: v })}
          className="col-span-12 md:col-span-8"
        />
        <Field
          label={t("fields.region")}
          value={d.region}
          onValue={(v) => onChange({ ...d, region: v })}
          className="col-span-6 md:col-span-2"
        />
        <Field
          label={t("fields.currency")}
          value={d.currency}
          onValue={(v) => onChange({ ...d, currency: v })}
          className="col-span-6 md:col-span-2"
        />
      </div>

      <div className="grid grid-cols-12 gap-3">
        <Field
          label={t("fields.category")}
          value={d.category}
          onValue={(v) => onChange({ ...d, category: v })}
          className="col-span-12 md:col-span-6"
        />
        <Field
          label={t("fields.participants")}
          value={String(d.participants_count)}
          onValue={(v) => onChange({ ...d, participants_count: Math.max(1, Number(v) || 1) })}
          className="col-span-12 md:col-span-6"
        />
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: "var(--tg-muted-2)" }}>
          {t("fields.specText")}
        </div>
        <textarea
          value={d.spec_text}
          onChange={(e) => onChange({ ...d, spec_text: e.target.value })}
          className="w-full h-[160px] rounded-2xl p-3 text-sm outline-none"
          placeholder={t("fields.specPlaceholder")}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: `1px solid var(--tg-border)`,
            color: "var(--tg-fg)"
          }}
        />
      </div>

      <div className="grid grid-cols-12 gap-3">
        <Field
          label={t("fields.itemName")}
          value={d.items?.[0]?.name || ""}
          onValue={(v) =>
            onChange({
              ...d,
              items: [{ ...(d.items?.[0] ?? { item_id: "I1", quantity: 1, unit: "pcs" }), name: v }]
            })
          }
          className="col-span-12 md:col-span-6"
        />
        <Field
          label={t("fields.quantity")}
          value={String(d.items?.[0]?.quantity ?? 1)}
          onValue={(v) =>
            onChange({
              ...d,
              items: [
                {
                  ...(d.items?.[0] ?? { item_id: "I1", name: "Item", unit: "pcs" }),
                  quantity: Math.max(1, Number(v) || 1)
                }
              ]
            })
          }
          className="col-span-6 md:col-span-3"
        />
        <Field
          label={t("fields.unit")}
          value={d.items?.[0]?.unit || "pcs"}
          onValue={(v) =>
            onChange({
              ...d,
              items: [{ ...(d.items?.[0] ?? { item_id: "I1", name: "Item", quantity: 1 }), unit: v }]
            })
          }
          className="col-span-6 md:col-span-3"
        />
      </div>

      <div className="grid grid-cols-12 gap-3">
        <Field
          label={t("fields.bidPrice")}
          value={String(d.bids?.[0]?.unit_price ?? "")}
          onValue={(v) =>
            onChange({
              ...d,
              bids: [
                {
                  ...(d.bids?.[0] ?? { supplier_id: "S1", supplier_name: "Bidder" }),
                  unit_price: Math.max(0, Number(v) || 0)
                }
              ]
            })
          }
          className="col-span-12 md:col-span-4"
        />
        <Field
          label={t("fields.supplierName")}
          value={d.bids?.[0]?.supplier_name || ""}
          onValue={(v) =>
            onChange({
              ...d,
              bids: [{ ...(d.bids?.[0] ?? { supplier_id: "S1", unit_price: 0 }), supplier_name: v }]
            })
          }
          className="col-span-12 md:col-span-8"
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onValue,
  className
}: {
  label: string;
  value: string;
  onValue: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs mb-1" style={{ color: "var(--tg-muted)" }}>
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onValue(e.target.value)}
        className="w-full rounded-xl px-3 py-2 text-sm outline-none"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: `1px solid var(--tg-border)`,
          color: "var(--tg-fg)"
        }}
      />
    </div>
  );
}