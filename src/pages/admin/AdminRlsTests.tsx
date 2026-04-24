import { useState } from "react";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Play, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type CheckResult = { name: string; pass: boolean; detail: string };
type Resp = {
  summary?: { total: number; passed: number; failed: number };
  results?: CheckResult[];
  notes?: string[];
  error?: string;
};

export default function AdminRlsTests() {
  const [running, setRunning] = useState(false);
  const [resp, setResp] = useState<Resp | null>(null);

  async function run() {
    setRunning(true);
    setResp(null);
    const { data, error } = await supabase.functions.invoke("test-gift-rls", { body: {} });
    if (error) {
      setResp({ error: error.message });
    } else {
      setResp(data as Resp);
    }
    setRunning(false);
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="RLS automated checks"
        sub="Verifies gift_orders / gift_order_events read & insert policies against the live database using ephemeral test users."
        action={
          <Button onClick={run} disabled={running}>
            <Play className="h-4 w-4 mr-1" />
            {running ? "Running…" : "Run gift RLS tests"}
          </Button>
        }
      />

      {!resp && !running && (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Click "Run gift RLS tests" to execute. The harness creates 4 throwaway accounts,
          exercises each policy, and deletes everything afterward. Admin role required.
        </div>
      )}

      {resp?.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {resp.error}
        </div>
      )}

      {resp?.summary && (
        <>
          <div className="mb-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-muted px-3 py-1">
              Total: <b>{resp.summary.total}</b>
            </span>
            <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-3 py-1">
              Passed: <b>{resp.summary.passed}</b>
            </span>
            <span className={cn(
              "rounded-full px-3 py-1",
              resp.summary.failed === 0
                ? "bg-muted text-muted-foreground"
                : "bg-destructive/15 text-destructive"
            )}>
              Failed: <b>{resp.summary.failed}</b>
            </span>
          </div>

          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {resp.results?.map((r, i) => (
              <div key={i} className="p-4 flex items-start gap-3">
                {r.pass
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  : <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{r.name}</div>
                  {r.detail && (
                    <div className="text-xs text-muted-foreground mt-0.5 break-words">{r.detail}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {resp.notes && resp.notes.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium mb-2">
                <Info className="h-4 w-4" /> Notes
              </div>
              <ul className="space-y-1 list-disc pl-5">
                {resp.notes.map((n, i) => (<li key={i}>{n}</li>))}
              </ul>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
