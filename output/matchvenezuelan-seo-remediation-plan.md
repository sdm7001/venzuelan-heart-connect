# MatchVenezuelan — SEO/GEO Remediation Plan
**Date**: 2026-04-28 | **Source Audit**: 55.9/100 (F, CAUTION) | **Mode**: Planning Only — No Code Changes
**Total Issues Extracted**: 38 | **P0**: 4 | **P1**: 11 | **P2**: 17 | **P3**: 6

---

## Executive Summary

### Current State
MatchVenezuelan has a **well-structured landing page content program** (41 EN pages, 27 ES pages) but is undermined by **four foundational infrastructure failures** that may be preventing Google from indexing any of it. The site scores 55.9/100 (F) overall, with GEO/AI search readiness at 30/100 — near zero probability of being cited by ChatGPT, Perplexity, or Google AI Overviews.

### Biggest Risks (Do Not Wait)
1. **`_redirects` sitemap override (P0)** — The `public/sitemap.xml` with 41 landing pages is **never served to Google**. A Supabase edge function intercepts it. Its output is unknown. All landing page SEO work may be invisible.
2. **No SPA catch-all redirect (P0)** — No `/* /index.html 200` in `_redirects`. Every non-root URL may 404 for non-JS crawlers.
3. **1.5 MB hero + 1.48 MB logo (P0)** — LCP is critically over threshold on every page. Google actively suppresses pages with failed Core Web Vitals.
4. **Broken SearchAction schema (P1)** — Points to `/search` which does not exist. Generates Google Search Console errors.

### Biggest Opportunities
1. Landing page content is already well-structured — fixing the crawl/index pipeline alone could unlock significant ranking improvements.
2. GEO/AI readiness is at 30/100 — a few targeted fixes (DatingService schema, About page, named authors, sameAs) could make the site AI-citable within weeks.
3. Washington DC page has a genuinely unique diplomatic/political refugee angle that no competitor can replicate — one rewrite could be a standout page.
4. Bilingual coverage (27 ES pages) is a structural advantage — closing the remaining ES gaps (Madrid, dating-culture, travel pages) extends reach into Spanish-language AI search.

### What Should Happen First
**Do not scale traffic, run ad campaigns, or create new landing pages until Sprint 1 is complete.** If the sitemap edge function is omitting all 41 landing pages, you are optimizing for traffic to pages Google cannot find.

**Sprint 1 is the unlock.** Everything after Sprint 1 compounds. Nothing before Sprint 1 matters.

---

## Priority Overview

### P0 — Blocking (Fix before anything else)
| ID | Issue | Effort | Files |
|----|-------|--------|-------|
| I001 | Sitemap override — verify edge function; remove _redirects shadow if LPs missing | S | `public/_redirects` |
| I002 | SPA catch-all missing — direct URL access may 404 | S | `public/_redirects` |
| I003 | Hero image 1.5 MB JPEG — catastrophic LCP | S | `src/assets/hero-portrait.jpg` |
| I004 | Logo 1.48 MB PNG — LCP failure on all routes | S | `src/assets/logo.png` |

### P1 — High Priority (Sprint 1)
| ID | Issue | Effort | Files |
|----|-------|--------|-------|
| I006 | Relative canonical `href="/"` in index.html — invalid | S | `index.html` |
| I007 | Relative OG image `/logo.png` in index.html — broken social previews | S | `index.html` |
| I008 | hreflang default fallback falsely signals ES at EN-only URLs | S | `src/seo/seo.ts` |
| I009 | Broken SearchAction pointing to `/search` (non-existent) | S | `src/components/StructuredData.tsx` |
| I010 | Duplicate WebSite JSON-LD on homepage | S | `src/components/StructuredData.tsx`, `src/pages/Home.tsx` |
| I011 | Missing DatingService schema | M | `src/pages/Home.tsx` |
| I012 | Organization `sameAs: []` — no social links | S | `src/components/StructuredData.tsx` |
| I013 | No `/about` page — YMYL site with no company identity | M | `src/App.tsx`, new `About.tsx` |
| I014 | Anonymous blog authorship — all posts credited to Organization | M | `src/pages/ResourceDetail.tsx` |
| I015 | Missing `fetchPriority="high"` on homepage hero | S | `src/pages/Home.tsx` |
| I023 | Legal/HowItWorks EN-only pages use 3-hreflang fallback — batch with I008 | S | `src/seo/seo.ts` |

