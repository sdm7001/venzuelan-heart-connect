#!/usr/bin/env node
/**
 * generate-worker-meta.mjs
 *
 * Reads the source of truth for SEO metadata and produces a machine-readable
 * JSON file at cloudflare-worker/meta-map.json.  The Worker can import this
 * at deploy time (or it can be kept in sync manually by running this script
 * whenever landing page content changes).
 *
 * Usage:
 *   node scripts/generate-worker-meta.mjs
 *   # or add to package.json: "generate:worker-meta": "node scripts/generate-worker-meta.mjs"
 *
 * Sources consulted:
 *   1. public/sitemap.xml          — authoritative URL set + hreflang pairs
 *   2. src/App.tsx                 — route definitions
 *   3. src/content/landingPages.ts — title/description for all landing pages
 *
 * Output:
 *   cloudflare-worker/meta-map.json  — key: pathname, value: { lang, title, description, canonical, alternates }
 *
 * NOTE: This script generates the JSON snapshot.  The worker.js META_MAP is
 * maintained separately and should be updated from this JSON when it diverges.
 * Run this script after any Sprint that adds/changes landing pages.
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Step 1: Parse sitemap.xml to extract all URLs and their hreflang pairs
// ---------------------------------------------------------------------------

const sitemapPath = resolve(root, "public/sitemap.xml");
const sitemapXml = readFileSync(sitemapPath, "utf-8");

// Simple regex-based extraction (no XML parser dependency)
const urlBlocks = [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)];

const sitemapEntries = urlBlocks.map((match) => {
  const block = match[1];
  const locMatch = block.match(/<loc>(.*?)<\/loc>/);
  const loc = locMatch ? locMatch[1].trim() : null;

  const alternates = [...block.matchAll(/<xhtml:link[^>]+hreflang="([^"]+)"[^>]+href="([^"]+)"/g)].map(
    (m) => ({ hreflang: m[1], href: m[2] })
  );

  if (!loc) return null;
  return { loc, alternates };
}).filter(Boolean);

console.log(`[sitemap] Parsed ${sitemapEntries.length} URL entries`);

// ---------------------------------------------------------------------------
// Step 2: Read landingPages.ts and extract slug → title/description
// Note: We use regex since the file is TypeScript, not JSON.
// ---------------------------------------------------------------------------

const lpPath = resolve(root, "src/content/landingPages.ts");
const lpContent = readFileSync(lpPath, "utf-8");

// Extract all slug + title + description + esSlug pairs
// This is a best-effort regex extraction; complex nesting may be missed.
const landingMeta = {};

// Match blocks that have at least slug and title
const blockMatches = [...lpContent.matchAll(/\{\s*slug:\s*["']([^"']+)["'][^}]*?title:\s*["']([^"']+)["'][^}]*?description:\s*["']([^"']+)["']/gs)];
for (const m of blockMatches) {
  const slug = m[1];
  const title = m[2];
  const description = m[3];
  landingMeta["/" + slug] = { title, description };
}

// Also try to catch esSlug mappings
const esSlugMatches = [...lpContent.matchAll(/slug:\s*["']([^"']+)["'][^}]*?esSlug:\s*["']([^"']+)["']/gs)];
const slugToEsSlug = {};
for (const m of esSlugMatches) {
  slugToEsSlug["/" + m[1]] = "/es/" + m[2].replace(/^es\//, "");
}

console.log(`[landingPages] Extracted metadata for ${Object.keys(landingMeta).length} EN pages`);
console.log(`[landingPages] Found ${Object.keys(slugToEsSlug).length} EN→ES slug mappings`);

// ---------------------------------------------------------------------------
// Step 3: Build the meta map
// ---------------------------------------------------------------------------

const metaMap = {};

for (const { loc, alternates } of sitemapEntries) {
  let pathname;
  try {
    pathname = new URL(loc).pathname;
    // Normalize trailing slash
    if (pathname.length > 1) pathname = pathname.replace(/\/$/, "");
  } catch {
    continue;
  }

  const lang = pathname.startsWith("/es/") || pathname === "/es" ? "es" : "en";
  const canonical = loc.replace(/\/$/, "") || loc;

  // Title + description: prefer landingPages.ts, fall back to generic
  const lp = landingMeta[pathname];
  const title = lp?.title ?? (lang === "es"
    ? "MatchVenezuelan — Citas internacionales serias"
    : "MatchVenezuelan — Serious international dating");
  const description = lp?.description ?? (lang === "es"
    ? "Conecta con mujeres venezolanas verificadas para relaciones serias."
    : "Connect with verified Venezuelan women for serious relationships.");

  metaMap[pathname] = {
    lang,
    title,
    description,
    canonical,
    alternates: alternates.length > 0 ? alternates : undefined,
  };
}

console.log(`[output] Built meta map with ${Object.keys(metaMap).length} entries`);

// ---------------------------------------------------------------------------
// Step 4: Write output
// ---------------------------------------------------------------------------

const outputPath = resolve(root, "cloudflare-worker/meta-map.json");
writeFileSync(outputPath, JSON.stringify(metaMap, null, 2), "utf-8");

console.log(`[done] Written to ${outputPath}`);
console.log(`\nNext steps:`);
console.log(`  1. Review cloudflare-worker/meta-map.json for accuracy`);
console.log(`  2. Update cloudflare-worker/worker.js META_MAP with any missing high-value pages`);
console.log(`  3. Deploy worker via Cloudflare dashboard or wrangler`);
