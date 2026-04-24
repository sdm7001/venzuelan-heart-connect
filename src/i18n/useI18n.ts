import { createContext, useContext } from "react";
import type { Lang, Dict } from "./translations";

export type I18nCtx = { lang: Lang; setLang: (l: Lang) => void; t: Dict };

export const I18nContext = createContext<I18nCtx | null>(null);

export function useI18n(): I18nCtx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
