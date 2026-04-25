import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Gift, ShieldAlert, BadgeCheck, Sparkles, Package, Ban, UserX, CheckCircle2, Truck, Clock, MessageCircle } from "lucide-react";
import { AppLayout, EmptyState, PageHeader } from "@/components/layout/AppLayout";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";

type GiftRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  credit_cost: number;
  active: boolean;
};

type TrustState = {
  badge_count: number;
  concierge_verified: boolean;
  recent_severe_flags: number;
  account_status: string | null;
};

type EligibilityCode =
  | "account_suspended"
  | "account_pending"
  | "account_deactivated"
  | "no_trust_badge"
  | "recent_severe_flags"
  | "trust_state_unavailable"
  | "rpc_denied";

type EligibilityReason = {
  code: EligibilityCode;
  vars?: Record<string, string | number>;
  ctaKey:
    | "ctaContactSupport"
    | "ctaCheckVerification"
    | "ctaOpenProfile"
    | "ctaGetVerified"
    | "ctaReviewSafety"
    | "ctaRefresh";
  to: string;
};

type Eligibility = {
  eligible: boolean;
  reasons: EligibilityReason[];
  trust: TrustState | null;
};

// Tiny {var} interpolation for translation strings.
function fmt(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] === undefined || vars[k] === null ? "" : String(vars[k]),
  );
}

