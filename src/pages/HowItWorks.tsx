import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";
import { UserPlus, BadgeCheck, MessageCircle, Plane } from "lucide-react";

export default function HowItWorks() {
  const { t, lang } = useI18n();
  useSeo({ title: t.how.title, description: t.how.sub, path: "/how-it-works", lang }, [lang]);
  const steps = [
    { icon: <UserPlus className="h-5 w-5" />, title: t.how.s1Title, body: t.how.s1Body },
    { icon: <BadgeCheck className="h-5 w-5" />, title: t.how.s2Title, body: t.how.s2Body },
    { icon: <MessageCircle className="h-5 w-5" />, title: t.how.s3Title, body: t.how.s3Body },
    { icon: <Plane className="h-5 w-5" />, title: t.how.s4Title, body: t.how.s4Body },
  ];
  return (
    <PublicLayout>
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl font-semibold text-burgundy md:text-5xl text-balance">{t.how.title}</h1>
          <p className="mt-4 text-muted-foreground">{t.how.sub}</p>
        </div>
        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          {steps.map((s, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-7 shadow-card">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-burgundy">{s.icon}</div>
              <h3 className="font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
