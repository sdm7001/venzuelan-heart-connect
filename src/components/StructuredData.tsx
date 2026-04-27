// StructuredData — renders site-level Organization + WebSite JSON-LD blocks.
// Use on the EN homepage only. Other pages get per-page LD via useSeo/applySeo.

import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/seo/seo";

const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
  sameAs: [] as string[],
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function StructuredData() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
    </>
  );
}