export default function GiftSend() {
  const { user } = useAuth();
  const { t } = useI18n();
  const tg = t.gift;
  const [params] = useSearchParams();
  const recipientId = params.get("to") ?? "";
  const threadId = params.get("thread");

  const [recipient, setRecipient] = useState<{ display_name?: string | null; [key: string]: unknown } | null>(null);
  const [recipientLang, setRecipientLang] = useState<"en" | "es" | null>(null);
  const [senderLang, setSenderLang] = useState<"en" | "es" | null>(null);
  const [gifts, setGifts] = useState<GiftRow[]>([]);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [recipientEligible, setRecipientEligible] = useState<boolean | null>(null);
  const [recipientTrust, setRecipientTrust] = useState<TrustState | null>(null);
  const [blockState, setBlockState] = useState<{ a_blocks_b: boolean; b_blocks_a: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<"virtual" | "physical">("virtual");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    orderId: string;
    createdAt: string;
    kind: "virtual" | "physical";
    gift: GiftRow;
    message: string | null;
    creditCost: number | null;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, recipientId]);

  async function load() {
    setLoading(true);

    const [{ data: giftsData }, { data: trustRow }, { data: eligible }] =
      await Promise.all([
        supabase.from("gifts").select("*").eq("active", true).order("credit_cost"),
        supabase.rpc("user_trust_state", { _user_id: user!.id }),
        supabase.rpc("is_eligible_for_gifting", { _user_id: user!.id }),
      ]);

    setGifts((giftsData ?? []) as GiftRow[]);

    const trust: TrustState | null =
      Array.isArray(trustRow) && trustRow[0] ? (trustRow[0] as TrustState) : null;

    const reasons: EligibilityReason[] = [];
    if (trust) {
      const status = trust.account_status;
      if (status === "suspended") {
        reasons.push({
          code: "account_suspended",
          ctaKey: "ctaContactSupport",
          to: "/safety",
        });
      } else if (status === "pending") {
        reasons.push({
          code: "account_pending",
          ctaKey: "ctaCheckVerification",
          to: "/verification",
        });
      } else if (status && status !== "active") {
        reasons.push({
          code: "account_deactivated",
          vars: { status },
          ctaKey: "ctaOpenProfile",
          to: "/profile",
        });
      }

      if ((trust.badge_count ?? 0) < 1) {
        reasons.push({
          code: "no_trust_badge",
          ctaKey: "ctaGetVerified",
          to: "/verification",
        });
      }

      if ((trust.recent_severe_flags ?? 0) > 0) {
        const n = trust.recent_severe_flags;
        reasons.push({
          code: "recent_severe_flags",
          vars: { n, plural: n === 1 ? "" : "s" },
          ctaKey: "ctaReviewSafety",
          to: "/safety",
        });
      }
    } else {
      reasons.push({
        code: "trust_state_unavailable",
        ctaKey: "ctaRefresh",
        to: "/gift",
      });
    }

    if (eligible === false && reasons.length === 0) {
      reasons.push({
        code: "rpc_denied",
        ctaKey: "ctaContactSupport",
        to: "/safety",
      });
    }

    setEligibility({
      eligible: !!eligible && reasons.length === 0,
      reasons,
      trust,
    });

    // Sender's preferred language for translation
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user!.id)
      .maybeSingle();
    setSenderLang((senderProfile?.preferred_language as "en" | "es") ?? null);

    if (recipientId) {
      const [{ data: r }, { data: rEligible }, { data: rTrust }, { data: blk }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, account_status, preferred_language")
          .eq("id", recipientId)
          .maybeSingle(),
        supabase.rpc("is_eligible_for_gifting", { _user_id: recipientId }),
        supabase.rpc("user_trust_state", { _user_id: recipientId }),
        supabase.rpc("is_blocked_between", { _a: user!.id, _b: recipientId }),
      ]);
      setRecipient(r);
      setRecipientLang((r?.preferred_language as "en" | "es") ?? null);
      setRecipientEligible(!!rEligible);
      setRecipientTrust(
        Array.isArray(rTrust) && rTrust[0] ? (rTrust[0] as TrustState) : null
      );
      setBlockState(
        Array.isArray(blk) && blk[0]
          ? (blk[0] as { a_blocks_b: boolean; b_blocks_a: boolean })
          : { a_blocks_b: false, b_blocks_a: false }
      );
    }

    setLoading(false);
  }

  const selected = useMemo(
    () => gifts.find(g => g.id === selectedId) ?? null,
    [gifts, selectedId]
  );

  const isBlocked = !!(blockState?.a_blocks_b || blockState?.b_blocks_a);

  const canSend =
    !!user &&
    !!recipientId &&
    !!selected &&
    !!eligibility?.eligible &&
    recipientEligible !== false &&
    !isBlocked &&
    !sending;

  async function handleSend() {
    if (!canSend || !selected) return;
    setSending(true);

    let translation: {
      source_lang: string | null;
      target_lang: "en" | "es";
      original: string;
      translated: string;
      skipped?: string;
    } | null = null;

    const trimmed = (message ?? "").trim();
    const target: "en" | "es" = recipientLang ?? "en";

    if (trimmed.length > 0) {
      try {
        const { data: tData, error: tError } = await supabase.functions.invoke(
          "translate-gift-message",
          {
            body: {
              text: trimmed,
              target_lang: target,
              source_hint: senderLang ?? undefined,
            },
          },
        );
        if (tError) throw tError;
        if (tData?.error) throw new Error(tData.error);
        translation = tData;
      } catch (e: unknown) {
        console.warn("Translation failed", e);
        toast.message(tg.toasts.translationFailed);
      }
    }

    const finalMessage = translation?.translated ?? (trimmed || null);

    const messageMeta =
      trimmed.length > 0
        ? {
            message: {
              original: trimmed,
              original_lang: translation?.source_lang ?? senderLang ?? null,
              translated: translation?.translated ?? trimmed,
              translated_lang: target,
              translation_skipped: translation?.skipped ?? null,
              translation_provider: translation ? "lovable-ai" : null,
            },
          }
        : {};

    const baseMeta =
      kind === "physical"
        ? { fulfillment: "pending_admin", note: "Physical gift requires admin processing" }
        : {};

    const payload: Record<string, unknown> = {
      sender_id: user!.id,
      recipient_id: recipientId,
      gift_id: selected.id,
      kind,
      thread_id: threadId ?? null,
      message: finalMessage,
      status: "created",
      credit_cost: kind === "virtual" ? selected.credit_cost : null,
      metadata: { ...baseMeta, ...messageMeta },
    };

    const { data: inserted, error } = await supabase
      .from("gift_orders")
      .insert(payload)
      .select("id, created_at, kind, credit_cost, message")
      .single();
    setSending(false);

    if (error || !inserted) {
      toast.error(error?.message ?? tg.toasts.orderFailed);
      return;
    }

    toast.success(
      kind === "virtual" ? tg.toasts.virtualSuccess : tg.toasts.physicalSuccess
    );

    setConfirmation({
      orderId: inserted.id,
      createdAt: inserted.created_at,
      kind,
      gift: selected,
      message: inserted.message ?? null,
      creditCost: inserted.credit_cost ?? null,
    });
    setMessage("");
    setSelectedId(null);
  }

  function startNewGift() {
    setConfirmation(null);
  }

  if (confirmation) {
    return (
      <AppLayout>
        <PageHeader
          title={tg.confirmation.title}
          sub={
            recipient
              ? fmt(tg.confirmation.toUser, {
                  name: recipient.display_name ?? tg.confirmation.toFallback,
                })
              : undefined
          }
        />
        <GiftConfirmation
          confirmation={confirmation}
          recipient={recipient}
          threadId={threadId}
          onSendAnother={startNewGift}
        />
      </AppLayout>
    );
  }

  const badgeCount = eligibility?.trust?.badge_count ?? 0;

  return (
    <AppLayout>
      <PageHeader
        title={tg.pageTitle}
        sub={
          recipient
            ? fmt(tg.pageSubTo, {
                name: recipient.display_name ?? tg.confirmation.toFallback,
              })
            : tg.pageSubPick
        }
      />

      {/* Eligibility banner */}
      {loading ? (
        <div className="text-sm text-muted-foreground mb-6">{tg.checking}</div>
      ) : eligibility?.eligible ? (
        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
          <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium">{tg.eligibleTitle}</div>
            <div className="text-muted-foreground mt-0.5">
              {fmt(tg.eligibleBody, {
                count: badgeCount,
                plural: badgeCount === 1 ? "" : "s",
                concierge: eligibility.trust?.concierge_verified
                  ? tg.conciergeSuffix
                  : "",
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-destructive mt-0.5" />
          <div className="text-sm flex-1">
            <div className="font-medium">{tg.disabledTitle}</div>
            <div className="text-muted-foreground mt-0.5">
              {(eligibility?.reasons.length ?? 0) === 1
                ? tg.disabledOne
                : fmt(tg.disabledMany, {
                    count: eligibility?.reasons.length ?? 0,
                  })}
            </div>

            <ul className="mt-3 space-y-2">
              {(eligibility?.reasons ?? []).map((r) => {
                const titleKey = `${r.code}_title` as keyof typeof tg.reasons;
                const detailKey = `${r.code}_detail` as keyof typeof tg.reasons;
                return (
                  <li
                    key={r.code}
                    className="rounded-md border border-destructive/20 bg-background/40 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">
                          {fmt(tg.reasons[titleKey] as string, r.vars)}
                        </div>
                        <div className="text-muted-foreground mt-0.5">
                          {fmt(tg.reasons[detailKey] as string, r.vars)}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                          {tg.codeLabel} {r.code}
                        </div>
                      </div>
                      <Button asChild size="sm" variant="outline" className="shrink-0">
                        <Link to={r.to}>{tg.reasons[r.ctaKey]}</Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
              {(eligibility?.reasons.length ?? 0) === 0 && (
                <li className="text-muted-foreground">{tg.checkFailed}</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {recipientId && !loading && (
        <RecipientStatusCard
          recipient={recipient}
          eligible={recipientEligible}
          trust={recipientTrust}
          aBlocksB={!!blockState?.a_blocks_b}
          bBlocksA={!!blockState?.b_blocks_a}
        />
      )}

      {!recipientId && (
        <EmptyState
          icon={<Gift className="h-5 w-5" />}
          title={tg.noRecipientTitle}
          body={tg.noRecipientBody}
        />
      )}

      {recipientId && (
        <div className="space-y-6">
          <Tabs value={kind} onValueChange={(v) => setKind(v as "virtual" | "physical")}>
            <TabsList>
              <TabsTrigger value="virtual">
                <Sparkles className="h-4 w-4 mr-1" /> {tg.tabVirtual}
              </TabsTrigger>
              <TabsTrigger value="physical">
                <Package className="h-4 w-4 mr-1" /> {tg.tabPhysical}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="virtual" className="mt-4">
              <GiftGrid
                gifts={gifts}
                selectedId={selectedId}
                onSelect={setSelectedId}
                disabled={!eligibility?.eligible || recipientEligible === false || isBlocked}
                kind="virtual"
              />
            </TabsContent>

            <TabsContent value="physical" className="mt-4">
              <div className="text-xs text-muted-foreground mb-3">
                {tg.physicalNote}
              </div>
              <GiftGrid
                gifts={gifts}
                selectedId={selectedId}
                onSelect={setSelectedId}
                disabled={!eligibility?.eligible || recipientEligible === false || isBlocked}
                kind="physical"
              />
            </TabsContent>
          </Tabs>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">{tg.messageLabel}</label>
              {recipientLang && senderLang && recipientLang !== senderLang && (
                <span className="text-[11px] text-muted-foreground">
                  {fmt(tg.messageHint, {
                    lang: recipientLang === "es" ? tg.langSpanish : tg.langEnglish,
                  })}
                </span>
              )}
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={tg.messagePlaceholder}
              rows={3}
              maxLength={500}
              disabled={!eligibility?.eligible || recipientEligible === false || isBlocked}
            />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="text-sm text-muted-foreground">
              {selected ? (
                <>
                  {tg.selectedLabel}{" "}
                  <span className="font-medium text-foreground">{selected.name}</span>
                  {kind === "virtual" && (
                    <> · {fmt(tg.creditsSuffix, { n: selected.credit_cost })}</>
                  )}
                </>
              ) : (
                tg.pickToContinue
              )}
            </div>
            <Button onClick={handleSend} disabled={!canSend}>
              {sending
                ? tg.sending
                : kind === "virtual"
                  ? tg.sendVirtual
                  : tg.sendPhysical}
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function GiftGrid({
  gifts, selectedId, onSelect, disabled, kind,
}: {
  gifts: GiftRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled: boolean;
  kind: "virtual" | "physical";
}) {
  const { t } = useI18n();
  const tg = t.gift;
  if (gifts.length === 0) {
    return <div className="text-sm text-muted-foreground">{tg.noGifts}</div>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {gifts.map(g => {
        const active = g.id === selectedId;
        return (
          <button
            key={g.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(g.id)}
            className={cn(
              "text-left border rounded-lg p-3 transition-colors",
              "border-border bg-card hover:bg-muted/40",
              active && "border-primary ring-2 ring-primary/30",
              disabled && "opacity-50 cursor-not-allowed hover:bg-card",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="font-medium">{g.name}</div>
              <Badge variant="outline" className="text-xs">
                {kind === "virtual"
                  ? fmt(tg.creditsShort, { n: g.credit_cost })
                  : tg.physicalShort}
              </Badge>
            </div>
            {g.description && (
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {g.description}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function RecipientStatusCard({
  recipient, eligible, trust, aBlocksB, bBlocksA,
}: {
  recipient: { display_name?: string | null; [key: string]: unknown } | null;
  eligible: boolean | null;
  trust: TrustState | null;
  aBlocksB: boolean;
  bBlocksA: boolean;
}) {
  const { t } = useI18n();
  const r = t.gift.recipient;
  const blocked = aBlocksB || bBlocksA;
  const ok = eligible === true && !blocked;

  const reasons: string[] = [];
  if (aBlocksB) reasons.push(r.youBlocked);
  if (bBlocksA) reasons.push(r.theyBlocked);
  if (eligible === false) {
    if (trust?.account_status && trust.account_status !== "active") {
      reasons.push(fmt(r.accountStatus, { status: trust.account_status }));
    }
    if ((trust?.badge_count ?? 0) < 1) {
      reasons.push(r.noBadge);
    }
    if ((trust?.recent_severe_flags ?? 0) > 0) {
      reasons.push(r.severeFlags);
    }
    if (reasons.length === 0) reasons.push(r.notEligibleGeneric);
  }

  const badgeCount = trust?.badge_count ?? 0;

  return (
    <div
      className={cn(
        "mb-6 rounded-lg border p-4",
        ok
          ? "border-emerald-500/30 bg-emerald-500/10"
          : blocked
            ? "border-destructive/30 bg-destructive/10"
            : "border-amber-500/30 bg-amber-500/10",
      )}
    >
      <div className="flex items-start gap-3">
        {ok ? (
          <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
        ) : blocked ? (
          <Ban className="h-5 w-5 text-destructive mt-0.5" />
        ) : (
          <UserX className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
        )}
        <div className="text-sm flex-1">
          <div className="font-medium">
            {r.title}
            {recipient?.display_name && (
              <span className="text-muted-foreground font-normal"> · {recipient.display_name}</span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                eligible
                  ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                  : "border-destructive/40 text-destructive",
              )}
            >
              {eligible ? r.eligible : r.notEligible}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                blocked
                  ? "border-destructive/40 text-destructive"
                  : "border-emerald-500/40 text-emerald-700 dark:text-emerald-400",
              )}
            >
              {blocked ? r.blocked : r.noBlocks}
            </Badge>
            {trust && (
              <Badge variant="outline" className="text-xs">
                {fmt(r.badges, { n: badgeCount, plural: badgeCount === 1 ? "" : "s" })}
                {trust.concierge_verified ? r.conciergeSuffix : ""}
              </Badge>
            )}
            {trust?.account_status && (
              <Badge variant="outline" className="text-xs">
                {fmt(r.accountLabel, { status: trust.account_status })}
              </Badge>
            )}
          </div>

          {reasons.length > 0 && (
            <ul className="mt-3 text-muted-foreground list-disc pl-5 space-y-0.5">
              {reasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          )}

          <div className="mt-2 text-[11px] text-muted-foreground">
            {r.verifiedHint}
          </div>
        </div>
      </div>
    </div>
  );
}

function GiftConfirmation({
  confirmation, recipient, threadId, onSendAnother,
}: {
  confirmation: {
    orderId: string;
    createdAt: string;
    kind: "virtual" | "physical";
    gift: GiftRow;
    message: string | null;
    creditCost: number | null;
  };
  recipient: { display_name?: string | null; [key: string]: unknown } | null;
  threadId: string | null;
  onSendAnother: () => void;
}) {
  const { t, lang } = useI18n();
  const c = t.gift.confirmation;
  const { orderId, createdAt, kind, gift, message, creditCost } = confirmation;
  const shortId = orderId.slice(0, 8).toUpperCase();
  const created = new Date(createdAt);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(orderId);
      toast.success(c.copied);
    } catch {
      toast.error(c.copyFailed);
    }
  }

  const physicalSteps = [
    { icon: CheckCircle2, label: c.steps.received, done: true, desc: c.steps.receivedDesc },
    { icon: Clock, label: c.steps.review, done: false, desc: c.steps.reviewDesc },
    { icon: Package, label: c.steps.sourcing, done: false, desc: c.steps.sourcingDesc },
    { icon: Truck, label: c.steps.delivered, done: false, desc: c.steps.deliveredDesc },
  ];

  // Split track hint around {link} placeholder
  const trackParts = c.trackHint.split("{link}");

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-start gap-3">
        <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
        <div className="text-sm flex-1">
          <div className="font-medium text-base">
            {kind === "virtual" ? c.virtualSentTitle : c.physicalCreatedTitle}
          </div>
          <div className="text-muted-foreground mt-1">
            {kind === "virtual" ? c.virtualSentBody : c.physicalCreatedBody}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          {c.orderDetails}
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{c.orderId}</dt>
            <dd className="mt-0.5 flex items-center gap-2">
              <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{shortId}</code>
              <button
                onClick={copyId}
                className="text-xs text-primary hover:underline"
                type="button"
              >
                {c.copyFull}
              </button>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{c.created}</dt>
            <dd className="mt-0.5">{created.toLocaleString(lang === "es" ? "es-VE" : "en-US")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{c.type}</dt>
            <dd className="mt-0.5">
              <Badge variant="outline" className="text-xs">
                {kind === "virtual" ? (
                  <><Sparkles className="h-3 w-3 mr-1" /> {t.gift.tabVirtual}</>
                ) : (
                  <><Package className="h-3 w-3 mr-1" /> {t.gift.tabPhysical}</>
                )}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{c.gift}</dt>
            <dd className="mt-0.5 font-medium">{gift.name}</dd>
          </div>
          {gift.description && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">{c.description}</dt>
              <dd className="mt-0.5 text-muted-foreground">{gift.description}</dd>
            </div>
          )}
          {kind === "virtual" && creditCost !== null && (
            <div>
              <dt className="text-muted-foreground">{c.cost}</dt>
              <dd className="mt-0.5">{fmt(t.gift.creditsSuffix, { n: creditCost })}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">{c.recipient}</dt>
            <dd className="mt-0.5">{recipient?.display_name ?? "—"}</dd>
          </div>
          {message && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">{c.yourMessage}</dt>
              <dd className="mt-0.5 italic text-foreground">"{message}"</dd>
            </div>
          )}
        </dl>
      </div>

      {kind === "physical" && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-4">
            {c.whatsNext}
          </div>
          <ol className="space-y-4">
            {physicalSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <li key={i} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 grid h-7 w-7 place-items-center rounded-full border shrink-0",
                      step.done
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted border-border text-muted-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-sm">
                    <div className={cn("font-medium", !step.done && "text-muted-foreground")}>
                      {i + 1}. {step.label}
                    </div>
                    <div className="text-muted-foreground text-xs mt-0.5">{step.desc}</div>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-4 text-xs text-muted-foreground border-t border-border pt-3">
            {trackParts[0]}
            <Link to="/dashboard" className="text-primary hover:underline">
              {c.myGiftsLink}
            </Link>
            {trackParts[1] ?? ""}
          </div>
        </div>
      )}

      {kind === "virtual" && (
        <div className="rounded-lg border border-border bg-card p-5 text-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            {c.whatsNext}
          </div>
          <p className="text-muted-foreground">{c.virtualNext}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button onClick={onSendAnother} variant="default">
          <Gift className="h-4 w-4 mr-1.5" /> {c.sendAnother}
        </Button>
        {threadId && (
          <Button asChild variant="outline">
            <Link to={`/messages?thread=${threadId}`}>
              <MessageCircle className="h-4 w-4 mr-1.5" /> {c.backToChat}
            </Link>
          </Button>
        )}
        <Button asChild variant="ghost">
          <Link to="/dashboard">{c.viewMyGifts}</Link>
        </Button>
      </div>
    </div>
  );
}
