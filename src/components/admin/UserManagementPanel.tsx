import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AccountStatus = Database["public"]["Enums"]["account_status"];
type BadgeKind = Database["public"]["Enums"]["trust_badge_kind"];

const STATUSES: AccountStatus[] = ["active", "restricted", "suspended", "banned", "pending_verification"];

// Badges admins can manually award/revoke. `email_confirmed` and `profile_complete`
// are system-driven and intentionally omitted from the manual toggle UI.
const MANAGEABLE_BADGES: { kind: BadgeKind; label: string; hint: string }[] = [
  { kind: "social_verified", label: "Social verified", hint: "Linked social account reviewed" },
  { kind: "photo_verified", label: "Photo verified", hint: "Selfie matches profile photos" },
  { kind: "id_verified", label: "ID verified", hint: "Government ID checked" },
  { kind: "income_verified", label: "Income verified", hint: "Income document reviewed" },
  { kind: "concierge_verified", label: "Concierge verified", hint: "High-trust concierge interview" },
];

type Pending =
  | { type: "status"; next: AccountStatus }
  | { type: "badge"; kind: BadgeKind; nextActive: boolean }
  | null;

export function UserManagementPanel({
  userId,
  currentStatus,
  onChanged,
}: {
  userId: string;
  currentStatus: AccountStatus;
  onChanged?: () => void;
}) {
  const { isAdmin, user: me } = useAuth();
  const [activeBadges, setActiveBadges] = useState<Set<BadgeKind>>(new Set());
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("trust_badges")
        .select("kind, revoked_at")
        .eq("user_id", userId)
        .is("revoked_at", null);
      if (!active) return;
      setActiveBadges(new Set((data ?? []).map((b) => b.kind as BadgeKind)));
      setLoading(false);
    })();
    return () => { active = false; };
  }, [userId]);

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Account &amp; verification</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Read-only. Only admins can change account status or toggle verification badges.
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[...activeBadges].map((b) => <Badge key={b} variant="secondary">{b}</Badge>)}
            {activeBadges.size === 0 && <span className="text-xs">No active badges.</span>}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isSelf = me?.id === userId;

  function openStatus(next: AccountStatus) {
    if (next === currentStatus) return;
    setNote("");
    setPending({ type: "status", next });
  }
  function openBadge(kind: BadgeKind, nextActive: boolean) {
    setNote("");
    setPending({ type: "badge", kind, nextActive });
  }

  async function confirm() {
    if (!pending || !me) return;
    if (note.trim().length < 4) {
      toast.error("Please add a short note (min 4 characters) for the audit trail.");
      return;
    }
    setWorking(true);
    try {
      if (pending.type === "status") {
        const { error } = await supabase
          .from("profiles")
          .update({ account_status: pending.next })
          .eq("id", userId);
        if (error) throw error;
        await supabase.from("audit_events").insert({
          actor_id: me.id,
          subject_id: userId,
          category: "moderation",
          action: "account_status_changed",
          metadata: { from: currentStatus, to: pending.next, note: note.trim() },
        });
        toast.success(`Status set to ${pending.next}`);
      } else {
        if (pending.nextActive) {
          // Award (or un-revoke) — unique on (user_id, kind), so upsert by reviving.
          const { error } = await supabase
            .from("trust_badges")
            .upsert(
              {
                user_id: userId,
                kind: pending.kind,
                awarded_by: me.id,
                awarded_at: new Date().toISOString(),
                revoked_at: null,
                revoked_reason: null,
                metadata: { manual: true, note: note.trim() },
              },
              { onConflict: "user_id,kind" },
            );
          if (error) throw error;
          await supabase.from("audit_events").insert({
            actor_id: me.id,
            subject_id: userId,
            category: "verification",
            action: "badge_awarded_manual",
            metadata: { badge_kind: pending.kind, note: note.trim() },
          });
          setActiveBadges((s) => new Set(s).add(pending.kind));
          toast.success(`Awarded ${pending.kind}`);
        } else {
          const { error } = await supabase
            .from("trust_badges")
            .update({ revoked_at: new Date().toISOString(), revoked_reason: note.trim() })
            .eq("user_id", userId)
            .eq("kind", pending.kind)
            .is("revoked_at", null);
          if (error) throw error;
          await supabase.from("audit_events").insert({
            actor_id: me.id,
            subject_id: userId,
            category: "verification",
            action: "badge_revoked_manual",
            metadata: { badge_kind: pending.kind, note: note.trim() },
          });
          setActiveBadges((s) => {
            const next = new Set(s); next.delete(pending.kind); return next;
          });
          toast.success(`Revoked ${pending.kind}`);
        }
      }
      onChanged?.();
      setPending(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    } finally {
      setWorking(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <CardTitle className="text-base">Account &amp; verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2 sm:grid-cols-[200px_1fr] sm:items-center">
          <Label htmlFor="account-status" className="text-sm">Account status</Label>
          <div className="flex items-center gap-2">
            <Select
              value={currentStatus}
              onValueChange={(v) => openStatus(v as AccountStatus)}
              disabled={isSelf}
            >
              <SelectTrigger id="account-status" className="w-[260px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {isSelf && <span className="text-xs text-muted-foreground">You can't change your own status.</span>}
          </div>
        </div>

        <div>
          <Label className="text-sm">Verification badges</Label>
          <p className="mb-3 text-xs text-muted-foreground">
            Toggling a badge writes an audit entry and recomputes the member's trust score.
          </p>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading badges…
            </div>
          ) : (
            <div className="space-y-2">
              {MANAGEABLE_BADGES.map((b) => {
                const on = activeBadges.has(b.kind);
                return (
                  <div key={b.kind} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <div>
                      <div className="text-sm font-medium">{b.label}</div>
                      <div className="text-xs text-muted-foreground">{b.hint}</div>
                    </div>
                    <Switch checked={on} onCheckedChange={(v) => openBadge(b.kind, v)} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && !working && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.type === "status"
                ? `Change status to "${pending.next}"?`
                : pending?.type === "badge"
                  ? `${pending.nextActive ? "Award" : "Revoke"} ${pending.kind}?`
                  : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action is logged in the audit trail with your account as the actor.
              A short note is required.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="admin-note" className="text-xs">Note (required, min 4 chars)</Label>
            <Textarea
              id="admin-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why are you making this change?"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirm(); }} disabled={working}>
              {working ? <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Working…</> : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
