import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/I18nProvider";
import logo from "@/assets/logo.webp";

export function PublicFooter() {
  const { t, lang } = useI18n();
  const isEs = lang === "es";
  return (
    <footer className="mt-block border-t border-black/10 bg-white text-black">
      <div className="container py-section px-gutter">
        <div className="grid grid-cols-1 gap-stack sm:grid-cols-2 sm:gap-block md:grid-cols-5">
          <div className="sm:col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-display text-base font-semibold text-black sm:text-lg">
              <img src={logo} alt="MatchVenezuelan" className="h-12 w-12 object-contain sm:h-14 sm:w-14 md:h-16 md:w-16" />
              <span className="whitespace-nowrap">MatchVenezuelan</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-black/70">{t.footer.tagline}</p>
          </div>
          <FooterCol title={t.footer.product} links={[
            { to: "/how-it-works", label: t.nav.how },
            { to: "/safety", label: t.nav.safety },
            { to: "/faq", label: t.nav.faq },
            { to: isEs ? "/es/recursos" : "/resources", label: t.nav.resources },
          ]} />
          <FooterCol title={t.footer.legal} links={[
            { to: "/legal/terms", label: t.legal.tos },
            { to: "/legal/privacy", label: t.legal.privacy },
            { to: "/legal/cookies", label: t.legal.cookies },
            { to: "/legal/consent", label: t.legal.consent },
            { to: "/legal/acceptable-use", label: t.legal.aup },
            { to: "/legal/anti-solicitation", label: t.legal.antiSolicit },
            { to: "/legal/community-guidelines", label: isEs ? "Normas de la Comunidad" : "Community Guidelines" },
            { to: "/legal/refunds", label: isEs ? "Política de Reembolsos" : "Refund Policy" },
            { to: "/legal/disclaimer", label: isEs ? "Aviso Legal" : "Legal Disclaimer" },
          ]} />
          <FooterCol title={t.footer.company} links={[
            { to: "/", label: t.nav.home },
            { to: "/about", label: isEs ? "Nosotros" : "About" },
            { to: "/auth?mode=join", label: t.nav.join },
          ]} />
          <FooterCol
            title={isEs ? "Perfiles destacados" : "Featured profiles"}
            links={[
              {
                to: isEs ? "/es/conocer-mujeres-venezolanas" : "/meet-venezuelan-women",
                label: isEs ? "Conocer venezolanas" : "Meet Venezuelan Women",
              },
              {
                to: isEs ? "/es/sitio-de-citas-venezolanas" : "/venezuelan-dating-site",
                label: isEs ? "Sitio de citas venezolanas" : "Venezuelan Dating Site",
              },
              {
                to: isEs ? "/es/mujeres-venezolanas-para-matrimonio" : "/venezuelan-women-for-marriage",
                label: isEs ? "Venezolanas para matrimonio" : "Venezuelan Women for Marriage",
              },
              {
                to: isEs ? "/es/cultura-de-citas-venezolanas" : "/venezuelan-dating-culture",
                label: isEs ? "Cultura de citas venezolanas" : "Venezuelan Dating Culture",
              },
              {
                to: "/verified-venezuelan-dating-profiles",
                label: isEs ? "Perfiles verificados" : "Verified Profiles",
              },
            ]}
          />
        </div>
        <div className="mt-block border-t border-black/10 pt-6 text-[11px] leading-relaxed text-black/60 sm:text-xs">{t.footer.copyright}</div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-stack">
      <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-black sm:text-sm sm:tracking-normal sm:normal-case">{title}</h4>
      <ul className="flex flex-col gap-stack text-sm">
        {links.map(l => (
          <li key={l.to}>
            <Link to={l.to} className="inline-block py-0.5 text-black/70 transition-smooth hover:text-black">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
