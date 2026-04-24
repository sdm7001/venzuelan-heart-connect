import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/auth/AuthProvider";
import { LanguageToggle } from "./LanguageToggle";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

export function PublicHeader() {
  const { t } = useI18n();
  const { user, isStaff } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  const links = [
    { to: "/", label: t.nav.home },
    { to: "/how-it-works", label: t.nav.how },
    { to: "/safety", label: t.nav.safety },
    { to: "/faq", label: t.nav.faq },
    { to: "/resources", label: t.nav.resources },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container flex items-center justify-between gap-header py-header min-h-header">
        <Link to="/" className="flex items-center gap-2 font-display text-base font-semibold tracking-tight sm:text-lg">
          <img src={logo} alt="MatchVenezuelan" className="size-header-logo object-contain" />
          <span className="text-burgundy whitespace-nowrap">MatchVenezuelan</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={cn("rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth",
                loc.pathname === l.to && "text-foreground")}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageToggle />
          {user ? (
            <>
              {isStaff && (
                <Button asChild variant="ghost" size="sm"><Link to="/admin">{t.nav.admin}</Link></Button>
              )}
              <Button asChild size="sm"><Link to="/dashboard">{t.nav.dashboard}</Link></Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/auth">{t.nav.signin}</Link></Button>
              <Button asChild size="sm" variant="romance"><Link to="/auth?mode=join">{t.nav.join}</Link></Button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(v => !v)} aria-label="menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <div className="container flex flex-col gap-1 py-4">
            {links.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
                {l.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            <LanguageToggle />
            {user ? (
              <Button asChild className="mt-2"><Link to="/dashboard" onClick={() => setOpen(false)}>{t.nav.dashboard}</Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="mt-2"><Link to="/auth" onClick={() => setOpen(false)}>{t.nav.signin}</Link></Button>
                <Button asChild variant="romance"><Link to="/auth?mode=join" onClick={() => setOpen(false)}>{t.nav.join}</Link></Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