### P2 — Medium Priority (Sprint 2)
| ID | Issue | Effort |
|----|-------|--------|
| I016 | Footer has zero landing page links | S |
| I017 | Static `lang="en"` in index.html (pre-JS classification) | S |
| I018 | No `/es/recursos` route — Spanish blog index missing | M |
| I019 | FAQ/Safety/HowItWorks titles not keyword-targeted | S |
| I020 | Safety page ~150 words — thin YMYL content | M |
| I021 | HowItWorks ~200 words — thin content + heading hierarchy gap | M |
| I022 | Missing ES counterparts: Madrid; dating-culture; travel pages | M |
| I027 | No Vite code splitting — 1.4 MB single JS bundle | M |
| LP-F01 through LP-F08 | Landing page merges and rewrites | M each |

### P3 — Later (Sprint 3 or backlog)
| ID | Issue |
|----|-------|
| I022b | Secondary ES counterparts: Barcelona; Buenos Aires; Chicago; Atlanta |
| I024 | Blog pagination invisible to crawlers |
| I025 | Favicon/PWA manifest/theme-color missing |
| I026 | RSS feeds via Supabase edge function — unverified |
| I028 | HTML breadcrumb nav on landing pages |
| LP-F09, LP-F10 | Buenos Aires and Barcelona EU rewrites |

---

## Workstreams

### A. Technical SEO Infrastructure

**Current Problems:**
- `public/_redirects` intercepts `/sitemap.xml` with a Supabase edge function of unknown quality — hand-crafted sitemap with 41 landing pages may never reach Google
- No `/* /index.html 200` SPA catch-all — direct URL access may 404
- `index.html` has relative canonical (`href="/"`) and relative OG image (`content="/logo.png"`) — invalid for non-JS crawlers and social scrapers
- `seo.ts` default hreflang fallback maps `en + es + x-default` all to same URL — misinforms Google about non-existent ES pages on EN-only routes
- `StructuredData.tsx` SearchAction points to `/search` (does not exist in `App.tsx`)
- Duplicate WebSite JSON-LD (both `StructuredData.tsx` and `Home.tsx` emit it)
- Static `lang="en"` on `<html>` tag — all pages appear as EN pre-JS

**Desired End State:**
- Sitemap returns all 41+ landing page URLs when fetched
- All direct URLs return 200
- All canonicals are absolute in static HTML
- hreflang declares only `en + x-default` for EN-only pages and full bilingual alternates for paired pages
- No Search Console errors from structured data
- Single WebSite JSON-LD per page

**Sprint 1 Tasks (batch by file where possible):**

**Batch A-1 (`public/_redirects`):** Three changes in one file:
- Verify sitemap edge function output (fetch it); remove `/sitemap.xml` override line if LPs are missing
- Add `/* /index.html 200` as final catch-all

**Batch A-2 (`index.html`):** Two changes in one file:
- Fix canonical: `<link rel="canonical" href="https://matchvenezuelan.com/" />`
- Fix OG image: `<meta property="og:image" content="https://matchvenezuelan.com/og-image.webp" />`

**Batch A-3 (`src/seo/seo.ts` + `Legal.tsx` + `HowItWorks.tsx`):**
- Replace 3-hreflang default with `[{hreflang:'en', href:url}, {hreflang:'x-default', href:url}]`
- Ensure Legal, HowItWorks, Safety, Resources pages pass `alternates` explicitly

**Batch A-4 (`src/components/StructuredData.tsx`):**
- Fix SearchAction URL to `/resources?q={search_term_string}`
- Remove duplicate WebSite JSON-LD
- Add `sameAs` social links array

---

### B. Performance / Core Web Vitals

