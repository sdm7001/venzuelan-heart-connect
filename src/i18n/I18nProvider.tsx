import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { translations, type Lang, type Dict } from "./translations";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: Dict };
const I18nContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "mv.lang";

function detectInitial(): Lang {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved === "en" || saved === "es") return saved;
  const nav = navigator.language?.toLowerCase() ?? "en";
  return nav.startsWith("es") ? "es" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => { setLangState(detectInitial()); }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  };

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t: translations[lang] }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
