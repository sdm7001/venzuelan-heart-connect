import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Heart, MapPin, ShieldCheck, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";

type Sample = {
  name: string;
  age: number;
  city: string;
  country: string;
  bio_en: string;
  bio_es: string;
  verified: boolean;
  initials: string;
  hue: number;
};

const SAMPLE_FEMALE: Sample[] = [
  { name: "Valentina", age: 27, city: "Caracas", country: "Venezuela", bio_en: "Pediatric nurse who loves family dinners, salsa nights, and hiking El Ávila on weekends.", bio_es: "Enfermera pediátrica que ama las cenas familiares, las noches de salsa y caminar El Ávila los fines de semana.", verified: true, initials: "V", hue: 340 },
  { name: "Camila", age: 31, city: "Madrid", country: "Spain", bio_en: "Bilingual marketing consultant. Looking for a partner with values, humor, and a love of travel.", bio_es: "Consultora de marketing bilingüe. Busco un compañero con valores, humor y amor por viajar.", verified: true, initials: "C", hue: 12 },
  { name: "Isabela", age: 24, city: "Miami", country: "USA", bio_en: "Architecture student, daughter of two, deeply close to my family. Faith and kindness matter to me.", bio_es: "Estudiante de arquitectura, hija de dos, muy unida a mi familia. La fe y la bondad me importan.", verified: false, initials: "I", hue: 290 },
  { name: "Andreína", age: 35, city: "Santiago", country: "Chile", bio_en: "Mother of one. Calm, honest, and ready for a serious relationship that grows into marriage.", bio_es: "Madre de uno. Tranquila, honesta y lista para una relación seria que crezca hacia el matrimonio.", verified: true, initials: "A", hue: 200 },
  { name: "Daniela", age: 29, city: "Bogotá", country: "Colombia", bio_en: "Dental hygienist. Coffee in the morning, beach on Sundays, partner for life.", bio_es: "Higienista dental. Café por la mañana, playa los domingos, pareja para toda la vida.", verified: true, initials: "D", hue: 25 },
  { name: "Mariana", age: 38, city: "Houston", country: "USA", bio_en: "Accountant, divorced, no children. Looking for a kind, mature gentleman who values family.", bio_es: "Contadora, divorciada, sin hijos. Busco un caballero amable y maduro que valore la familia.", verified: true, initials: "M", hue: 320 },
];

const SAMPLE_MALE: Sample[] = [
  { name: "Diego", age: 33, city: "Buenos Aires", country: "Argentina", bio_en: "Civil engineer. Family-oriented, honest, and looking for a serious partner.", bio_es: "Ingeniero civil. Orientado a la familia, honesto y buscando una pareja seria.", verified: true, initials: "D", hue: 220 },
  { name: "Carlos", age: 41, city: "Madrid", country: "Spain", bio_en: "Restaurant owner. Two kids. Looking for a kind, mature woman to share life with.", bio_es: "Dueño de restaurante. Dos hijos. Busco una mujer amable y madura para compartir la vida.", verified: true, initials: "C", hue: 15 },
  { name: "Andrés", age: 28, city: "Caracas", country: "Venezuela", bio_en: "Doctor in residency. Calm, warm, faithful. Ready for marriage when the right person arrives.", bio_es: "Médico en residencia. Tranquilo, cariñoso, fiel. Listo para el matrimonio cuando llegue la persona correcta.", verified: false, initials: "A", hue: 180 },
];

function ageInRange(age: number, range: string) {
  if (range === "55+") return age >= 55;
  const [a, b] = range.split("-").map(Number);
  return age >= a && age <= b;
}