**Current Problems:**
- Homepage hero image: 1,546 KB JPEG — estimated mobile LCP 6-10 seconds (target: <2.5s)
- Logo: 1,482 KB PNG served on every page — drags LCP on all non-homepage routes
- Single JS bundle: 1,404 KB (gzip: 404 KB) — no code splitting, high TTI/INP impact
- Homepage hero `<img>` missing `fetchPriority="high"` — browser de-prioritizes LCP image
- Known issue: `Home.tsx:8` TODO comment confirms hero size unfixed

**Desired End State:**
- Hero WebP <100 KB — LCP under 2.5s mobile
- Logo WebP/SVG <20 KB
- JS chunks: vendor, router, supabase, app split — initial load under 200 KB
- LCP image preloaded and prioritized

**Sprint 1 Tasks:**
- **B-1:** Convert hero-portrait.jpg to WebP <100 KB. Update import in `Home.tsx`.
- **B-2:** Convert logo.png to WebP or SVG <20 KB. Update all references.
- **B-3 (after B-1):** Add `fetchPriority="high"` and `loading="eager"` to homepage hero `<img>`.
- **B-4 (after B-1+B-2):** Update `index.html` to `<link rel="preload" as="image">` for WebP hero.

**Sprint 2 Tasks:**
- **B-5:** Add `rollupOptions.output.manualChunks` to `vite.config.ts` — split vendor, supabase, react-router, markdown into separate bundles.

---

### C. International SEO

**Current Problems:**
- 27 ES pages vs 41 EN — 14 EN-only pages with no ES counterpart
- Missing ES counterparts for strategically critical markets: Spain (madrid page EN-only), dating-culture (high GEO intent in Spanish), travel pages
- No `/es/recursos` or `/es/recursos/:slug` — entire Spanish blog is inaccessible via Spanish-language URL
- `seo.ts` default hreflang fallback actively misinforms Google (see Workstream A)
- `Legal.tsx` EN-only pages incorrectly signal ES version at EN URL

**Desired End State:**
- All strategically critical EN pages have ES counterparts with proper hreflang pairs
- `/es/recursos` route exists and returns Spanish blog index
- No EN-only page incorrectly signals an ES version
- Spain market (primarily Spanish-speaking) has full Spanish landing page coverage

**Sprint 1 Tasks (prerequisite — I008 hreflang fix):**
- Fix hreflang default fallback — enables all subsequent ES routes to be added correctly.

**Sprint 2 Tasks:**
- Add `/es/recursos` route to App.tsx
- Add ES content + routes for: `/es/mujeres-venezolanas-en-espana` (Madrid page EN-only, Spain audience searches in Spanish), `/es/cultura-de-citas-venezolanas` (high GEO intent in Spanish)
- Add `/es/viajar-para-conocer-mujeres-venezolanas` and `/es/visitar-venezuela-para-citas`

**Sprint 3 Tasks:**
- Add ES counterparts for Barcelona, Buenos Aires (after EN rewrites complete)
- Add ES counterparts for Chicago, Atlanta (after EN rewrites complete)

---

### D. Internal Linking and Information Architecture

**Current Problems:**
- `PublicFooter.tsx` has zero links to landing pages or blog posts — 90+ page impressions wasting PageRank
- Safety, FAQ, HowItWorks pages do not link to any landing pages — high-authority pages leaving link equity on the table
- Landing pages have JSON-LD breadcrumbs but no visible HTML breadcrumb nav
- No `/es/recursos` means the bilingual blog cluster has no hub page

**Desired End State:**
- Footer distributes PageRank to top 5 landing pages on every page
- Safety page contextually links to `/dating-in-venezuela-safely` and `/verified-venezuelan-dating-profiles`
- FAQ page contextually links to `/venezuelan-dating-culture` and `/why-venezuelan-women`
- HTML breadcrumbs appear above H1 on all landing pages

