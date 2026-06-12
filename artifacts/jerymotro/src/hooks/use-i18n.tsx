import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { translations, type Lang, type TranslationKey } from "@/lib/i18n";

export type { Lang };

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "jerymotro_lang";
const DEFAULT_LANG: Lang = "fr";

function getInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && stored in translations) return stored;
  } catch {}
  return DEFAULT_LANG;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      const dict = translations[lang] as Record<string, string>;
      let text = dict[key] ?? (translations["fr"] as Record<string, string>)[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(`{{${k}}}`, String(v));
        });
      }
      return text;
    },
    [lang]
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export const LANG_LABELS: Record<Lang, string> = {
  fr: "Français",
  mg: "Malagasy",
  en: "English",
};