export default function PreviewMatches() {
  const [params] = useSearchParams();
  const { lang } = useI18n();
  const isEs = lang === "es";

  const seeking = params.get("seeking") || "female";
  const age = params.get("age") || "25-34";
  const intention = params.get("intention") || "serious";

  useSeo(
    {
      title: isEs
        ? "Vista previa de coincidencias — MatchVenezuelan"
        : "Preview your matches — MatchVenezuelan",
      description: isEs
        ? "Una vista previa gratuita de perfiles que coinciden con tu búsqueda. Crea una cuenta para conectar."
        : "A free preview of profiles matching your search. Create an account to connect.",
      path: isEs ? "/es/preview" : "/preview",
      lang,
      type: "website",
    },
    [lang],
  );

  const pool = seeking === "male" ? SAMPLE_MALE : SAMPLE_FEMALE;
  const matches = useMemo(() => pool.filter((p) => ageInRange(p.age, age)), [pool, age]);

  const intentionLabel = isEs
    ? { serious: "Relación seria", marriage: "Matrimonio", longterm: "Largo plazo", friendship: "Amistad primero" }[intention] ?? intention
    : { serious: "Serious relationship", marriage: "Marriage", longterm: "Long-term partnership", friendship: "Friendship first" }[intention] ?? intention;

  return (
    <PublicLayout>
      <section className="container py-section">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-medium text-burgundy">
            <Sparkles className="h-3.5 w-3.5" />
            {isEs ? "Vista previa gratuita" : "Free preview"}
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold text-burgundy md:text-5xl text-balance">
            {isEs ? "Tus coincidencias" : "Your matches"}
          </h1>
          <p className="mt-4 text-muted-foreground">
            {isEs
              ? "Mostrando perfiles de muestra basados en tu búsqueda. Crea una cuenta gratuita para ver perfiles reales verificados y enviar mensajes."
              : "Showing sample profiles based on your search. Create a free account to view real verified profiles and start a conversation."}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">
              {isEs ? "Buscando: " : "Seeking: "}
              {seeking === "male" ? (isEs ? "hombres" : "men") : isEs ? "mujeres" : "women"}
            </Badge>
            <Badge variant="secondary">{isEs ? "Edad: " : "Age: "}{age}</Badge>
            <Badge variant="secondary">{intentionLabel}</Badge>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="mx-auto mt-block max-w-md rounded-2xl border border-border bg-card p-card text-center shadow-card">
            <p className="text-muted-foreground">
              {isEs
                ? "No hay perfiles de muestra para este rango. Ajusta tus filtros o crea una cuenta para explorar todos los perfiles."
                : "No sample profiles for this range. Adjust your filters or create an account to explore all profiles."}
            </p>
            <Button asChild variant="romance" className="mt-5">
              <Link to="/auth?mode=join">{isEs ? "Crear cuenta gratis" : "Create free account"}</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-block grid gap-stack sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m, idx) => (
              <MatchCard key={`${m.name}-${idx}`} m={m} blurred={idx >= 3} isEs={isEs} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-block rounded-3xl gradient-romance p-card text-center text-primary-foreground shadow-elegant sm:px-10 md:px-16">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl text-balance">
            {isEs ? "Conecta con tus coincidencias reales" : "Connect with your real matches"}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/90 sm:text-base">
            {isEs
              ? "Crea tu cuenta gratis para ver perfiles verificados, fotos completas y enviar mensajes."
              : "Create your free account to view verified profiles, full photos, and send messages."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth?mode=join">{isEs ? "Unirme gratis" : "Join free"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/how-it-works">{isEs ? "Cómo funciona" : "How it works"}</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function MatchCard({ m, blurred, isEs }: { m: Sample; blurred: boolean; isEs: boolean }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elegant">
      <div
        className="relative aspect-[4/5] w-full"
        style={{
          background: `linear-gradient(135deg, hsl(${m.hue} 70% 75%), hsl(${(m.hue + 30) % 360} 60% 60%))`,
        }}
      >
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-display text-7xl font-semibold text-white/90 drop-shadow">{m.initials}</span>
        </div>
        {m.verified && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-[10px] font-medium text-burgundy backdrop-blur">
            <ShieldCheck className="h-3 w-3 text-primary" />
            {isEs ? "Verificada" : "Verified"}
          </span>
        )}
        {blurred && (
          <div className="absolute inset-0 grid place-items-center bg-card/40 backdrop-blur-md">
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-card/95 px-4 py-3 text-center shadow-card">
              <Lock className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-foreground">
                {isEs ? "Crea cuenta para ver" : "Create account to view"}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-foreground">
            {m.name}, {m.age}
          </h3>
          <Heart className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {m.city}, {m.country}
        </div>
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
          {isEs ? m.bio_es : m.bio_en}
        </p>
      </div>
    </div>
  );
}