**Sprint 2 Tasks:**
- **D-1:** Add 4-5 landing page links to footer Product column: Meet Venezuelan Women, Venezuelan Dating Site, Venezuelan Women for Marriage, Dating Culture, Verified Profiles.
- **D-2:** Add contextual links from Safety and FAQ pages to relevant landing pages (content-driven, not nav).

**Sprint 3 Tasks:**
- **D-3:** Add HTML breadcrumb nav to `LandingPageTemplate.tsx` above H1.

---

### E. GEO Landing-Page Program (Content Rewrites and Merges)

**Current State:** 9 PASS, 30 PARTIAL, 2 FAIL across 41 EN pages.

**Decision rules applied:**
- KEEP = score ≥74 and content is differentiated
- REWRITE = score 65-78 and a genuine differentiation angle exists
- MERGE = score <65 or page is a pure doorway-page clone with no genuine differentiator
- NOINDEX = 0 pages recommended (too early; rewrites are preferred)

**Merge Decision (1 page):**
| Slug | Action | Target | Sprint |
|------|--------|--------|--------|
| venezuelan-women-in-maturin | MERGE | /meet-venezuelan-women or new /venezuelan-cities hub | Sprint 2 |

**Rewrite Decisions (9 pages — ordered by differentiation potential):**
| Slug | Rewrite Angle | Sprint | Priority |
|------|--------------|--------|----------|
| venezuelan-women-in-washington-dc | Venezuelan political refugee/asylum/diplomatic community in DC — unique angle no competitor can copy | Sprint 2 | HIGH |
| venezuelan-women-in-dallas | North Dallas/Addison Venezuelan oil engineering community | Sprint 2 | MEDIUM |
| venezuelan-women-in-orlando | Disney/theme park Venezuelan worker diaspora; International Drive community | Sprint 2 | MEDIUM |
| venezuelan-women-in-chicago | Pilsen/Humboldt Park; differentiate from Sun Belt city pages | Sprint 2 | MEDIUM |
| venezuelan-women-in-atlanta | Buford Highway Venezuelan restaurant district — nationally known | Sprint 2 | MEDIUM |
| venezuelan-women-in-boston | Cambridge/Greater Boston Venezuelan academic community | Sprint 2 | MEDIUM |
| venezuelan-women-in-ciudad-guayana | Orinoco delta / Angostura local dating framing (not diaspora) | Sprint 2 | MEDIUM |
| venezuelan-women-in-buenos-aires | Palermo/Villa Crespo; Buenos Aires as quality-of-life destination | Sprint 3 | LOW |
| venezuelan-women-in-barcelona | Catalan+Venezuelan cultural contrast; Barcelona creative professionals | Sprint 3 | LOW |

**Content Quality Rules for Rewrites:**
- Minimum 800 words of authentic local content
- Section bodies must differ meaningfully from sibling pages — no shared boilerplate paragraphs
- At least 1 local community landmark or institution mentioned (restaurant district, university, consulate, community center)
- Do not add an ES counterpart until the EN page passes quality review

---

### F. Core Content and Trust Assets

**Current Problems:**
- No `/about` page — YMYL site with zero company identity, no moderation team info
- All blog posts authored by `Organization` — no named expert
- Safety page: ~150 words of prose — critically thin for a YMYL page
- HowItWorks: ~200 words — thin content; H1 jumps to H3 (missing H2 wrapper)
- FAQ, Safety, HowItWorks titles pulled from generic i18n keys — not keyword-targeted
- No AggregateRating, no press coverage, no third-party trust certifications

**Desired End State:**
- `/about` page exists with company story, founding mission, moderation process, team bio
- Blog posts have a named expert author persona (even pseudonymous — e.g., "María Rodríguez, Venezuelan Cultural Advisor")
- Safety expands to 800+ words with 3 dedicated subsections
- HowItWorks expands to 600+ words with H2 section wrapper over step cards
- All core pages have explicit keyword-targeted SEO meta

**Sprint 1 Tasks:**
- Write keyword-targeted titles and descriptions for FAQ, Safety, HowItWorks (no code changes — just meta strings)

