import { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, LayoutDashboard, Users, Flag, ShieldAlert, BadgeCheck, CreditCard, Activity, FileText, ClipboardCheck, History, LogOut, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "./LanguageToggle";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin", end: true, label: "Overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/reports", label: "Reports", icon: Flag },
  { to: "/admin/flags", label: "Flags", icon: ShieldAlert },
  { to: "/admin/risk-events", label: "Risk events", icon: ShieldAlert },
  { to: "/admin/verification", label: "Verification", icon: BadgeCheck },
  { to: "/admin/billing", label: "Billing", icon: CreditCard },
  { to: "/admin/audit", label: "Audit log", icon: Activity },
  { to: "/admin/policies", label: "Policies", icon: FileText },
  { to: "/admin/policy-acceptance", label: "Policy acceptance", icon: ClipboardCheck },
  { to: "/admin/policy-reaccepts", label: "Re-accept events", icon: History },
  { to: "/admin/rls-tests", label: "RLS tests", icon: ShieldCheck },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { signOut } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-muted/30">
      <ImpersonationBanner />
      <div className="md:grid md:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <Link to="/admin" className="flex items-center gap-2 px-6 py-5 font-display text-lg font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-full gradient-romance">
            <Heart className="h-4 w-4 text-primary-foreground" fill="currentColor" />
          </span>
          MatchVenezuelan
          <span className="ml-1 rounded-full bg-sidebar-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">Admin</span>
        </Link>
        <nav className="flex-1 space-y-0.5 px-3">
          {items.map(i => (
            <NavLink key={i.to} to={i.to} end={i.end as any}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                isActive && "bg-sidebar-accent text-sidebar-foreground"
              )}>
              <i.icon className="h-4 w-4" /> {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-2 border-t border-sidebar-border p-4">
          <LanguageToggle />
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={async () => { await signOut(); nav("/"); }}>
            <LogOut className="h-4 w-4 mr-2" /> {t.nav.logout}
          </Button>
          <Button asChild variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
            <Link to="/dashboard">← User app</Link>
          </Button>
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="md:hidden flex items-center justify-between border-b border-border bg-background px-4 py-3">
          <Link to="/admin" className="font-display font-semibold text-burgundy">Admin</Link>
          <Button asChild variant="ghost" size="sm"><Link to="/dashboard">← App</Link></Button>
        </header>
        <main className="container py-8">{children}</main>
      </div>
      </div>
    </div>
  );
}

export function AdminPageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold text-burgundy">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
