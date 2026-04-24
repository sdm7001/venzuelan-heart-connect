import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/I18nProvider";
import logo from "@/assets/logo.png";

export function PublicFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="container py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
              <img src={logo} alt="MatchVenezuelan" className="h-28 w-28 object-contain" />
              <span className="text-burgundy">MatchVenezuelan</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">{t.footer.tagline}</p>
          </div>
          <FooterCol title={t.footer.product} links={[
            { to: "/how-it-works", label: t.nav.how },
            { to: "/safety", label: t.nav.safety },
            { to: "/faq", label: t.nav.faq },
          ]} />
          <FooterCol title={t.footer.legal} links={[
            { to: "/legal/terms", label: t.legal.tos },
            { to: "/legal/privacy", label: t.legal.privacy },
            { to: "/legal/acceptable-use", label: t.legal.aup },
            { to: "/legal/anti-solicitation", label: t.legal.antiSolicit },
          ]} />
          <FooterCol title={t.footer.company} links={[
            { to: "/", label: t.nav.home },
            { to: "/auth?mode=join", label: t.nav.join },
          ]} />
        </div>
        <div className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">{t.footer.copyright}</div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="mb-3 font-display text-sm font-semibold text-foreground">{title}</h4>
      <ul className="space-y-2 text-sm">
        {links.map(l => (
          <li key={l.to}><Link to={l.to} className="text-muted-foreground hover:text-foreground transition-smooth">{l.label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
