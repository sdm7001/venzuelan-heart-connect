// Client helper for the `suggest-internal-links` edge function.
// Returns ranked, bilingual internal-link suggestions for a blog post.
//
// Usage (e.g. inside a future admin post editor):
//
//   const res = await suggestInternalLinks({
//     slug: "meeting-her-family",
//     category: "culture",
//     tags: ["family", "venezuela"],
//     title_en, body_en, title_es, body_es,
//     limit: 6,
//   });
//   // res.suggestions_en → [{ label, href, reason }]
//   // res.suggestions_es → [{ label, href, reason }]

import { supabase } from "@/integrations/supabase/client";

export type LinkSuggestion = {
  label: string;
  href: string;
  reason: string;
};

export type SuggestInternalLinksInput = {
  slug?: string;
  category?: string;
  tags?: string[];
  title_en?: string;
  body_en?: string;
  title_es?: string;
  body_es?: string;
  /** 1..10, default 6 */
  limit?: number;
};

export type SuggestInternalLinksResult = {
  suggestions_en: LinkSuggestion[];
  suggestions_es: LinkSuggestion[];
  candidates: { href: string; kind: "post" | "page"; score: number }[];
};

export async function suggestInternalLinks(
  input: SuggestInternalLinksInput,
): Promise<SuggestInternalLinksResult> {
  const { data, error } = await supabase.functions.invoke<
    SuggestInternalLinksResult | { error: string }
  >("suggest-internal-links", { body: input });

  if (error) throw error;
  if (!data) throw new Error("Empty response from suggest-internal-links");
  if ("error" in (data as any)) throw new Error((data as { error: string }).error);
  return data as SuggestInternalLinksResult;
}
