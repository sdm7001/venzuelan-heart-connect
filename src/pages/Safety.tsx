import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";
import { ShieldCheck, Check } from "lucide-react";
import heroImg from "@/assets/hero-safety.jpg";

export default function Safety() {
  const { t, lang } = useI18n();
  useSeo(
    {
      title: t.safety.title,
      description: t.safety.sub,
      path: lang === "es" ? "/es/safety" : "/safety",
      lang,
      alternates: [
        { hreflang: "en", href: "https://matchvenezuelan.com/safety" },
        { hreflang: "es", href: "https://matchvenezuelan.com/es/safety" },
        { hreflang: "x-default", href: "https://matchvenezuelan.com/safety" },
      ],
    },
    [lang],
  );
  const items = [t.safety.i1, t.safety.i2, t.safety.i3, t.safety.i4, t.safety.i5, t.safety.i6];
  const tips = [t.safety.t1, t.safety.t2, t.safety.t3, t.safety.t4, t.safety.t5];
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImg}
          alt=""
          aria-hidden="true"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-burgundy/75 via-burgundy/55 to-background" />
        <div className="relative container py-section px-gutter">
          <div className="mx-auto max-w-3xl text-center text-primary-foreground animate-fade-in">
            <span className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-background/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" /> {t.safety.eyebrow}
            </span>
            <h1 className="font-display text-4xl font-semibold md:text-5xl text-balance drop-shadow-sm">{t.safety.title}</h1>
            <p className="mt-4 text-primary-foreground/90 md:text-lg">{t.safety.sub}</p>
          </div>
        </div>
      </section>

      <section className="container py-section px-gutter">
        <div className="mx-auto grid max-w-5xl gap-stack md:grid-cols-2">
          <Card title={t.safety.itemsTitle} items={items} />
          <Card title={t.safety.tipsTitle} items={tips} />
        </div>
      </section>
    </PublicLayout>
  );
}

function Card({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-card shadow-card">
      <h2 className="font-display text-xl font-semibold text-burgundy">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 text-sm text-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