**Sprint 2 Tasks:**
- Create `/about` route + `About.tsx` page
- Create expert author persona; update `ResourceDetail.tsx` author logic
- Expand Safety page to 800+ words
- Expand HowItWorks to 600+ words with H2 wrapper

---

## Sprint Roadmap

### Sprint 1 — Stop the Bleeding: Crawl, Index, and Metadata
**Duration**: 1-2 developer days
**Objective**: Ensure Google can discover, crawl, index, and correctly interpret all 41 landing pages. Fix all blocking metadata bugs in a single deploy.

| Task | ID | Effort | Files | Batch |
|------|----|--------|-------|-------|
| Verify sitemap edge function; remove _redirects override if LPs missing | I001 | S | `public/_redirects` | Batch 1 |
| Add `/* /index.html 200` SPA catch-all | I002 | S | `public/_redirects` | Batch 1 |
| Convert hero to WebP <100 KB | I003 | S | `src/assets/` | Batch 2 |
| Convert logo to WebP <20 KB | I004 | S | `src/assets/` | Batch 2 |
| Fix index.html canonical to absolute URL | I006 | S | `index.html` | Batch 3 |
| Fix index.html OG image to absolute URL | I007 | S | `index.html` | Batch 3 |
| Add `fetchPriority="high"` + preload to homepage hero | I015 | S | `Home.tsx`, `index.html` | Batch 3 |
| Fix hreflang default fallback in seo.ts | I008 | S | `src/seo/seo.ts` | Batch 4 |
| Fix Legal/HowItWorks to en+x-default only | I023 | S | `src/seo/seo.ts` | Batch 4 |
| Fix SearchAction URL | I009 | S | `StructuredData.tsx` | Batch 5 |
| Remove duplicate WebSite JSON-LD | I010 | S | `StructuredData.tsx` | Batch 5 |
| Add sameAs social links | I012 | S | `StructuredData.tsx` | Batch 5 |

**Expected Outcome**: Google can find, crawl, and index all 41 landing pages. Canonical, hreflang, and OG meta are correct for all crawlers. SearchAction errors cleared. Image-driven LCP materially improved.

**QA Checklist Before Release:**
- [ ] `curl -s https://matchvenezuelan.com/sitemap.xml | grep -c "<loc>"` — verify count ≥ 43 (41 EN + ES pages + home + resources)
- [ ] `curl -I https://matchvenezuelan.com/meet-venezuelan-women` — verify `HTTP/2 200`
- [ ] `curl -I https://matchvenezuelan.com/es/conocer-mujeres-venezolanas` — verify `HTTP/2 200`
- [ ] `view-source:https://matchvenezuelan.com` — verify absolute canonical in raw HTML
- [ ] Facebook Sharing Debugger on homepage — verify OG image renders
- [ ] Google Rich Results Test on homepage — verify no SearchAction errors; single WebSite block
- [ ] hreflang.org validator on `/how-it-works` and `/aup` — verify no false ES signals
- [ ] PageSpeed Insights mobile — verify LCP improvement (target: <4s before code splitting; <2.5s after)
- [ ] Submit updated sitemap to Google Search Console

---

### Sprint 2 — Trust, GEO Baseline, Internal Linking, Landing Page Quality
**Duration**: 2-3 developer weeks
**Objective**: Make the site AI-citable. Build trust signals. Surface landing pages across the site. Fix all city pages with genuine rewrite angles.

| Task | ID | Effort | Track |
|------|----|--------|-------|
| Add DatingService schema to Home | I011 | M | Technical |
| Create `/about` page (company story; moderation team) | I013 | M | Content |
| Create expert author persona for blog posts | I014 | M | Content |
| Add top 5 landing pages to footer | I016 | S | IA |
| Write keyword-targeted titles for FAQ; Safety; HowItWorks | I019 | S | Technical |
| Expand Safety page to 800+ words | I020 | M | Content |
| Expand HowItWorks to 600+ words | I021 | M | Content |
| Add Vite code splitting | I027 | M | Performance |
| Add `/es/recursos` route | I018 | M | International |
| Add ES counterparts: Madrid; dating-culture; travel pages | I022 | M | International |
| Merge maturin → redirect | LP-F01 | S | Landing pages |
| Rewrite washington-dc | LP-F08 | M | Landing pages |
| Rewrite dallas; orlando; atlanta; chicago; boston; ciudad-guayana | LP-F02 to LP-F07 | M each | Landing pages |

