import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { getStripeEnvironment } from "@/lib/stripe";

export default function CheckoutReturn() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { user } = useAuth();
  const [tier, setTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    let attempts = 0;
    async function poll() {
      const { data } = await supabase
        .from("subscriptions")
        .select("tier, status")
        .eq("user_id", user!.id)
        .eq("environment", getStripeEnvironment())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (data?.status && ["active", "trialing"].includes(data.status as string)) {
        setTier(data.tier as string);
        setLoading(false);
        return;
      }
      if (attempts++ < 8) setTimeout(poll, 1500);
      else setLoading(false);
    }
    void poll();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <main className="min-h-screen grid place-items-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          {loading ? (
            <>
              <Loader2 className="h-10 w-10 mx-auto animate-spin text-muted-foreground" />
              <h1 className="text-2xl font-display font-semibold">Finalizing your subscription</h1>
              <p className="text-muted-foreground text-sm">
                We're confirming your payment with our billing provider. This usually takes a few seconds.
              </p>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-600" />
              <h1 className="text-2xl font-display font-semibold">Welcome aboard</h1>
              <p className="text-muted-foreground">
                {tier ? <>Your <strong className="capitalize">{tier.replace("_", " ")}</strong> membership is active.</> : <>Your payment was received.</>}
              </p>
              {sessionId && (
                <p className="text-xs text-muted-foreground/70 break-all">Reference: {sessionId}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button asChild className="flex-1"><Link to="/dashboard">Go to dashboard</Link></Button>
                <Button asChild variant="outline" className="flex-1"><Link to="/billing">View billing</Link></Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
