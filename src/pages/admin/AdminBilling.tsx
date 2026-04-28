import { useEffect, useState } from "react";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { getStripeEnvironment } from "@/lib/stripe";
import {
  AlertCircle, CheckCircle2, CreditCard, ExternalLink, Loader2, Receipt, RefreshCw,
  ShieldCheck, Webhook,
} from "lucide-react";
import { toast } from "sonner";

type Pricing = {
  id: string; name: string; description: string | null; active: boolean;
  prices: Array<{
    id: string; lookup_key: string | null; unit_amount: number | null;
    currency: string; interval: string | null; active: boolean;
  }>;
};

type Session = {
  id: string; created: number; status: string | null; payment_status: string | null;
  mode: string; amount_total: number | null; currency: string | null;
  customer_email: string | null; metadata: Record<string, string> | null;
};

type WebhookData = {
  expected_url: string | null;
  sandbox_secret_set: boolean;
  live_secret_set: boolean;
  endpoints: Array<{ id: string; url: string; status: string; enabled_events_count: number; created: number }>;
  recent_events: Array<{ event_type: string; created_at: string; metadata: Record<string, unknown> | null }>;
};

type GoLiveStep = { id: string; label: string; status: "complete" | "in_progress" | "action_required" | "locked" };

type Overview = {
  environment: "sandbox" | "live";
  is_admin: boolean;
  pricing: Pricing[];
  recent_sessions: Session[];
  webhook: WebhookData;
};

function fmtMoney(amount: number | null, currency: string | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency ?? "USD").toUpperCase(),
  }).format(amount / 100);
}
function fmtDateUnix(ts: number) {
  return new Date(ts * 1000).toLocaleString();
}
function fmtDate(s: string) {
  return new Date(s).toLocaleString();
}

