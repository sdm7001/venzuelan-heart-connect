import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";

export function LegalPage({ titleKey }: { titleKey: "tos" | "privacy" | "aup" | "antiSolicit" }) {
  const { t, lang } = useI18n();
  const titleMap = { tos: t.legal.tos, privacy: t.legal.privacy, aup: t.legal.aup, antiSolicit: t.legal.antiSolicit };
  const bodyMap = { tos: t.legal.tosBody, privacy: t.legal.privacyBody, aup: t.legal.aupBody, antiSolicit: t.legal.antiBody };
  const pathMap = { tos: "/legal/terms", privacy: "/legal/privacy", aup: "/legal/acceptable-use", antiSolicit: "/legal/anti-solicitation" };
  useSeo(
    {
      title: titleMap[titleKey],
      description: bodyMap[titleKey].slice(0, 155),
      path: pathMap[titleKey],
      lang,
      robots: "index,follow",
    },
    [lang, titleKey],
  );
  return (
    <PublicLayout>
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t.legal.lastUpdated}: 2025-04</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-burgundy md:text-5xl text-balance">{titleMap[titleKey]}</h1>
          <div className="prose prose-neutral mt-8 max-w-none text-foreground">
            <p className="text-base leading-relaxed text-muted-foreground">{bodyMap[titleKey]}</p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

export const Terms = () => <LegalPage titleKey="tos" />;
export const Privacy = () => <LegalPage titleKey="privacy" />;
export const AcceptableUse = () => <LegalPage titleKey="aup" />;
export const AntiSolicitation = () => <LegalPage titleKey="antiSolicit" />;
