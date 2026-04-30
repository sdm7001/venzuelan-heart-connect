import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Loader2, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, PRICE_IDS } from "@/lib/stripe";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { PaymentTestModeBanner } from "@/components/payments/PaymentTestModeBanner";
import { toast } from "sonner";

type Tier = "level_1" | "level_2" | "premium";

const PLANS: Array<{
  tier: Tier;
  name: string;
  priceLabel: string;
  priceId: string;
  blurb: string;
  features: string[];
  highlight?: boolean;
}> = [
  {
    tier: "level_1",
    name: "Level 1",
    priceLabel: "$59",
    priceId: PRICE_IDS.level_1,
    blurb: "Get started",
    features: ["Up to 10 contacts per month", "Full search & filters", "Send virtual gifts"],
  },
  {
    tier: "level_2",
    name: "Level 2",
    priceLabel: "$99",
    priceId: PRICE_IDS.level_2,
    blurb: "Most popular",
    features: ["Up to 30 contacts per month", "Priority placement in search", "Send virtual gifts"],
    highlight: true,
  },
  {
    tier: "premium",
    name: "Premium",
    priceLabel: "$199",
    priceId: PRICE_IDS.premium,
    blurb: "Unlimited",
    features: ["Unlimited contacts", "Top priority visibility", "Concierge upgrade eligibility"],
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTier, setCurrentTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(false);
  const { openCheckout, checkoutElement, isOpen, closeCheckout } = useStripeCheckout();

  useEffect(() => {
    if (!user) return;
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
      if (data) setCurrentTier(data.tier as Tier);
    })();
  }, [user]);

  async function handleManage() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          returnUrl: `${window.location.origin}/billing`,
          environment: getStripeEnvironment(),
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Could not open portal");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(tier: Tier, priceId: string) {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    if (currentTier) {
      toast.message("You already have an active subscription. Use Manage Subscription to change plans.");
      return;
    }
    if (tier === "premium") {
      navigate("/checkout/premium");
      return;
    }
    openCheckout({
      priceId,
      customerEmail: user.email ?? undefined,
      userId: user.id,
    });
  }

  return (
    <>
      <PaymentTestModeBanner />
      <main className="min-h-screen bg-muted/30 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <header className="text-center mb-10 space-y-3">
            <h1 className="text-3xl md:text-4xl font-display font-semibold text-burgundy">Membership for men</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Women always join free. Choose the plan that matches how actively you'd like to connect.
            </p>
            {currentTier && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Badge variant="secondary" className="capitalize">Current plan: {currentTier.replace("_", " ")}</Badge>
                <Button size="sm" variant="outline" onClick={handleManage} disabled={loading}>
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Settings className="h-3.5 w-3.5" />}
                  <span className="ml-2">Manage subscription</span>
                </Button>
              </div>
            )}
          </header>

          {isOpen ? (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Complete your purchase</CardTitle>
                <Button variant="ghost" size="sm" onClick={closeCheckout}>Cancel</Button>
              </CardHeader>
              <CardContent>{checkoutElement}</CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-5">
              {PLANS.map((p) => {
                const isCurrent = currentTier === p.tier;
                return (
                  <Card key={p.tier} className={p.highlight ? "border-primary shadow-lg" : ""}>
                    <CardHeader className="space-y-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{p.name}</CardTitle>
                        {p.highlight && <Badge>Popular</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{p.blurb}</p>
                      <div className="pt-2">
                        <span className="text-3xl font-display font-semibold">{p.priceLabel}</span>
                        <span className="text-muted-foreground"> /month</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2 text-sm">
                        {p.features.map((f) => (
                          <li key={f} className="flex gap-2"><Check className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />{f}</li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={p.highlight ? "default" : "outline"}
                        disabled={isCurrent}
                        onClick={() => handleSelect(p.tier, p.priceId)}
                      >
                        {isCurrent ? "Current plan" : currentTier ? "Change in portal" : "Choose plan"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground mt-8">
            Secure payments by Stripe. Cancel anytime — keep access until the end of your billing period. <Link to="/legal/refunds" className="underline">Refund policy</Link>
          </p>
        </div>
      </main>
    </>
  );
}
