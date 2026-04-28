import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2, Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface ReportMissingPageFormProps {
  brokenPath: string;
  language: "en" | "es";
}

const schema = z.object({
  email: z
    .string()
    .trim()
    .max(255, { message: "Email must be under 255 characters." })
    .email({ message: "Please enter a valid email address." })
    .optional()
    .or(z.literal("")),
  note: z
    .string()
    .trim()
    .max(1000, { message: "Note must be under 1000 characters." })
    .optional(),
});

type Status = "idle" | "submitting" | "success" | "error";

const COPY = {
  en: {
    title: "Report this missing page",
    sub: "One click sends our team the broken path and your language. The note and email below are optional — leave them blank for a true one-click report.",
    emailLabel: "Your email (optional)",
    emailPlaceholder: "you@example.com",
    noteLabel: "What were you trying to find? (optional)",
    notePlaceholder: "e.g. I followed a link from a Google result for ‘safety verification’.",
    submit: "Send report",
    sending: "Sending…",
    success: "Thanks — your report was sent. We’ll take a look.",
    error: "We couldn’t send your report just now. Please try again in a moment.",
    privacy: "We use your report only to fix the broken page. Your email, if provided, is used only to reply.",
  },
  es: {
    title: "Reportar esta página faltante",
    sub: "Con un clic enviamos a nuestro equipo la ruta rota y tu idioma. La nota y el correo son opcionales — déjalos vacíos para un reporte con un solo clic.",
    emailLabel: "Tu correo (opcional)",
    emailPlaceholder: "tu@ejemplo.com",
    noteLabel: "¿Qué estabas buscando? (opcional)",
    notePlaceholder: "Ej. Seguí un enlace de Google sobre ‘verificación de seguridad’.",
    submit: "Enviar reporte",
    sending: "Enviando…",
    success: "Gracias — tu reporte fue enviado. Lo revisaremos.",
    error: "No pudimos enviar tu reporte ahora. Inténtalo de nuevo en un momento.",
    privacy: "Usamos tu reporte solo para arreglar la página rota. Tu correo, si lo dejas, se usa solo para responder.",
  },
} as const;

export const ReportMissingPageForm = ({ brokenPath, language }: ReportMissingPageFormProps) => {
  const t = COPY[language];
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "submitting") return;

    setErrorMsg(null);
    const parsed = schema.safeParse({ email, note });
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? t.error;
      setErrorMsg(first);
      setStatus("error");
      return;
    }

    setStatus("submitting");

    const cleanEmail = parsed.data.email?.trim() || undefined;
    const cleanNote = parsed.data.note?.trim() || undefined;

    // Idempotency: one logical report per (path + session minute + email/note hash-ish)
    const idempotencyKey = `404-report-${btoa(unescape(encodeURIComponent(brokenPath))).slice(0, 24)}-${Math.floor(
      Date.now() / 60_000,
    )}`;

    const referrer =
      typeof document !== "undefined" && document.referrer ? document.referrer : "(direct or unknown)";
    const userAgent =
      typeof navigator !== "undefined" && navigator.userAgent ? navigator.userAgent : "(unknown)";

    try {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "missing-page-report",
          // recipient is fixed in the template via `to`; pass team inbox explicitly too
          recipientEmail: "sdm7001@hotmail.com",
          idempotencyKey,
          templateData: {
            brokenPath,
            language,
            referrer,
            userAgent,
            reporterEmail: cleanEmail,
            note: cleanNote,
            reportedAt: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;
      setStatus("success");
      setEmail("");
      setNote("");
    } catch (err) {
      console.error("Failed to send 404 report", err);
      setStatus("error");
      setErrorMsg(t.error);
    }
  };

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-card/70 p-4"
      >
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--gold))]" aria-hidden />
        <p className="text-sm text-foreground">{t.success}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 rounded-2xl border border-border bg-card/70 p-4 sm:p-5"
      aria-label={t.title}
    >
      <h3 className="font-display text-base font-semibold text-burgundy">{t.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{t.sub}</p>

      <div className="mt-4 grid gap-3">
        <div>
          <label htmlFor="nf-report-email" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-burgundy">
            {t.emailLabel}
          </label>
          <Input
            id="nf-report-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={255}
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "submitting"}
          />
        </div>
        <div>
          <label htmlFor="nf-report-note" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-burgundy">
            {t.noteLabel}
          </label>
          <Textarea
            id="nf-report-note"
            rows={3}
            maxLength={1000}
            placeholder={t.notePlaceholder}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={status === "submitting"}
          />
        </div>
      </div>

      {status === "error" && errorMsg ? (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{errorMsg}</span>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={status === "submitting"}>
          {status === "submitting" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              {t.sending}
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" aria-hidden />
              {t.submit}
            </>
          )}
        </Button>
        <p className="text-[11px] text-muted-foreground">{t.privacy}</p>
      </div>
    </form>
  );
};

export default ReportMissingPageForm;
