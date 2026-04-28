import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Gift as GiftIcon,
  Package,
  Sparkles,
  User,
  Send,
  Inbox,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  Truck,
  Copy,
} from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDateTime, formatRelative } from "@/i18n/datetime";
import type { Lang } from "@/i18n/translations";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Order = {
  id: string;
  kind: "virtual" | "physical";
  status: string;
  created_at: string;
  updated_at: string;
  message: string | null;
  credit_cost: number | null;
  amount_cents: number | null;
  currency: string | null;
  sender_id: string;
  recipient_id: string;
  gift_id: string;
  metadata: Record<string, unknown> | null;
};

type EventRow = {
  id: string;
  order_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type ProfileLite = { id: string; display_name: string | null };
type GiftLite = { id: string; name: string; description: string | null; code: string };

const STATUS_TONE: Record<string, string> = {
  created: "bg-muted text-muted-foreground",
  pending_payment: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  paid: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  processing: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  shipped: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  failed: "bg-destructive/15 text-destructive",
  refunded: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  canceled: "bg-muted text-muted-foreground",
};

const REFUND_STATES = new Set(["refunded", "failed", "canceled"]);
const SHIPPING_STATES = new Set(["processing", "shipped", "delivered", "completed"]);

export default function GiftOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [gift, setGift] = useState<GiftLite | null>(null);
  const [sender, setSender] = useState<ProfileLite | null>(null);
  const [recipient, setRecipient] = useState<ProfileLite | null>(null);

  // Ticks every 30s so relative timestamps ("5 minutes ago") stay fresh.
  const [, setNowTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user || !orderId) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, orderId]);

  async function load() {
    setLoading(true);
    setNotFound(false);

    const { data: o, error } = await supabase
      .from("gift_orders")
      .select("*")
      .eq("id", orderId!)
      .maybeSingle();

    if (error || !o) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const ord = o as Order;
    setOrder(ord);

    const [{ data: ev }, { data: g }, { data: profs }] = await Promise.all([
      supabase
        .from("gift_order_events")
        .select("id, order_id, status, notes, created_at, metadata")
        .eq("order_id", ord.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("gifts")
        .select("id, name, description, code")
        .eq("id", ord.gift_id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", [ord.sender_id, ord.recipient_id]),
    ]);

    setEvents((ev ?? []) as EventRow[]);
    setGift((g as GiftLite) ?? null);
    const ps = (profs ?? []) as ProfileLite[];
    setSender(ps.find(p => p.id === ord.sender_id) ?? null);
    setRecipient(ps.find(p => p.id === ord.recipient_id) ?? null);

    setLoading(false);
  }

  const tg = t.gift?.detail ?? fallbackDetail;
  const tCommon = t.common ?? { back: "Back", loading: "Loading…" };

  const role: "sender" | "recipient" | "other" = useMemo(() => {
    if (!order || !user) return "other";
    if (order.sender_id === user.id) return "sender";
    if (order.recipient_id === user.id) return "recipient";
    return "other";
  }, [order, user]);

  const refundSummary = useMemo(() => summarizeRefund(order, events, lang), [order, events, lang]);
  const shippingSummary = useMemo(() => summarizeShipping(order, events, lang), [order, events, lang]);

  function copyId() {
    if (!order) return;
    navigator.clipboard
      .writeText(order.id)
      .then(() => toast({ title: tg.copied }))
      .catch(() => toast({ title: tg.copyFailed, variant: "destructive" }));
  }

  return (
    <AppLayout>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {tCommon.back}
        </Button>
      </div>

      <PageHeader title={tg.pageTitle} sub={tg.pageSub} />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : notFound || !order ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <h2 className="font-semibold mb-1">{tg.notFoundTitle}</h2>
          <p className="text-sm text-muted-foreground mb-4">{tg.notFoundBody}</p>
          <Button asChild size="sm" variant="soft">
            <Link to="/dashboard">{tg.backToDashboard}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Summary card */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex flex-wrap items-start gap-3 mb-4">
              <span className="mt-1 text-primary">
                {order.kind === "virtual" ? (
                  <Sparkles className="h-5 w-5" />
                ) : (
                  <Package className="h-5 w-5" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-semibold">
                    {gift?.name ?? tg.giftFallback}
                  </h2>
                  <Badge variant="outline" className="capitalize">{order.kind}</Badge>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full capitalize",
                      STATUS_TONE[order.status] ?? "bg-muted text-muted-foreground",
                    )}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
                {gift?.description && (
                  <p className="text-sm text-muted-foreground mt-1">{gift.description}</p>
                )}
              </div>
            </div>

            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <Field label={tg.orderId}>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono break-all">{order.id}</code>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={copyId}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Field>
              <Field label={tg.created}>
                {formatDateTime(order.created_at, lang)}
              </Field>
              <Field label={tg.updated}>
                {formatDateTime(order.updated_at, lang)}
              </Field>
              <Field label={tg.cost}>
                {order.kind === "virtual" && order.credit_cost != null
                  ? `${order.credit_cost} ${tg.creditsUnit}`
                  : order.amount_cents != null
                    ? `${(order.amount_cents / 100).toFixed(2)} ${order.currency ?? "USD"}`
                    : "—"}
              </Field>
            </dl>
          </div>

          {/* Sender / recipient */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" /> {tg.peopleTitle}
            </h3>
            <PersonRow
              icon={<Send className="h-4 w-4" />}
              label={tg.from}
              name={sender?.display_name ?? tg.unknownUser}
              isYou={role === "sender"}
              youLabel={tg.you}
            />
            <PersonRow
              icon={<Inbox className="h-4 w-4" />}
              label={tg.to}
              name={recipient?.display_name ?? tg.unknownUser}
              isYou={role === "recipient"}
              youLabel={tg.you}
            />
          </div>

          {/* Message */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4" /> {tg.messageTitle}
            </h3>
            {order.message ? (
              <MessageBlock message={order.message} metadata={order.metadata} t={tg} />
            ) : (
              <p className="text-sm text-muted-foreground italic">{tg.noMessage}</p>
            )}
          </div>

          {/* Refund / shipping summary */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              {order.kind === "physical" ? (
                <Truck className="h-4 w-4" />
              ) : (
                <GiftIcon className="h-4 w-4" />
              )}
              {tg.statusSummary}
            </h3>

            <SummaryBlock
              icon={<Truck className="h-4 w-4" />}
              title={tg.shippingTitle}
              tone={shippingSummary.tone}
              label={shippingSummary.label}
              detail={shippingSummary.detail}
            />
            <SummaryBlock
              icon={<RefreshCcw className="h-4 w-4" />}
              title={tg.refundTitle}
              tone={refundSummary.tone}
              label={refundSummary.label}
              detail={refundSummary.detail}
            />
          </div>

          {/* Timeline */}
          <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4" /> {tg.timelineTitle}
            </h3>
            {events.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {tg.noEvents}{" "}
                <span>
                  {tg.createdOn} {formatDateTime(order.created_at, lang)}
                </span>
              </div>
            ) : (
              <ol className="relative border-l border-border pl-5 space-y-5">
                {events.map((e, i) => (
                  <li key={e.id} className="relative">
                    <span
                      className={cn(
                        "absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-card",
                        REFUND_STATES.has(e.status)
                          ? "bg-orange-500"
                          : e.status === "delivered" || e.status === "completed"
                            ? "bg-emerald-500"
                            : i === events.length - 1
                              ? "bg-primary"
                              : "bg-muted-foreground/50",
                      )}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full capitalize",
                          STATUS_TONE[e.status] ?? "bg-muted text-muted-foreground",
                        )}
                      >
                        {e.status.replace(/_/g, " ")}
                      </span>
                      <span
                        className="text-xs text-muted-foreground"
                        title={formatDateTime(e.created_at, lang)}
                      >
                        {formatRelative(e.created_at, lang)}
                        <span className="mx-1.5 opacity-50">·</span>
                        <span className="opacity-70">
                          {formatDateTime(e.created_at, lang)}
                        </span>
                      </span>
                    </div>
                    {e.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{e.notes}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function PersonRow({
  icon,
  label,
  name,
  isYou,
  youLabel,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  isYou: boolean;
  youLabel: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="font-medium flex items-center gap-2">
          <span className="truncate">{name}</span>
          {isYou && <Badge variant="secondary" className="text-[10px]">{youLabel}</Badge>}
        </div>
      </div>
    </div>
  );
}

function MessageBlock({
  message,
  metadata,
  t,
}: {
  message: string;
  metadata: Record<string, unknown> | null;
  t: typeof fallbackDetail;
}) {
  const m = (metadata?.message ?? {}) as any;
  const original = m.original as string | undefined;
  const translated = m.translated as string | undefined;
  const origLang = m.original_lang as string | undefined;
  const transLang = m.translated_lang as string | undefined;

  if (translated && original && translated !== original) {
    return (
      <div className="space-y-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            {t.messageTranslated} {transLang ? `(${transLang})` : ""}
          </div>
          <p className="italic">"{translated}"</p>
        </div>
        <div className="border-t border-border pt-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            {t.messageOriginal} {origLang ? `(${origLang})` : ""}
          </div>
          <p className="italic text-muted-foreground">"{original}"</p>
        </div>
      </div>
    );
  }
  return <p className="italic">"{message}"</p>;
}

function SummaryBlock({
  icon,
  title,
  tone,
  label,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  tone: "neutral" | "positive" | "warning" | "info";
  label: string;
  detail: string;
}) {
  const toneClass =
    tone === "positive"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
      : tone === "warning"
        ? "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20"
        : tone === "info"
          ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
          : "bg-muted text-muted-foreground border-border";

  return (
    <div className={cn("rounded-lg border p-3", toneClass)}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
        {icon}
        {title}
      </div>
      <div className="mt-1 font-medium">{label}</div>
      <p className="text-xs opacity-80 mt-0.5">{detail}</p>
    </div>
  );
}

type Summary = { tone: "neutral" | "positive" | "warning" | "info"; label: string; detail: string };

function summarizeRefund(order: Order | null, events: EventRow[], lang: Lang): Summary {
  if (!order) return { tone: "neutral", label: "—", detail: "" };
  const refundEv = [...events].reverse().find(e => REFUND_STATES.has(e.status));
  if (order.status === "refunded" || refundEv?.status === "refunded") {
    return {
      tone: "warning",
      label: "Refunded",
      detail: refundEv ? `On ${formatDateTime(refundEv.created_at, lang)}` : "Order amount returned.",
    };
  }
  if (order.status === "failed" || order.status === "canceled") {
    return {
      tone: "warning",
      label: order.status === "failed" ? "Payment failed" : "Order canceled",
      detail: refundEv?.notes ?? "No charge was completed; nothing to refund.",
    };
  }
  return { tone: "positive", label: "No refund issued", detail: "Order is in good standing." };
}

function summarizeShipping(order: Order | null, events: EventRow[], lang: Lang): Summary {
  if (!order) return { tone: "neutral", label: "—", detail: "" };
  if (order.kind === "virtual") {
    return {
      tone: "positive",
      label: "Delivered instantly",
      detail: "Virtual gifts appear in the recipient's inbox immediately.",
    };
  }
  const lastShipEv = [...events].reverse().find(e => SHIPPING_STATES.has(e.status));
  if (order.status === "delivered" || order.status === "completed") {
    return {
      tone: "positive",
      label: "Delivered",
      detail: lastShipEv ? `On ${formatDateTime(lastShipEv.created_at, lang)}` : "Confirmed by courier.",
    };
  }
  if (order.status === "shipped") {
    return { tone: "info", label: "In transit", detail: "Courier has picked up the gift." };
  }
  if (order.status === "processing" || order.status === "paid") {
    return { tone: "info", label: "Preparing", detail: "Concierge team is sourcing & packing." };
  }
  if (order.status === "pending_payment" || order.status === "created") {
    return { tone: "neutral", label: "Awaiting processing", detail: "Will start once payment is confirmed." };
  }
  return { tone: "neutral", label: order.status.replace(/_/g, " "), detail: "" };
}

const fallbackDetail = {
  pageTitle: "Gift order details",
  pageSub: "Full timeline, parties, message, and status summary.",
  notFoundTitle: "Order not found",
  notFoundBody: "This gift order doesn't exist or you don't have permission to view it.",
  backToDashboard: "Back to dashboard",
  giftFallback: "Gift",
  orderId: "Order ID",
  created: "Created",
  updated: "Last update",
  cost: "Cost",
  creditsUnit: "credits",
  peopleTitle: "Sender & recipient",
  from: "From",
  to: "To",
  you: "You",
  unknownUser: "Unknown user",
  messageTitle: "Message",
  noMessage: "No message attached.",
  messageOriginal: "Original",
  messageTranslated: "Translated",
  statusSummary: "Status summary",
  shippingTitle: "Shipping",
  refundTitle: "Refund",
  timelineTitle: "Event timeline",
  noEvents: "No events recorded yet.",
  createdOn: "Created on",
  copied: "Order ID copied",
  copyFailed: "Could not copy",
};
