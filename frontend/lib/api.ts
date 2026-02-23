export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000";

export type ApiErrorCode =
  | "TG_ERR_OFFLINE"
  | "TG_ERR_ANALYZE_FAILED"
  | "TG_ERR_BAD_RESPONSE";

export async function getServiceStatus(): Promise<"online" | "offline"> {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
    return res.ok ? "online" : "offline";
  } catch {
    return "offline";
  }
}

export async function analyzeTender(tender: any) {
  // Backward compatible structured endpoint
  return postJson(`${API_URL}/analyze`, tender);
}

async function postJson(url: string, payload: any) {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new Error("TG_ERR_OFFLINE");
  }
  if (!res.ok) throw new Error("TG_ERR_ANALYZE_FAILED");
  try {
    return await res.json();
  } catch {
    throw new Error("TG_ERR_BAD_RESPONSE");
  }
}

export async function fetchDemo() {
  try {
    const res = await fetch(`${API_URL}/demo`, { cache: "no-store" });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    throw new Error("TG_ERR_OFFLINE");
  }
}

export async function extractDraftFromSource(source: any, meta?: any) {
  // source: {type: 'text'|'link'|'upload', value: string|File}
  if (!source?.type) throw new Error("TG_ERR_ANALYZE_FAILED");

  if (source.type === "text") {
    return postJson(`${API_URL}/extract/text`, {
      text: String(source.value || ""),
      tender_title: meta?.title ?? null,
      category: meta?.category ?? null,
      region: meta?.region ?? null,
      currency: meta?.currency ?? "KZT"
    });
  }

  if (source.type === "link") {
    return postJson(`${API_URL}/extract/url`, {
      url: String(source.value || ""),
      tender_title: meta?.title ?? null,
      category: meta?.category ?? null,
      region: meta?.region ?? null,
      currency: meta?.currency ?? "KZT"
    });
  }

  if (source.type === "upload") {
    const file: File | null = source.file ?? null;
    if (!file) throw new Error("TG_ERR_ANALYZE_FAILED");
    const form = new FormData();
    form.append("file", file);
    if (meta?.title) form.append("tender_title", meta.title);
    if (meta?.category) form.append("category", meta.category);
    if (meta?.region) form.append("region", meta.region);
    if (meta?.currency) form.append("currency", meta.currency);

    let res: Response;
    try {
      res = await fetch(`${API_URL}/extract/file`, { method: "POST", body: form });
    } catch {
      throw new Error("TG_ERR_OFFLINE");
    }
    if (!res.ok) throw new Error("TG_ERR_ANALYZE_FAILED");
    try {
      return await res.json();
    } catch {
      throw new Error("TG_ERR_BAD_RESPONSE");
    }
  }

  throw new Error("TG_ERR_ANALYZE_FAILED");
}

export async function analyzeFromDraft(draft: any) {
  // Use unified /analyze (structured), since draft.spec_text comes from canonical extraction.
  return analyzeTender(draft);
}