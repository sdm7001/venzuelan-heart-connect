import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/i18n/I18nProvider";
import { AuthProvider } from "@/auth/AuthProvider";
import { ImpersonationProvider } from "@/auth/ImpersonationProvider";
import { RequireAuth, RequireStaff } from "@/auth/RouteGuards";

import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import Safety from "./pages/Safety";
import FAQ from "./pages/FAQ";
import Resources from "./pages/Resources";
import ResourceDetail from "./pages/ResourceDetail";
import { Terms, Privacy, AcceptableUse, AntiSolicitation } from "./pages/Legal";
import CookiePolicy from "./pages/CookiePolicy";
import ConsentSettings from "./pages/ConsentSettings";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/app/Dashboard";
import Profile from "./pages/app/Profile";
import Messages from "./pages/app/Messages";
import GiftSend from "./pages/app/GiftSend";
import GiftOrderDetail from "./pages/app/GiftOrderDetail";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReports from "./pages/admin/AdminReports";
import { AdminFlags, AdminBilling } from "./pages/admin/AdminPlaceholders";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminVerification from "./pages/admin/AdminVerification";
import AdminRiskEvents from "./pages/admin/AdminRiskEvents";
import AdminRlsTests from "./pages/admin/AdminRlsTests";
import AdminPolicies from "./pages/admin/AdminPolicies";
import AdminPolicyAcceptance from "./pages/admin/AdminPolicyAcceptance";
import AdminPolicyReaccepts from "./pages/admin/AdminPolicyReaccepts";
import AdminUserProfile from "./pages/admin/AdminUserProfile";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminPostEditor from "./pages/admin/AdminPostEditor";
import AdminLinkSuggestions from "./pages/admin/AdminLinkSuggestions";
import AdminMfaRecoveryCodes from "./pages/admin/AdminMfaRecoveryCodes";
import LandingPage from "./pages/LandingPage";
import PreviewMatches from "./pages/PreviewMatches";
import NotFound from "./pages/NotFound";
import A11yAudit from "./pages/__A11yAudit";
import ResponsiveQA from "./pages/__ResponsiveQA";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <AuthProvider>
        <ImpersonationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
              {/* Public — English */}
              <Route path="/" element={<Home />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/safety" element={<Safety />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/resources/:slug" element={<ResourceDetail />} />
              <Route path="/legal/terms" element={<Terms />} />
              <Route path="/legal/privacy" element={<Privacy />} />
              <Route path="/legal/acceptable-use" element={<AcceptableUse />} />
              <Route path="/legal/anti-solicitation" element={<AntiSolicitation />} />
              <Route path="/legal/cookies" element={<CookiePolicy />} />
              <Route path="/legal/consent" element={<ConsentSettings />} />
              <Route path="/preview" element={<PreviewMatches />} />
              <Route path="/es/preview" element={<PreviewMatches />} />

              {/* Public — Spanish (/es/*) */}
              <Route path="/es/" element={<Home />} />
              <Route path="/es/faq" element={<FAQ />} />
              <Route path="/es/safety" element={<Safety />} />
              <Route path="/es/legal/terms" element={<Terms />} />
              <Route path="/es/legal/privacy" element={<Privacy />} />

              {/* Auth */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />

              {/* App */}
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
              <Route path="/gifts/send" element={<RequireAuth><GiftSend /></RequireAuth>} />
              <Route path="/gifts/:orderId" element={<RequireAuth><GiftOrderDetail /></RequireAuth>} />

              {/* Admin */}
              <Route path="/admin" element={<RequireStaff><AdminOverview /></RequireStaff>} />
              <Route path="/admin/users" element={<RequireStaff><AdminUsers /></RequireStaff>} />
              <Route path="/admin/users/:userId" element={<RequireStaff><AdminUserProfile /></RequireStaff>} />
              <Route path="/admin/reports" element={<RequireStaff><AdminReports /></RequireStaff>} />
              <Route path="/admin/flags" element={<RequireStaff><AdminFlags /></RequireStaff>} />
              <Route path="/admin/verification" element={<RequireStaff><AdminVerification /></RequireStaff>} />
              <Route path="/admin/risk-events" element={<RequireStaff><AdminRiskEvents /></RequireStaff>} />
              <Route path="/admin/rls-tests" element={<RequireStaff><AdminRlsTests /></RequireStaff>} />
              <Route path="/admin/billing" element={<RequireStaff><AdminBilling /></RequireStaff>} />
              <Route path="/admin/audit" element={<RequireStaff><AdminAudit /></RequireStaff>} />
              <Route path="/admin/policies" element={<RequireStaff><AdminPolicies /></RequireStaff>} />
              <Route path="/admin/policy-acceptance" element={<RequireStaff><AdminPolicyAcceptance /></RequireStaff>} />
              <Route path="/admin/policy-reaccepts" element={<RequireStaff><AdminPolicyReaccepts /></RequireStaff>} />
              <Route path="/admin/posts" element={<RequireStaff><AdminPosts /></RequireStaff>} />
              <Route path="/admin/posts/:id" element={<RequireStaff><AdminPostEditor /></RequireStaff>} />
              <Route path="/admin/link-suggestions" element={<RequireStaff><AdminLinkSuggestions /></RequireStaff>} />
              <Route path="/admin/mfa-recovery" element={<RequireStaff><AdminMfaRecoveryCodes /></RequireStaff>} />

              {/* SEO Landing Pages — EN */}
              <Route path="/meet-venezuelan-women" element={<LandingPage />} />
              <Route path="/venezuelan-dating-site" element={<LandingPage />} />
              <Route path="/venezuelan-women-for-marriage" element={<LandingPage />} />
              <Route path="/why-venezuelan-women" element={<LandingPage />} />
              <Route path="/dating-in-venezuela-safely" element={<LandingPage />} />
              <Route path="/venezuelan-women-family-values" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-united-states" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-canada" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-united-kingdom" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-spain" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-australia" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-miami" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-houston" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-los-angeles" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-new-york" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-madrid" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-barcelona" element={<LandingPage />} />
              <Route path="/travel-to-meet-venezuelan-women" element={<LandingPage />} />
              <Route path="/visit-venezuela-for-dating" element={<LandingPage />} />
              <Route path="/venezuelan-dating-culture" element={<LandingPage />} />
              <Route path="/serious-relationship-venezuelan-woman" element={<LandingPage />} />
              <Route path="/verified-venezuelan-dating-profiles" element={<LandingPage />} />
              {/* Additional US Cities */}
              <Route path="/venezuelan-women-in-dallas" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-orlando" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-atlanta" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-chicago" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-washington-dc" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-boston" element={<LandingPage />} />
              {/* Latin American Expat Hubs */}
              <Route path="/venezuelan-women-in-santiago" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-lima" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-bogota" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-buenos-aires" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-panama-city" element={<LandingPage />} />
              {/* Venezuelan Cities */}
              <Route path="/venezuelan-women-in-caracas" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-maracaibo" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-valencia-venezuela" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-barquisimeto" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-maracay" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-merida" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-ciudad-guayana" element={<LandingPage />} />
              <Route path="/venezuelan-women-in-maturin" element={<LandingPage />} />

              {/* SEO Landing Pages — ES */}
              <Route path="/es/conocer-mujeres-venezolanas" element={<LandingPage />} />
              <Route path="/es/sitio-de-citas-venezolanas" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-para-matrimonio" element={<LandingPage />} />
              <Route path="/es/por-que-mujeres-venezolanas" element={<LandingPage />} />
              <Route path="/es/citas-en-venezuela-con-seguridad" element={<LandingPage />} />
              <Route path="/es/valores-familiares-venezolanas" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-estados-unidos" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-canada" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-reino-unido" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-espana" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-australia" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-miami" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-houston" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-los-angeles" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-nueva-york" element={<LandingPage />} />
              {/* ES: Additional Cities */}
              <Route path="/es/mujeres-venezolanas-en-dallas" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-orlando" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-santiago" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-lima" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-bogota" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-ciudad-de-panama" element={<LandingPage />} />
              {/* ES: Venezuelan Cities */}
              <Route path="/es/mujeres-venezolanas-en-caracas" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-maracaibo" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-valencia" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-barquisimeto" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-maracay" element={<LandingPage />} />
              <Route path="/es/mujeres-venezolanas-en-merida" element={<LandingPage />} />

              {/* Dev-only audit harness — safe to remove. */}
              {import.meta.env.DEV && <Route path="/__a11y" element={<A11yAudit />} />}
              {import.meta.env.DEV && <Route path="/__responsive" element={<ResponsiveQA />} />}

              <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ImpersonationProvider>
      </AuthProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
