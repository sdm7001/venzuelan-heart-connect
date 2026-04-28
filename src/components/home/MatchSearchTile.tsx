import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/i18n/I18nProvider";

export default function MatchSearchTile() {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const isEs = lang === "es";

  const [seeking, setSeeking] = useState("female");
  const [ageRange, setAgeRange] = useState("25-34");
  const [intention, setIntention] = useState("serious");

  const t = {
    title: isEs ? "Encuentra tu pareja" : "Find your match",
    sub: isEs
      ? "Vista previa gratuita — sin registro requerido."
      : "Free preview — no signup required.",
    seeking: isEs ? "Busco" : "I'm seeking",
    female: isEs ? "Una mujer" : "A woman",
    male: isEs ? "Un hombre" : "A man",
    age: isEs ? "Rango de edad" : "Age range",
    intention: isEs ? "Tipo de relación" : "Relationship type",
    serious: isEs ? "Relación seria" : "Serious relationship",
    marriage: isEs ? "Matrimonio" : "Marriage",
    friendship: isEs ? "Amistad primero" : "Friendship first",
    longterm: isEs ? "Largo plazo" : "Long-term partnership",
    cta: isEs ? "Ver coincidencias" : "See matches",
  };

  const ageRanges = ["18-24", "25-34", "35-44", "45-54", "55+"];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ seeking, age: ageRange, intention });
    navigate(`${isEs ? "/es" : ""}/preview?${params.toString()}`);
  }

  return (
    <section className="container -mt-10 relative z-10 pb-4">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-border bg-card/95 p-6 shadow-elegant backdrop-blur-md ring-1 ring-primary/10 md:p-8"
      >
        <div className="mb-5 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary">
            <Heart className="h-4 w-4" fill="currentColor" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-burgundy md:text-xl">{t.title}</h2>
            <p className="text-xs text-muted-foreground">{t.sub}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="seeking" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t.seeking}
            </Label>
            <Select value={seeking} onValueChange={setSeeking}>
              <SelectTrigger id="seeking"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="female">{t.female}</SelectItem>
                <SelectItem value="male">{t.male}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="age" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t.age}
            </Label>
            <Select value={ageRange} onValueChange={setAgeRange}>
              <SelectTrigger id="age"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ageRanges.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="intention" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t.intention}
            </Label>
            <Select value={intention} onValueChange={setIntention}>
              <SelectTrigger id="intention"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="serious">{t.serious}</SelectItem>
                <SelectItem value="marriage">{t.marriage}</SelectItem>
                <SelectItem value="longterm">{t.longterm}</SelectItem>
                <SelectItem value="friendship">{t.friendship}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" size="lg" variant="romance" className="gap-2">
            <Search className="h-4 w-4" />
            {t.cta}
          </Button>
        </div>
      </form>
    </section>
  );
}
