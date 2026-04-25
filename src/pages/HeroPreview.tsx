import opt1 from "@/assets/hero-option-1.jpg";
import opt2 from "@/assets/hero-option-2.jpg";
import opt3 from "@/assets/hero-option-3.jpg";
import opt4 from "@/assets/hero-option-4.jpg";

const options = [
  { id: 1, src: opt1, label: "Option 1 — Salt & pepper beard, no glasses" },
  { id: 2, src: opt2, label: "Option 2 — Silver hair, clean-shaven" },
  { id: 3, src: opt3, label: "Option 3 — Gray beard, palm trees" },
  { id: 4, src: opt4, label: "Option 4 — Bald with gray beard" },
];

export default function HeroPreview() {
  return (
    <main className="container py-10">
      <h1 className="font-display text-3xl font-semibold mb-6">Hero image options</h1>
      <p className="text-muted-foreground mb-8">Pick a number and tell me which to set as the live hero image.</p>
      <div className="grid gap-6 sm:grid-cols-2">
        {options.map((o) => (
          <figure key={o.id} className="rounded-2xl overflow-hidden border border-border bg-card shadow-card">
            <img src={o.src} alt={o.label} className="w-full h-auto object-cover" />
            <figcaption className="p-3 text-sm font-medium">{o.label}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
