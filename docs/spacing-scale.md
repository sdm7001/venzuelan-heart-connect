# Spacing Scale Style Guide

MatchVenezuelan uses a **semantic spacing scale** defined in `src/index.css` and exposed as Tailwind-style utility classes. Use these utilities instead of ad-hoc values like `py-12`, `gap-4`, `p-6`, `mt-14`. They keep the rhythm consistent across marketing pages, the app, and the admin.

> Rule of thumb: if you're typing a raw `py-*`, `px-*`, `gap-*`, `mt-*`, `mb-*`, or `p-*` number on a layout-level element, stop and pick a token below.

---

## Token Reference

All values come from CSS variables in `:root` (`src/index.css`) and scale **responsively** at the `md` (≥768px) and `lg` (≥1024px) breakpoints — you do not need `md:` / `lg:` prefixes.

| Token        | CSS variable           | Mobile  | md (≥768) | lg (≥1024) | Purpose                                              |
|--------------|------------------------|---------|-----------|------------|------------------------------------------------------|
| **section**  | `--space-section`      | 3.5rem  | 5rem      | 7rem       | Vertical breathing between major page bands         |
| **block**    | `--space-block`        | 2rem    | 2.5rem    | 3rem       | Spacing between sub-sections inside a section        |
| **stack**    | `--space-stack`        | 1rem    | 1.25rem   | 1.5rem     | Gap between sibling cards / list items / form rows   |
| **card**     | `--space-card`         | 1.25rem | 1.75rem   | 2.25rem    | Inner padding of cards / panels / CTA banners        |
| **gutter**   | `--space-gutter`       | 1.25rem | 2rem      | 3rem       | Horizontal page padding (page edges)                 |

---

## Utility Classes

### Vertical rhythm — sections

| Class           | Effect                                              |
|-----------------|-----------------------------------------------------|
| `py-section`    | Top + bottom padding on a section band              |
| `pt-section`    | Top padding only                                    |
| `pb-section`    | Bottom padding only                                 |

### Vertical rhythm — blocks

| Class           | Effect                                              |
|-----------------|-----------------------------------------------------|
| `mt-block`      | Top margin between sub-sections                     |
| `mb-block`      | Bottom margin between sub-sections                  |
| `gap-block`     | Flex/grid gap between sub-sections                  |
| `space-y-block` | Vertical spacing between direct children           |

### Item rhythm — stacks

| Class           | Effect                                              |
|-----------------|-----------------------------------------------------|
| `gap-stack`     | Flex/grid gap between sibling cards / list items    |
| `space-y-stack` | Vertical spacing between direct children            |

### Inner padding

| Class           | Effect                                              |
|-----------------|-----------------------------------------------------|
| `p-card`        | Inner padding for cards, panels, CTA banners        |

### Horizontal page padding

| Class           | Effect                                              |
|-----------------|-----------------------------------------------------|
| `px-gutter`     | Left + right page gutter (use with `container`)     |

---

## When to use which

```
┌─────────────────────────────── py-section ───────────────────────────────┐
│  <section>                                                                │
│  ┌─── header ─────────────────────────────────────────────────────────┐  │
│  │  Eyebrow / Title / Subtitle                                         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                              ↕ mt-block                                    │
│  ┌─── grid (gap-stack) ───────────────────────────────────────────────┐  │
│  │  ┌── card (p-card) ──┐  ┌── card (p-card) ──┐  ┌── card ────────┐ │  │
│  │  │                   │  │                   │  │                │ │  │
│  │  └───────────────────┘  └───────────────────┘  └────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│  </section>                                                               │
└───────────────────────────────────────────────────────────────────────────┘
```

- **`py-section`** wraps the whole band. Use once per `<section>`.
- **`mt-block`** separates the section header from its content grid (or any two sub-sections).
- **`gap-stack`** sets the gap inside a grid/flex of sibling cards.
- **`gap-block`** sets the gap between *larger* sub-sections (e.g. two side-by-side feature areas, not individual cards).
- **`p-card`** is the inner padding of every card / panel / CTA box.
- **`px-gutter`** is the page's horizontal padding. Always pair with `container`.

---

## Canonical Patterns

### Marketing section with header + card grid

```tsx
<section className="container py-section px-gutter">
  <div className="mx-auto max-w-2xl text-center">
    <h1 className="font-display text-4xl font-semibold text-burgundy md:text-5xl text-balance">
      {title}
    </h1>
    <p className="mt-4 text-muted-foreground">{subtitle}</p>
  </div>

  <div className="mx-auto mt-block grid max-w-4xl gap-stack md:grid-cols-2">
    {items.map((it) => (
      <div key={it.id} className="rounded-2xl border border-border bg-card p-card shadow-card">
        {/* ... */}
      </div>
    ))}
  </div>
</section>
```

### Footer columns

```tsx
<footer className="mt-block border-t border-black/10">
  <div className="container py-section px-gutter">
    <div className="grid grid-cols-1 gap-stack sm:grid-cols-2 sm:gap-block md:grid-cols-4">
      {/* columns */}
    </div>
    <div className="mt-block border-t border-black/10 pt-6 text-xs">© ...</div>
  </div>
</footer>
```

### Stacked form / settings panel

```tsx
<div className="rounded-2xl border border-border bg-card p-card shadow-card">
  <div className="flex flex-col gap-stack">
    <Field />
    <Field />
    <Field />
  </div>
</div>
```

---

## Do / Don't

✅ **Do**
- Use the tokens for any layout spacing on pages, sections, cards, footers, headers.
- Combine `container` + `py-section` + `px-gutter` on every top-level marketing section.
- Use `gap-stack` for grids of sibling cards, `gap-block` between larger sub-sections.
- Trust the responsive scaling — don't add `md:py-20 lg:py-28` on top of `py-section`.

❌ **Don't**
- Don't write `py-12`, `py-16`, `py-20`, `gap-4`, `gap-6`, `gap-8`, `mt-10`, `p-6`, `px-4 md:px-8` on layout-level elements. Use a token.
- Don't override token classes with raw values to "tweak" one page. If a band genuinely needs different rhythm, propose a new token instead.
- Don't apply `p-card` to small inline elements like badges or buttons — it's for cards/panels/CTA banners.
- Don't nest `py-section` inside another `py-section` — only one per section band.

---

## Adding a new token

1. Add the CSS variables (mobile + `md` + `lg`) under `@layer base { :root { ... } }` in `src/index.css`.
2. Add the utility class (and its responsive overrides) under `@layer utilities` in the same file, following the existing pattern.
3. Document it in this file with a row in the token table and a "when to use" note.
4. Refactor at least one real usage site to consume it, so the token has a precedent.

Keep the scale **small**. New tokens should describe a *semantic role* (e.g. "form row gap"), not a one-off pixel value.
