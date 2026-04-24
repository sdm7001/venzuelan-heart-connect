import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo, faqLd } from "@/seo/seo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const { t, lang } = useI18n();
  const entries = t.faq.entries;

  useSeo(
    {
      title: t.faq.title,
      description: t.faq.intro.slice(0, 155),
      path: "/faq",
      lang,
      jsonLd: faqLd(entries.map((e) => ({ q: e.q, a: e.a }))),
    },
    [lang],
  );

  return (
    <PublicLayout>
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-semibold text-burgundy md:text-5xl text-balance">
            {t.faq.title}
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {t.faq.intro}
          </p>
          <Accordion type="single" collapsible className="mt-10">
            {entries.map((e, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-border"
              >
                <AccordionTrigger className="text-left font-display text-base font-medium text-foreground hover:no-underline">
                  {e.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {e.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </PublicLayout>
  );
}
