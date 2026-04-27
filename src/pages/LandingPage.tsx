import { useLocation } from "react-router-dom";
import { findBySlug, findByEsSlug } from "@/content/landingPages";
import LandingPageTemplate from "@/components/landing/LandingPageTemplate";
import NotFound from "./NotFound";

export default function LandingPage() {
  const location = useLocation();
  const isEs = location.pathname.startsWith("/es/");

  // Extract slug from pathname: "/meet-venezuelan-women" -> "meet-venezuelan-women"
  // or "/es/conocer-mujeres-venezolanas" -> "conocer-mujeres-venezolanas"
  const slug = isEs
    ? location.pathname.replace(/^\/es\//, "").replace(/\/$/, "")
    : location.pathname.replace(/^\//, "").replace(/\/$/, "");

  if (!slug) return <NotFound />;

  const content = isEs ? findByEsSlug(slug) : findBySlug(slug);

  if (!content) return <NotFound />;

  if (isEs && !content.es) return <NotFound />;

  return <LandingPageTemplate content={content} isEs={isEs} />;
}
