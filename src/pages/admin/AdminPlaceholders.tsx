import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { EmptyState } from "@/components/layout/AppLayout";
import { ShieldAlert, BadgeCheck, CreditCard, Activity, FileText } from "lucide-react";

export function AdminFlags() {
  return (
    <AdminLayout>
      <AdminPageHeader title="Behavior flags" sub="Automated detections (mass messaging, copy-paste intros, money requests, off-platform attempts, high report frequency)" />
      <EmptyState icon={<ShieldAlert className="h-5 w-5" />} title="No active flags" body="Behavior signals from text, image and pattern detection will surface here. The framework is ready — external moderation providers can be plugged in without changes to the queue UI." />
    </AdminLayout>
  );
}

export function AdminVerification() {
  return (
    <AdminLayout>
      <AdminPageHeader title="Verification queue" sub="Photo, social, ID, income, background-check (placeholder) and Concierge Verified review" />
      <EmptyState icon={<BadgeCheck className="h-5 w-5" />} title="No verification requests" body="Submitted verification requests appear here for reviewers. Statuses: not_started, submitted, under_review, approved, rejected, needs_more_info." />
    </AdminLayout>
  );
}

export function AdminBilling() {
  return (
    <AdminLayout>
      <AdminPageHeader title="Subscriptions & billing" sub="Tiers: level_1 · level_2 · premium · concierge_verified" />
      <EmptyState icon={<CreditCard className="h-5 w-5" />} title="Billing wiring ready" body="Subscriptions, credit wallets, billing events, refund logs and failed-payment state are scaffolded. Stripe checkout and webhook wiring arrive in P1." />
    </AdminLayout>
  );
}

export function AdminAudit() {
  return (
    <AdminLayout>
      <AdminPageHeader title="Audit log" sub="Append-only history of moderation, verification, billing, role and policy events" />
      <EmptyState icon={<Activity className="h-5 w-5" />} title="Audit stream is live" body="Every signup, role grant, moderation action, verification decision and policy acknowledgement is recorded in audit_events." />
    </AdminLayout>
  );
}

export function AdminPolicies() {
  return (
    <AdminLayout>
      <AdminPageHeader title="Policies & content" sub="Versioned policy editor (placeholder)" />
      <EmptyState icon={<FileText className="h-5 w-5" />} title="Editor coming in P1" body="Policy text is rendered from translations today. The versioned editor with publish workflow ships in the next phase. Member acknowledgements are already recorded." />
    </AdminLayout>
  );
}
