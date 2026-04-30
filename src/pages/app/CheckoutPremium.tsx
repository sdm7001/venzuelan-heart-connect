import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ChevronLeft, Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, PRICE_IDS } from "@/lib/stripe";
import { StripeEmbeddedCheckoutForm } from "@/components/payments/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/payments/PaymentTestModeBanner";
import { toast } from "sonner";

const PREMIUM_FEATURES = [
  "Unlimited contacts every month",
  "Top priority placement in search",
  "Concierge verification eligibility",
  "Send virtual gifts without limits",
  "Priority support from our team",
];

export default function CheckoutPremium() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasActive, setHasActive] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth?redirect=/checkout/premium", { replace: true });
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("tier, status")
        .eq("user_id", user.id)
        .eq("environment", getStripeEnvironment())
        .in("status", ["active", "trialing", "past_due"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setHasActive(true);
        toast.message("You already have an active subscription. Manage it from Pricing.");
      }
      setChecking(false);
    })();
  }, [user, authLoading, navigate]);

  if (authLoading || checking) {
    return (
      <main className="min-h-screen grid place-items-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <>
      <PaymentTestModeBanner />
      <main className="min-h-screen bg-muted/30">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link
              to="/pricing"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to plans
            </Link>
            <div className="inline-flex items-center text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              Secure checkout
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
          {/* Mobile order summary (collapsible card) */}
          <section className="md:hidden mb-6">
            <SummaryCard compact />
          </section>

          <div className="grid md:grid-cols-[1fr_minmax(0,360px)] gap-8">
            {/* Checkout form */}
            <section className="order-2 md:order-1">
              <header className="mb-5">
                <h1 className="text-2xl md:text-3xl font-display font-semibold text-burgundy">
                  Complete your purchase
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your payment details below. You can cancel anytime.
                </p>
              </header>

              {hasActive ? (
                <div className="rounded-lg border bg-card p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    You already have an active subscription.
                  </p>
                  <Button onClick={() => navigate("/pricing")}>Go to Pricing</Button>
                </div>
              ) : (
                <div className="rounded-lg border bg-card p-3 sm:p-4">
                  <StripeEmbeddedCheckoutForm
                    priceId={PRICE_IDS.premium}
                    customerEmail={user?.email ?? undefined}
                    userId={user?.id}
                  />
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                By completing this purchase you agree to our{" "}
                <Link to="/legal/terms" className="underline">Terms</Link>,{" "}
                <Link to="/legal/privacy" className="underline">Privacy Policy</Link>, and{" "}
                <Link to="/legal/refunds" className="underline">Refund Policy</Link>.
              </p>
            </section>

            {/* Desktop order summary */}
            <aside className="order-1 md:order-2 hidden md:block">
              <div className="sticky top-20">
                <SummaryCard />
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

function SummaryCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="p-5 bg-gradient-to-br from-burgundy/5 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <Badge className="gap-1">
            <Sparkles className="h-3 w-3" />
            Premium
          </Badge>
          <span className="text-xs text-muted-foreground">Monthly</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-display font-semibold">$199</span>
          <span className="text-sm text-muted-foreground">/month</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Unlimited contacts. Cancel anytime.
        </p>
      </div>

      {!compact && (
        <>
          <Separator />
          <div className="p-5 space-y-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              What's included
            </p>
            <ul className="space-y-2 text-sm">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <Separator />
      <div className="p-5 space-y-2 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>$199.00</span>
        </div>
        <div className="flex items-center justify-between font-medium">
          <span>Total due today</span>
          <span>$199.00</span>
        </div>
      </div>

      <Separator />
      <div className="p-4 flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        Payments secured by Stripe. We never store your card details.
      </div>
    </div>
  );
}