**Expected Outcome**: Site becomes eligible for AI citation (DatingService + named authors + About page + sameAs). Landing pages visible in footer. Spanish blog index accessible. 7 weak city pages replaced with authentic differentiated content. JS bundle split improves INP.

**QA Checklist Before Release:**
- [ ] Google Rich Results Test on homepage — verify DatingService entity recognized
- [ ] Verify `/about` returns 200 and is linked from footer
- [ ] Verify `/es/recursos` returns 200 with Spanish content
- [ ] Verify all 7 rewritten pages score ≥75 on the landing page rubric (manual review)
- [ ] Verify rewritten pages share no boilerplate paragraphs with sibling city pages
- [ ] Verify 301 redirect from `/venezuelan-women-in-maturin` returns `Location: /meet-venezuelan-women`
- [ ] Lighthouse TTI improvement on homepage after code splitting (target: <3s TTI mobile)
- [ ] Crawl internal links — verify top 5 LPs now appear in footer link sources

---

### Sprint 3 — Scale, International Expansion, Technical Polish
**Duration**: 3-4 developer weeks
**Objective**: Expand Spanish market coverage. Clean up remaining technical debt. Complete the content program.

| Task | ID | Effort | Track |
|------|----|--------|-------|
| Add ES counterparts: Barcelona EU; Buenos Aires | I022b | M | International |
| Add ES counterparts: Chicago; Atlanta (after rewrites) | I022b | M | International |
| Rewrite buenos-aires; barcelona-eu | LP-F09; LP-F10 | M each | Landing pages |
| Add URL-based blog pagination | I024 | M | Technical |
| Create proper favicon.ico + PWA manifest | I025 | S | Technical |
| Verify RSS feeds valid XML | I026 | S | Technical |
| Add HTML breadcrumb nav to landing pages | I028 | S | IA |
| Write 2-3 pillar blog posts (Best Venezuelan Dating Sites 2026; How to Meet Venezuelan Women; Romance Scam Red Flags) | — | L | Content |
| Add `AggregateRating` once real reviews collected | — | S | Technical |

**Expected Outcome**: Full Spanish market coverage for priority European and LATAM markets. Blog discovery via pagination. Technical polish complete. Pillar content strengthens topical authority for GEO.

**QA Checklist Before Release:**
- [ ] Verify all new ES counterparts have reciprocal hreflang pairs
- [ ] Verify buenos-aires and barcelona pages score ≥75 on landing page rubric
- [ ] Verify blog pagination: `/resources?page=2` returns different posts than page 1
- [ ] W3C Feed Validator on `/rss.xml` and `/rss-es.xml`
- [ ] Verify favicon renders in browser tab and mobile homescreen
- [ ] Review pillar posts against GEO schema requirements (named author; FAQ; DatingService reference)

---

## Dependency Map

```
I001 (sitemap verify)
  └─ unblocks → ALL other indexation/ranking work

I002 (SPA catch-all)
  └─ enables → direct URL crawlability
  └─ enables → LP-F01 (merge redirect can be added safely)

I003 + I004 (image compression)
  └─ enables → I015 (fetchPriority meaningful after compression)
  └─ enables → I007 (OG image should be compressed before made canonical)

I006 + I007 (index.html fixes — same file, one PR)
  └─ no dependencies

I008 (hreflang fix)
  └─ must precede → I018 (/es/recursos route)
  └─ must precede → I022 (ES counterparts added with correct hreflang)
  └─ batch with → I023 (same file, Legal/HowItWorks fix)

I009 + I010 (StructuredData.tsx — same file, one PR)
  └─ batch with → I012 (sameAs, same file)

I012 (sameAs)
  └─ should precede → I011 (DatingService entity more complete with sameAs)

I013 (About page)
  └─ enables → I014 (named author can link to About)
  └─ enables → I011 (DatingService can reference /about URL)

I014 (named author)
  └─ blocked by → I013 (About page must exist first)

LP-F08 (washington-dc rewrite) — highest-value content asset
  └─ no dependencies — can start immediately

LP-F01 through LP-F10 (rewrites)
  └─ no technical dependencies — content work, can run in parallel with Sprint 1
  └─ ES counterparts (I022b) must wait until EN rewrites pass quality review
```