export default function AdminBilling() {
  const { isAdmin } = useAuth();
  const env = getStripeEnvironment();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goLive, setGoLive] = useState<GoLiveStep[] | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: err } = await supabase.functions.invoke("admin-billing-overview", {
        body: { environment: env },
      });
      if (err) throw new Error(err.message);
      if (res?.error) throw new Error(res.error);
      setData(res as Overview);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  // Best-effort go-live status — the dedicated tool is server-side only, so we
  // infer from data we have plus visible secrets.
  useEffect(() => {
    if (!data) return;
    const hasLiveKeys = data.webhook.live_secret_set;
    const sandboxReady = data.webhook.sandbox_secret_set;
    setGoLive([
      { id: "claim", label: "Claim Stripe sandbox", status: sandboxReady ? "complete" : "in_progress" },
      { id: "verify", label: "Complete Stripe go-live verification", status: hasLiveKeys ? "complete" : "action_required" },
      { id: "install", label: "Install Lovable app on live account", status: hasLiveKeys ? "complete" : "locked" },
      { id: "keys", label: "Provision live API keys", status: hasLiveKeys ? "complete" : "locked" },
      { id: "ready", label: "Readiness check", status: hasLiveKeys ? "in_progress" : "locked" },
    ]);
  }, [data]);

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Billing"
        sub={`Pricing, checkout activity, go-live progress, and webhook health · environment: ${env}`}
      />

      <div className="flex items-center gap-2 mb-4">
        <Badge variant={env === "live" ? "default" : "secondary"}>{env === "live" ? "LIVE" : "TEST"}</Badge>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {error && (
        <Card className="border-destructive mb-4">
          <CardContent className="p-4 flex items-start gap-3 text-sm">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div><strong>Could not load billing data.</strong> {error}</div>
          </CardContent>
        </Card>
      )}

      {loading && !data && (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {data && (
        <Tabs defaultValue="pricing" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pricing"><CreditCard className="h-4 w-4 mr-1.5" />Pricing</TabsTrigger>
            <TabsTrigger value="sessions"><Receipt className="h-4 w-4 mr-1.5" />Checkout sessions</TabsTrigger>
            <TabsTrigger value="golive"><ShieldCheck className="h-4 w-4 mr-1.5" />Go-live</TabsTrigger>
            <TabsTrigger value="webhooks"><Webhook className="h-4 w-4 mr-1.5" />Webhooks</TabsTrigger>
          </TabsList>

          {/* PRICING */}
          <TabsContent value="pricing" className="space-y-3">
            {data.pricing.length === 0 ? (
              <EmptyState icon={<CreditCard className="h-5 w-5" />} title="No products found" body="Products haven't been created in this environment yet." />
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {data.pricing.map((p) => (
                  <Card key={p.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{p.name}</CardTitle>
                        <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Active" : "Archived"}</Badge>
                      </div>
                      {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {p.prices.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No prices.</p>
                      )}
                      {p.prices.map((pr) => (
                        <div key={pr.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                          <div>
                            <div className="font-medium">{fmtMoney(pr.unit_amount, pr.currency)}{pr.interval && <span className="text-muted-foreground"> /{pr.interval}</span>}</div>
                            {pr.lookup_key && <div className="text-[10px] text-muted-foreground font-mono">{pr.lookup_key}</div>}
                          </div>
                          <Badge variant={pr.active ? "outline" : "secondary"} className="text-[10px]">{pr.active ? "active" : "archived"}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Pricing is read-only. Edit prices in the Stripe dashboard; new prices auto-sync to the live environment when you publish.</p>
          </TabsContent>

          {/* SESSIONS */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader><CardTitle className="text-base">Recent checkout sessions</CardTitle></CardHeader>
              <CardContent>
                {data.recent_sessions.length === 0 ? (
                  <EmptyState icon={<Receipt className="h-5 w-5" />} title="No sessions yet" body="Checkout sessions will appear here once customers start a purchase." />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Created</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Plan</TableHead>
                          {isAdmin && <TableHead>Customer</TableHead>}
                          {isAdmin && <TableHead className="text-right">Amount</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.recent_sessions.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="text-xs whitespace-nowrap">{fmtDateUnix(s.created)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <Badge variant={s.status === "complete" ? "default" : "secondary"} className="w-fit text-[10px]">{s.status ?? "—"}</Badge>
                                {s.payment_status && <span className="text-[10px] text-muted-foreground">{s.payment_status}</span>}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{s.mode}</TableCell>
                            <TableCell className="text-xs font-mono">{s.metadata?.lovable_price_id ?? "—"}</TableCell>
                            {isAdmin && <TableCell className="text-xs">{s.customer_email ?? "—"}</TableCell>}
                            {isAdmin && <TableCell className="text-right text-xs">{fmtMoney(s.amount_total, s.currency)}</TableCell>}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
            {!isAdmin && (
              <p className="text-xs text-muted-foreground mt-2">Customer emails and amounts are visible to admins only.</p>
            )}
          </TabsContent>

          {/* GO-LIVE */}
          <TabsContent value="golive">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Stripe go-live progress</CardTitle>
                <p className="text-xs text-muted-foreground">Open the Payments tab in Lovable for the full step-by-step flow with deep links into Stripe.</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {(goLive ?? []).map((step, i) => (
                  <div key={step.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-muted text-xs font-medium">{i + 1}</span>
                      <span className="text-sm">{step.label}</span>
                    </div>
                    {step.status === "complete" && <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Complete</Badge>}
                    {step.status === "in_progress" && <Badge variant="secondary">In progress</Badge>}
                    {step.status === "action_required" && <Badge variant="destructive">Action required</Badge>}
                    {step.status === "locked" && <Badge variant="outline" className="text-muted-foreground">Locked</Badge>}
                  </div>
                ))}
                <Button size="sm" variant="outline" className="mt-2" onClick={() => toast.info("Open the Payments tab from the Lovable sidebar to continue go-live.")}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />How to go live
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WEBHOOKS */}
          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Webhook configuration</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid sm:grid-cols-2 gap-2">
                  <div className="border rounded-md p-3">
                    <div className="text-xs text-muted-foreground">Sandbox signing secret</div>
                    <div className="flex items-center gap-2 mt-1">
                      {data.webhook.sandbox_secret_set ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-destructive" />}
                      <span className="font-medium">{data.webhook.sandbox_secret_set ? "Configured" : "Missing"}</span>
                    </div>
                  </div>
                  <div className="border rounded-md p-3">
                    <div className="text-xs text-muted-foreground">Live signing secret</div>
                    <div className="flex items-center gap-2 mt-1">
                      {data.webhook.live_secret_set ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                      <span className="font-medium">{data.webhook.live_secret_set ? "Configured" : "Not yet (go-live needed)"}</span>
                    </div>
                  </div>
                </div>
                {data.webhook.expected_url && (
                  <div className="border rounded-md p-3">
                    <div className="text-xs text-muted-foreground">Endpoint URL ({env})</div>
                    <code className="block text-[11px] mt-1 break-all">{data.webhook.expected_url}</code>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Webhooks are managed automatically — there's nothing to configure here. Stripe deliveries are signed with the secret above and processed by the <code>payments-webhook</code> function.
                </p>
              </CardContent>
            </Card>

            {isAdmin && data.webhook.endpoints.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Registered Stripe endpoints</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>URL</TableHead><TableHead>Status</TableHead><TableHead>Events</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {data.webhook.endpoints.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-[11px] break-all">{e.url}</TableCell>
                          <TableCell><Badge variant={e.status === "enabled" ? "default" : "secondary"}>{e.status}</Badge></TableCell>
                          <TableCell className="text-xs">{e.enabled_events_count}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{fmtDateUnix(e.created)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="text-base">Recent billing events (last 20)</CardTitle></CardHeader>
              <CardContent>
                {data.webhook.recent_events.length === 0 ? (
                  <EmptyState icon={<Webhook className="h-5 w-5" />} title="No events yet" body="Webhook deliveries will appear here once customers complete checkouts or subscriptions renew." />
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Event</TableHead><TableHead>Detail</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {data.webhook.recent_events.map((e, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs whitespace-nowrap">{fmtDate(e.created_at)}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{e.event_type}</Badge></TableCell>
                          <TableCell className="text-[11px] text-muted-foreground font-mono truncate max-w-[420px]">
                            {e.metadata ? JSON.stringify(e.metadata) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </AdminLayout>
  );
}
