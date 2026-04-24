import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/auth/AuthProvider";
import { LanguageToggle } from "./LanguageToggle";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function PublicHeader() {
  const { t } = useI18n();
  const a = t.a11y;
  const { user, isStaff } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-close drawer on route change.
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  const links = [
    { to: "/", label: t.nav.home },
    { to: "/how-it-works", label: t.nav.how },
    { to: "/safety", label: t.nav.safety },
    { to: "/faq", label: t.nav.faq },
    { to: "/resources", label: t.nav.resources },
  ];

  const isActive = (to: string) =>
    to === "/" ? loc.pathname === "/" : loc.pathname === to || loc.pathname.startsWith(to + "/");

  return (
    <>
      {/* Skip link */}
      <a
        href="#main-content"
        className={cn(
          "sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60]",
          "focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-elegant",
          focusRing,
        )}
      >
        {a.skipToContent}
      </a>

      <header
        className={cn(
          "sticky top-0 z-40 w-full backdrop-blur-lg transition-all duration-300",
          scrolled || open
            ? "border-b border-border/80 bg-background/95 shadow-card supports-[backdrop-filter]:bg-background/85"
            : "border-b border-transparent bg-background/40 supports-[backdrop-filter]:bg-background/30",
        )}
      >
        <div className="container flex h-header max-h-header items-center justify-between gap-header">
          <Link
            to="/"
            aria-label={a.brandHome}
            className={cn(
              "flex h-header-row items-center gap-2 rounded-md font-display text-base font-semibold tracking-tight sm:text-lg",
              focusRing,
            )}
          >
            <img src={logo} alt="" aria-hidden="true" className="size-header-logo shrink-0 object-contain" />
            <span className="text-burgundy whitespace-nowrap leading-none">MatchVenezuelan</span>
          </Link>

          <nav aria-label={a.primaryNav} className="hidden h-header-row items-center gap-1 md:flex">
            {links.map(l => {
              const active = isActive(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-header-row items-center rounded-md px-3 text-sm font-medium leading-none transition-smooth",
                    "text-white/80 hover:text-white",
                    active && "text-white",
                    focusRing,
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden h-header-row items-center gap-2 md:flex">
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

          {/* Mobile cluster: language + hamburger trigger */}
          <div className="flex h-header-row items-center gap-2 md:hidden">
            <LanguageToggle />
            <Sheet open={open} onOpenChange={setOpen}>
              <button
                ref={menuBtnRef}
                type="button"
                onClick={() => setOpen(v => !v)}
                aria-label={open ? a.closeMenu : a.openMenu}
                aria-expanded={open}
                aria-haspopup="dialog"
                aria-controls="mobile-primary-nav"
                className={cn(
                  "inline-flex size-header-logo touch-manipulation items-center justify-center rounded-md text-foreground hover:bg-accent pointer-coarse:min-h-[44px] pointer-coarse:min-w-[44px]",
                  focusRing,
                )}
              >
                {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
              </button>

              <SheetContent
                id="mobile-primary-nav"
                side="right"
                hideClose
                className={cn(
                  // Anchor the panel below the sticky header so top padding stays consistent.
                  "top-header h-[calc(100dvh-var(--header-h))] sm:h-[calc(100dvh-var(--header-h-sm))] md:h-[calc(100dvh-var(--header-h-md))]",
                  "flex w-[88vw] max-w-sm flex-col gap-0 border-l border-border/80 bg-background p-0",
                  "data-[state=open]:duration-300 data-[state=closed]:duration-200",
                )}
              >
                <SheetTitle className="sr-only">{a.mobileNav}</SheetTitle>
                <SheetDescription className="sr-only">{a.skipToContent}</SheetDescription>

                <nav aria-label={a.mobileNav} className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                  {links.map(l => {
                    const active = isActive(l.to);
                    return (
                      <Link
                        key={l.to}
                        to={l.to}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "rounded-md px-3 py-3 text-base font-medium transition-smooth hover:bg-accent",
                          active ? "bg-accent/60 text-foreground" : "text-foreground",
                          focusRing,
                        )}
                      >
                        {l.label}
                      </Link>
                    );
                  })}

                  <div className="my-3 h-px bg-border" role="separator" />

                  <div className="flex flex-col gap-2">
                    {user ? (
                      <>
                        {isStaff && (
                          <Button asChild variant="ghost" className="justify-start">
                            <Link to="/admin" onClick={() => setOpen(false)}>{t.nav.admin}</Link>
                          </Button>
                        )}
                        <Button asChild>
                          <Link to="/dashboard" onClick={() => setOpen(false)}>{t.nav.dashboard}</Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button asChild variant="ghost" className="justify-start">
                          <Link to="/auth" onClick={() => setOpen(false)}>{t.nav.signin}</Link>
                        </Button>
                        <Button asChild variant="romance">
                          <Link to="/auth?mode=join" onClick={() => setOpen(false)}>{t.nav.join}</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
