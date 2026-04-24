import { useI18n } from "@/i18n/I18nProvider";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
      <Globe className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
      <button onClick={() => setLang("en")}
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-smooth ${lang==="en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>EN</button>
      <button onClick={() => setLang("es")}
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-smooth ${lang==="es" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>ES</button>
    </div>
  );
}
