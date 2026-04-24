import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";
import { ShieldCheck, Check } from "lucide-react";

export default function Safety() {
  const { t, lang } = useI18n();
  useSeo({ title: t.safety.title, description: t.safety.sub, path: "/safety", lang }, [lang]);
  const items = [t.safety.i1, t.safety.i2, t.safety.i3, t.safety.i4, t.safety.i5, t.safety.i6];
  const tips = [t.safety.t1, t.safety.t2, t.safety.t3, t.safety.t4, t.safety.t5];
  return (
    <PublicLayout>
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-3 py-1 text-xs font-medium text-burgundy">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {t.safety.eyebrow}
          </span>
          <h1 className="font-display text-4xl font-semibold text-burgundy md:text-5xl text-balance">{t.safety.title}</h1>
          <p className="mt-4 text-muted-foreground">{t.safety.sub}</p>
        </div>
        <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2">
          <Card title={t.safety.itemsTitle} items={items} />
          <Card title={t.safety.tipsTitle} items={tips} />
        </div>
      </section>
    </PublicLayout>
  );
}

function Card({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-7 shadow-card">
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
