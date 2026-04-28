// StructuredData — renders site-level Organization JSON-LD as static HTML.
// Use on the EN homepage only. WebSite schema is handled by Home.tsx via useSeo.
// Other pages get per-page LD via useSeo/applySeo.

import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/seo/seo";

const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
  sameAs: [
    "https://x.com/matchvenezuelan",
    "https://www.instagram.com/matchvenezuelan/",
    "https://www.facebook.com/matchvenezuelan",
  ],
};

export default function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
    />
  );
}
