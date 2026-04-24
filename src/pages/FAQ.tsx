import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo, faqLd } from "@/seo/seo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FAQ() {
  const { t, lang } = useI18n();
  const items = [
    [t.faq.q1, t.faq.a1],
    [t.faq.q2, t.faq.a2],
    [t.faq.q3, t.faq.a3],
    [t.faq.q4, t.faq.a4],
    [t.faq.q5, t.faq.a5],
  ];
  useSeo(
    {
      title: t.faq.title,
      description: items.map(([q]) => q).join(" · ").slice(0, 155),
      path: "/faq",
      lang,
      jsonLd: faqLd(items.map(([q, a]) => ({ q, a }))),
    },
    [lang],
  );
  return (
    <PublicLayout>
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-semibold text-burgundy md:text-5xl text-balance">{t.faq.title}</h1>
          <Accordion type="single" collapsible className="mt-10">
            {items.map(([q, a], i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border">
                <AccordionTrigger className="text-left font-display text-base font-medium text-foreground hover:no-underline">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </PublicLayout>
  );
}
