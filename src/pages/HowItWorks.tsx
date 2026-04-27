import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";
import { UserPlus, BadgeCheck, MessageCircle, Plane } from "lucide-react";
import heroImg from "@/assets/hero-how-it-works.jpg";

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
        <div className="absolute inset-0 bg-gradient-to-b from-burgundy/70 via-burgundy/55 to-background" />
        <div className="relative container py-section px-gutter">
          <div className="mx-auto max-w-2xl text-center text-primary-foreground animate-fade-in">
            <h1 className="font-display text-4xl font-semibold md:text-5xl text-balance drop-shadow-sm">{t.how.title}</h1>
            <p className="mt-4 text-primary-foreground/90 md:text-lg">{t.how.sub}</p>
          </div>
        </div>
      </section>

      <section className="container py-section px-gutter">
        <div className="mx-auto mt-block grid max-w-4xl gap-stack md:grid-cols-2">
          {steps.map((s, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-card shadow-card">
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
