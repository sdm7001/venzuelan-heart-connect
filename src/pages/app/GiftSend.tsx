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

type Eligibility = {
  eligible: boolean;
  reasons: string[];
  trust: TrustState | null;
};

export default function GiftSend() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const recipientId = params.get("to") ?? "";
  const threadId = params.get("thread");

  const [recipient, setRecipient] = useState<any>(null);
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

    const reasons: string[] = [];
    if (trust) {
      if (trust.account_status && trust.account_status !== "active") {
        reasons.push(`Your account is ${trust.account_status}.`);
      }
      if ((trust.badge_count ?? 0) < 1) {
        reasons.push("You need at least one trust badge (photo, social, ID or income).");
      }
      if ((trust.recent_severe_flags ?? 0) > 0) {
        reasons.push("Recent serious moderation flags are blocking gift sending for 30 days.");
      }
    } else {
      reasons.push("Trust state could not be loaded.");
    }

    setEligibility({
      eligible: !!eligible && reasons.length === 0,
      reasons,
      trust,
    });

    if (recipientId) {
      const [{ data: r }, { data: rEligible }, { data: rTrust }, { data: blk }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, account_status")
          .eq("id", recipientId)
          .maybeSingle(),
        supabase.rpc("is_eligible_for_gifting", { _user_id: recipientId }),
        supabase.rpc("user_trust_state", { _user_id: recipientId }),
        supabase.rpc("is_blocked_between", { _a: user!.id, _b: recipientId }),
      ]);
      setRecipient(r);
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

    const payload: any = {
      sender_id: user!.id,
      recipient_id: recipientId,
      gift_id: selected.id,
      kind,
      thread_id: threadId ?? null,
      message: message || null,
      status: "created",
      credit_cost: kind === "virtual" ? selected.credit_cost : null,
      metadata: kind === "physical"
        ? { fulfillment: "pending_admin", note: "Physical gift requires admin processing" }
        : {},
    };

    const { data: inserted, error } = await supabase
      .from("gift_orders")
      .insert(payload)
      .select("id, created_at, kind, credit_cost, message")
      .single();
    setSending(false);

    if (error || !inserted) {
      // RLS will block if eligibility regressed between load & send.
      toast.error(error?.message ?? "Failed to create gift order");
      return;
    }

    toast.success(
      kind === "virtual"
        ? "Virtual gift sent"
        : "Physical gift order created — admin will process fulfillment"
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
          title="Gift order confirmed"
          sub={recipient ? `To ${recipient.display_name ?? "this user"}` : undefined}
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

  return (
    <AppLayout>
      <PageHeader
        title="Send a gift"
        sub={
          recipient
            ? `To ${recipient.display_name ?? "this user"}`
            : "Pick a recipient from a chat or profile to enable sending."
        }
      />

      {/* Eligibility banner */}
      {loading ? (
        <div className="text-sm text-muted-foreground mb-6">Checking eligibility…</div>
      ) : eligibility?.eligible ? (
        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
          <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium">You're eligible to send gifts</div>
            <div className="text-muted-foreground mt-0.5">
              {eligibility.trust?.badge_count ?? 0} trust badge
              {(eligibility.trust?.badge_count ?? 0) === 1 ? "" : "s"} active
              {eligibility.trust?.concierge_verified ? " · Concierge Verified" : ""}.
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-destructive mt-0.5" />
          <div className="text-sm flex-1">
            <div className="font-medium">Gift sending is currently disabled</div>
            <ul className="mt-1 text-muted-foreground list-disc pl-5 space-y-0.5">
              {(eligibility?.reasons ?? ["Eligibility check failed."]).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <Button asChild size="sm" variant="outline" className="mt-3">
              <Link to="/verification">Get verified</Link>
            </Button>
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
          title="No recipient selected"
          body="Open a chat or profile and choose 'Send a gift' to start."
        />
      )}

      {recipientId && (
        <div className="space-y-6">
          <Tabs value={kind} onValueChange={(v) => setKind(v as "virtual" | "physical")}>
            <TabsList>
              <TabsTrigger value="virtual">
                <Sparkles className="h-4 w-4 mr-1" /> Virtual
              </TabsTrigger>
              <TabsTrigger value="physical">
                <Package className="h-4 w-4 mr-1" /> Physical
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
                Physical gifts are processed by our concierge team after payment confirmation.
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
            <label className="text-sm font-medium block mb-1">Message (optional)</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="A short note to send with the gift…"
              rows={3}
              maxLength={500}
              disabled={!eligibility?.eligible || recipientEligible === false || isBlocked}
            />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="text-sm text-muted-foreground">
              {selected ? (
                <>
                  Selected: <span className="font-medium text-foreground">{selected.name}</span>
                  {kind === "virtual" && (
                    <> · {selected.credit_cost} credits</>
                  )}
                </>
              ) : (
                "Pick a gift to continue"
              )}
            </div>
            <Button onClick={handleSend} disabled={!canSend}>
              {sending
                ? "Sending…"
                : kind === "virtual"
                  ? "Send virtual gift"
                  : "Place physical gift order"}
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
  if (gifts.length === 0) {
    return <div className="text-sm text-muted-foreground">No gifts available.</div>;
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
                {kind === "virtual" ? `${g.credit_cost} cr` : "Physical"}
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
  recipient: any;
  eligible: boolean | null;
  trust: TrustState | null;
  aBlocksB: boolean;
  bBlocksA: boolean;
}) {
  const blocked = aBlocksB || bBlocksA;
  const ok = eligible === true && !blocked;

  const reasons: string[] = [];
  if (aBlocksB) reasons.push("You have blocked this user. Unblock them to send a gift.");
  if (bBlocksA) reasons.push("This user has blocked you.");
  if (eligible === false) {
    if (trust?.account_status && trust.account_status !== "active") {
      reasons.push(`Recipient account is ${trust.account_status}.`);
    }
    if ((trust?.badge_count ?? 0) < 1) {
      reasons.push("Recipient has no active trust badge yet.");
    }
    if ((trust?.recent_severe_flags ?? 0) > 0) {
      reasons.push("Recipient has recent serious moderation flags.");
    }
    if (reasons.length === 0) reasons.push("Recipient is not eligible to receive gifts right now.");
  }

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
            Recipient status
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
              {eligible ? "Eligible to receive gifts" : "Not eligible"}
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
              {blocked ? "Blocked" : "No blocks"}
            </Badge>
            {trust && (
              <Badge variant="outline" className="text-xs">
                {trust.badge_count} trust badge{trust.badge_count === 1 ? "" : "s"}
                {trust.concierge_verified ? " · Concierge" : ""}
              </Badge>
            )}
            {trust?.account_status && (
              <Badge variant="outline" className="text-xs">
                Account: {trust.account_status}
              </Badge>
            )}
          </div>

          {reasons.length > 0 && (
            <ul className="mt-3 text-muted-foreground list-disc pl-5 space-y-0.5">
              {reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}

          <div className="mt-2 text-[11px] text-muted-foreground">
            Server-verified via <code>is_eligible_for_gifting</code> and{" "}
            <code>is_blocked_between</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
