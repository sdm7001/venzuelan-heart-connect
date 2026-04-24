import { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, LayoutDashboard, User, MessageCircle, ShieldAlert, LogOut, ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "./LanguageToggle";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { isStaff, signOut, user } = useAuth();
  const nav = useNavigate();

  const items = [
    { to: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { to: "/profile", label: t.nav.profile, icon: User },
    { to: "/messages", label: t.nav.messages, icon: MessageCircle },
  ];

  async function logout() { await signOut(); nav("/"); }

  return (
    <div className="min-h-screen bg-muted/30">
      <ImpersonationBanner />
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-display text-lg font-semibold text-burgundy">
            <span className="grid h-8 w-8 place-items-center rounded-full gradient-romance">
              <Heart className="h-4 w-4 text-primary-foreground" fill="currentColor" />
            </span>
            MatchVenezuelan
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {items.map(i => (
              <NavLink key={i.to} to={i.to}
                className={({ isActive }) => cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth",
                  isActive && "bg-accent text-foreground"
                )}>
                <i.icon className="h-4 w-4" /> {i.label}
              </NavLink>
            ))}
            {isStaff && (
              <NavLink to="/admin"
                className={({ isActive }) => cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-burgundy hover:bg-primary-soft/40 transition-smooth",
                  isActive && "bg-primary-soft/60"
                )}>
                <ShieldAlert className="h-4 w-4" /> {t.nav.admin}
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">{t.nav.logout}</span>
            </Button>
          </div>
        </div>
        {/* mobile bottom nav */}
        <nav className="md:hidden border-t border-border bg-background">
          <div className="container flex justify-around py-1">
            {items.map(i => (
              <NavLink key={i.to} to={i.to}
                className={({ isActive }) => cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground",
                  isActive && "text-primary"
                )}>
                <i.icon className="h-4 w-4" /> {i.label}
              </NavLink>
            ))}
            {isStaff && (
              <NavLink to="/admin"
                className={({ isActive }) => cn("flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground", isActive && "text-primary")}>
                <ShieldAlert className="h-4 w-4" /> {t.nav.admin}
              </NavLink>
            )}
          </div>
        </nav>
      </header>
      <main className="container py-8 pb-24 md:pb-12">{children}</main>
    </div>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold text-burgundy">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, body, icon }: { title: string; body: string; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      {icon && <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-burgundy">{icon}</div>}
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export function PlaceholderRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
      <span>{label}</span>
      <ChevronRight className="h-4 w-4" />
    </div>
  );
}
