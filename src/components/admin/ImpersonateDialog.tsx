import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useImpersonation } from "@/auth/ImpersonationProvider";
import { Eye } from "lucide-react";

export function ImpersonateDialog({
  open, onOpenChange, target,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  target: { id: string; name: string } | null;
}) {
  const { start } = useImpersonation();
  const nav = useNavigate();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleStart() {
    if (!target) return;
    setBusy(true);
    try {
      await start(target, reason);
      toast.success("Impersonation session started — every action is audit-logged.");
      onOpenChange(false);
      setReason("");
      nav("/dashboard");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not start session");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setReason(""); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-warning" /> View as user
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              You are about to view the platform as <span className="font-semibold text-foreground">{target?.name ?? "—"}</span>.
            </span>
            <span className="block text-xs">
              This is a <strong>read-only</strong> view to reproduce issues. The session expires in 30 minutes.
              Both the start and end of this session are permanently recorded in the audit log with your identity, the target, and the reason below.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason (required, min. 10 characters)</Label>
          <Textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Reproducing report #123: user says photo upload fails on mobile."
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">{reason.trim().length}/500 — be specific. Auditors will read this.</p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleStart}
            disabled={busy || reason.trim().length < 10}
          >
            {busy ? "Starting…" : "Start session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
