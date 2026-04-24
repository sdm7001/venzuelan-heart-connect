import { useI18n } from "@/i18n/I18nProvider";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  const a = t.a11y;

  const btn = (active: boolean) =>
    cn(
      "rounded-full px-2.5 py-0.5 text-xs font-medium transition-smooth",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div
      role="group"
      aria-label={a.languageGroup}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1"
    >
      <Globe className="ml-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-label={a.switchToEnglish}
        aria-pressed={lang === "en"}
        lang="en"
        className={btn(lang === "en")}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("es")}
        aria-label={a.switchToSpanish}
        aria-pressed={lang === "es"}
        lang="es"
        className={btn(lang === "es")}
      >
        ES
      </button>
    </div>
  );
}
