import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, MailMinus, ShieldAlert } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";
import { supabase } from "@/integrations/supabase/client";

type State =
  | { kind: "loading" }
  | { kind: "valid" }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "submitting" }
  | { kind: "done" }
  | { kind: "error"; message: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { lang } = useI18n();
  const isEs = lang === "es";
  const [state, setState] = useState<State>({ kind: "loading" });

  useSeo(
    {
      title: isEs ? "Cancelar suscripción" : "Unsubscribe",
      description: isEs
        ? "Confirma que quieres dejar de recibir correos de MatchVenezuelan."
        : "Confirm that you want to stop receiving emails from MatchVenezuelan.",
      lang: isEs ? "es" : "en",
      robots: "noindex,follow",
    },
    [isEs],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setState({ kind: "invalid" });
        return;
      }
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } },
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.status === 404) {
          setState({ kind: "invalid" });
          return;
        }
        if (data?.reason === "already_unsubscribed") {
          setState({ kind: "already" });
          return;
        }
        if (data?.valid) {
          setState({ kind: "valid" });
          return;
        }
        setState({ kind: "invalid" });
      } catch {
        if (!cancelled) {
          setState({
            kind: "error",
            message: isEs ? "No se pudo validar el enlace." : "Could not validate the link.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, isEs]);

  const onConfirm = async () => {
    setState({ kind: "submitting" });
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success || data?.reason === "already_unsubscribed") {
        setState({ kind: "done" });
      } else {
        setState({
          kind: "error",
          message: isEs ? "No se pudo procesar la solicitud." : "Could not process the request.",
        });
      }
    } catch {
      setState({
        kind: "error",
        message: isEs ? "No se pudo procesar la solicitud." : "Could not process the request.",
      });
    }
  };

  const t = isEs
    ? {
        title: "Cancelar suscripción",
        sub: "Confirma para dejar de recibir correos de MatchVenezuelan en esta dirección.",
        confirm: "Confirmar cancelación",
        loading: "Validando enlace…",
        already: "Esta dirección ya está dada de baja. No recibirás más correos.",
        invalid: "Este enlace no es válido o ha expirado.",
        done: "Listo. Has sido dado de baja de nuestros correos.",
        note: "Los correos esenciales relacionados con tu cuenta seguirán enviándose.",
      }
    : {
        title: "Unsubscribe",
        sub: "Confirm to stop receiving emails from MatchVenezuelan at this address.",
        confirm: "Confirm unsubscribe",
        loading: "Validating link…",
        already: "This address is already unsubscribed. You won’t receive more emails.",
        invalid: "This link is invalid or has expired.",
        done: "Done. You’ve been unsubscribed from our emails.",
        note: "Essential account-related emails will still be sent.",
      };

  return (
    <PublicLayout>
      <section className="container max-w-xl py-16 md:py-24">
        <div className="rounded-2xl border border-border bg-card/70 p-6 sm:p-8 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-burgundy">
              <MailMinus className="h-5 w-5" aria-hidden />
            </span>
            <h1 className="font-display text-2xl font-semibold text-burgundy">{t.title}</h1>
          </div>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">{t.sub}</p>

          <div className="mt-6">
            {state.kind === "loading" && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {t.loading}
              </p>
            )}

            {state.kind === "valid" && (
              <Button onClick={onConfirm} size="lg">
                {t.confirm}
              </Button>
            )}

            {state.kind === "submitting" && (
              <Button disabled size="lg">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> {t.confirm}
              </Button>
            )}

            {state.kind === "done" && (
              <p className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--gold))]" aria-hidden /> {t.done}
              </p>
            )}

            {state.kind === "already" && (
              <p className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--gold))]" aria-hidden /> {t.already}
              </p>
            )}

            {state.kind === "invalid" && (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <ShieldAlert className="h-5 w-5" aria-hidden /> {t.invalid}
              </p>
            )}

            {state.kind === "error" && (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <ShieldAlert className="h-5 w-5" aria-hidden /> {state.message}
              </p>
            )}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">{t.note}</p>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Unsubscribe;
