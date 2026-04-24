/**
 * FAQ policy-link audit
 * ----------------------------------------------------------------------------
 * Whenever an FAQ answer mentions one of our policy/safety pages by name, the
 * answer must also contain the canonical route to that page (so the user can
 * actually click through). The audit runs over both EN and ES entries.
 *
 * Detection works in two layers:
 *   1) Topic match — keyword regex per language identifies which policies are
 *      relevant to the answer.
 *   2) Link assertion — the answer text must include the policy's canonical
 *      path (e.g. "/legal/privacy") OR a fully-qualified URL ending in that
 *      path. Anchor markup is not required; the route string is the contract
 *      the renderer will linkify.
 *
 * If this test fails it means an answer references a policy by name without
 * giving the reader the URL to reach it. Add the path inline (e.g. "Read the
 * Privacy Policy at /legal/privacy …") in BOTH languages.
 */
import { describe, it, expect } from "vitest";
import { translations } from "@/i18n/translations";

type Lang = "en" | "es";
type PolicyKey = "terms" | "privacy" | "aup" | "antiSolicit" | "antiScam" | "safety";

const POLICY_PATHS: Record<PolicyKey, string> = {
  terms: "/legal/terms",
  privacy: "/legal/privacy",
  aup: "/legal/acceptable-use",
  antiSolicit: "/legal/anti-solicitation",
  // Anti-Scam content lives inside the Anti-Solicitation policy today; if it
  // gets its own page, change this path and the audit will re-validate.
  antiScam: "/legal/anti-solicitation",
  safety: "/safety",
};

// Per-language keyword matchers. Each returns true if the answer is *talking
// about* that policy (whether or not it links to it).
const TOPIC_PATTERNS: Record<Lang, Record<PolicyKey, RegExp>> = {
  en: {
    terms: /\bterms( of service)?\b/i,
    privacy: /\bprivacy policy\b|\bGDPR\b/i,
    aup: /\bacceptable use\b/i,
    antiSolicit: /\banti[- ]solicitation\b|\bsolicitation policy\b/i,
    antiScam: /\banti[- ]scam\b/i,
    safety: /\bsafety page\b|\bfirst[- ]meeting checklist\b/i,
  },
  es: {
    terms: /\btérminos( de servicio)?\b/i,
    privacy: /\bpolítica de privacidad\b|\bRGPD\b/i,
    aup: /\bpolítica de uso aceptable\b/i,
    antiSolicit: /\banti[- ]solicitación\b|\bsolicitación\b/i,
    antiScam: /\bantiestafa\b|\banti[- ]estafa\b/i,
    safety: /\bpágina de seguridad\b|\blista (?:completa )?para el primer encuentro\b/i,
  },
};

function answerLinksToPath(answer: string, path: string): boolean {
  // Match the canonical path either as a bare path token or inside a URL.
  // Use a word-ish boundary so "/legal/privacy" doesn't accidentally match
  // "/legal/privacy-extended".
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[\\s("'>\\[<])${escaped}(?=$|[\\s)\\.,;:!?"'<\\]])`);
  return re.test(answer);
}

function auditEntry(lang: Lang, idx: number, q: string, a: string) {
  const missing: { policy: PolicyKey; path: string }[] = [];
  const patterns = TOPIC_PATTERNS[lang];
  (Object.keys(patterns) as PolicyKey[]).forEach((policy) => {
    if (patterns[policy].test(a)) {
      const path = POLICY_PATHS[policy];
      if (!answerLinksToPath(a, path)) missing.push({ policy, path });
    }
  });
  return { lang, idx, q, missing };
}

describe("FAQ policy-link audit", () => {
  const langs: Lang[] = ["en", "es"];

  it("EN and ES FAQ entry counts match (positional alignment)", () => {
    expect(translations.en.faq.entries.length).toBe(translations.es.faq.entries.length);
  });

  for (const lang of langs) {
    describe(lang.toUpperCase(), () => {
      const entries = translations[lang].faq.entries;
      entries.forEach((e, idx) => {
        const result = auditEntry(lang, idx, e.q, e.a);
        const missing = result.missing;
        const label = `entry #${idx} — "${e.q.slice(0, 60)}${e.q.length > 60 ? "…" : ""}"`;
        it(`${label} links every referenced policy`, () => {
          if (missing.length > 0) {
            const lines = missing
              .map((m) => `  • mentions ${m.policy} but is missing link to ${m.path}`)
              .join("\n");
            throw new Error(
              `[${lang.toUpperCase()}] FAQ entry #${idx} — references policies without linking them:\n${lines}\n\n` +
                `Answer:\n${e.a}\n\n` +
                `Fix: include the canonical path (e.g. "${missing[0].path}") inline in the answer.`,
            );
          }
          expect(missing).toEqual([]);
        });
      });
    });
  }

  it("produces a single combined audit report (informational)", () => {
    const report: { lang: Lang; idx: number; q: string; missing: { policy: PolicyKey; path: string }[] }[] = [];
    for (const lang of langs) {
      translations[lang].faq.entries.forEach((e, idx) => {
        const r = auditEntry(lang, idx, e.q, e.a);
        if (r.missing.length) report.push(r);
      });
    }
    if (report.length) {
      // eslint-disable-next-line no-console
      console.warn(
        `\n=== FAQ policy-link audit: ${report.length} entries need attention ===\n` +
          report
            .map(
              (r) =>
                `[${r.lang.toUpperCase()}] #${r.idx}  ${r.q}\n` +
                r.missing.map((m) => `   - ${m.policy} → ${m.path}`).join("\n"),
            )
            .join("\n\n"),
      );
    }
    // This block exists only to surface the full report; the per-entry tests
    // above are the ones that fail the build.
    expect(true).toBe(true);
  });
});
