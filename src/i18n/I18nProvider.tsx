import { useEffect, useMemo, useState, type ReactNode } from "react";
import { translations, type Lang } from "./translations";
import { I18nContext } from "./useI18n";

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

  const value = useMemo(
    () => ({ lang, setLang, t: translations[lang] }),
    [lang],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