---

## QA and Validation Checklist (Master)

### After Sprint 1 (go/no-go gate before Sprint 2 work begins):
- [ ] **Sitemap**: Fetch `/sitemap.xml` raw — verify 41+ EN landing page slugs present
- [ ] **SPA routing**: `curl -I https://matchvenezuelan.com/meet-venezuelan-women` → HTTP 200
- [ ] **Canonical**: `view-source:https://matchvenezuelan.com` → `href="https://matchvenezuelan.com/"`
- [ ] **OG image**: Facebook Sharing Debugger on homepage → OG image renders correctly
- [ ] **hreflang**: hreflang.org validator on `/how-it-works`, `/aup` → no false ES signals
- [ ] **SearchAction**: Google Rich Results Test → no errors; single WebSite block on homepage
- [ ] **LCP**: PageSpeed Insights mobile on homepage → LCP below 4s (below 2.5s after Sprint 2 code splitting)
- [ ] **Search Console**: Submit sitemap; no sitemap errors after 48h

### After Sprint 2:
- [ ] **GEO**: Google Rich Results Test → DatingService entity recognized
- [ ] **About page**: `/about` indexed in Search Console
- [ ] **ES resources**: `/es/recursos` → HTTP 200; Spanish content renders
- [ ] **Rewrites**: Each of 7 rewritten pages manually reviewed — score ≥75; no shared boilerplate with sibling pages
- [ ] **Merge**: `curl -I https://matchvenezuelan.com/venezuelan-women-in-maturin` → 301 redirect
- [ ] **Footer links**: Internal link crawl shows top 5 LPs receiving footer link source
- [ ] **Code splitting**: Lighthouse → main JS chunk under 200 KB initial; TTI <3s

### After Sprint 3:
- [ ] **ES counterparts**: All new ES routes return 200; hreflang reciprocity confirmed
- [ ] **Blog pagination**: `/resources?page=2` returns different posts
- [ ] **RSS**: W3C Feed Validator on both RSS URLs — valid XML
- [ ] **Pillar content**: Each pillar post has named author; FAQ; 1500+ words; BlogPosting JSON-LD

---

## Release Recommendation

**DO NOT scale SEO or run traffic campaigns until Sprint 1 is deployed and verified.**

**The rationale is simple:** if the Supabase sitemap edge function is not returning all 41 landing pages, Google has no discovery path for the site's core content. Running ads or link-building campaigns to pages that may not be indexed is waste.

**After Sprint 1 ships:**
- Aggressive link-building to core landing pages (meet-venezuelan-women, venezuelan-dating-site, venezuelan-women-for-marriage) is justified.
- Google Search Console submission should happen the same day Sprint 1 deploys.
- Monitor coverage report for 2 weeks — target: all 41 landing pages show as "Indexed" not "Discovered but not indexed."

**After Sprint 2 ships:**
- GEO content campaigns (getting cited in AI answers) can begin in earnest once DatingService schema, About page, and named authors are live.
- Outreach to Venezuelan cultural publications for backlinks is high-ROI at this stage.

**After Sprint 3 ships:**
- Full-scale Spanish-language SEO campaign is justified once `/es/recursos` and priority ES counterparts are live.

**Bottom line:** Sprint 1 is the unlock. Sprint 2 is the trust build. Sprint 3 is the scale.

---

*Remediation plan complete. 0 files modified. All decisions are read-only planning observations.*
*Source audit: `output/matchvenezuelan-seo-geo-audit.md` | Score: 55.9/100 (F, CAUTION)*
