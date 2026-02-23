"use client";

import { ThemeProvider } from "next-themes";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

type Locale = "en" | "ru" | "kk";
type Dict = Record<string, any>;

function getByPath(obj: any, path: string) {
  return path.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}

function loadDict(locale: Locale): Dict {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const en = require("../../messages/en.json");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ru = require("../../messages/ru.json");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const kk = require("../../messages/kk.json");
  if (locale === "ru") return ru;
  if (locale === "kk") return kk;
  return en;
}

function interpolate(template: string, vars?: Record<string, any>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? `{${k}}` : String(v);
  });
}

type I18nCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  format: (key: string, vars?: Record<string, any>) => string;
};

const I18nContext = createContext<I18nCtx | null>(null);

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within AppProviders");
  return ctx;
}

const LOCALE_KEY = "tenderguard:locale";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [dict, setDict] = useState<Dict>(() => loadDict("en"));

  const warnedMissing = useRef(new Set<string>());

  useEffect(() => {
    const stored = (typeof window !== "undefined" ? localStorage.getItem(LOCALE_KEY) : null) as Locale | null;
    const initial: Locale = stored === "ru" || stored === "kk" || stored === "en" ? stored : "en";
    setLocaleState(initial);
    setDict(loadDict(initial));
    if (typeof document !== "undefined") document.documentElement.lang = initial;
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    setDict(loadDict(l));
    if (typeof window !== "undefined") localStorage.setItem(LOCALE_KEY, l);
    if (typeof document !== "undefined") document.documentElement.lang = l;
  };

  const isDev = process.env.NODE_ENV !== "production";

  const t = useMemo(() => {
    return (key: string) => {
      // Support BOTH nested keys (pricing.evidenceTitle) and flat JSON keys
      // ("pricing.evidenceTitle": "...") to avoid accidental runtime crashes.
      const v = getByPath(dict, key) ?? (dict as any)?.[key];
      if (typeof v === "string") return v;

      // Fail-fast in dev so missing keys never slip.
      if (isDev) {
        throw new Error(`[i18n] Missing key "${key}" for locale "${locale}"`);
      }

      // In prod: warn once then fall back to key
      if (!warnedMissing.current.has(key)) {
        warnedMissing.current.add(key);
        // eslint-disable-next-line no-console
        console.warn(`[i18n] Missing key "${key}" for locale "${locale}"`);
      }
      return key;
    };
  }, [dict, isDev, locale]);

  const format = useMemo(() => {
    return (key: string, vars?: Record<string, any>) => interpolate(t(key), vars);
  }, [t]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <I18nContext.Provider value={{ locale, setLocale, t, format }}>{children}</I18nContext.Provider>
    </ThemeProvider>
  );
}