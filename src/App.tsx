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
import { Terms, Privacy, AcceptableUse, AntiSolicitation } from "./pages/Legal";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/app/Dashboard";
import Profile from "./pages/app/Profile";
import Messages from "./pages/app/Messages";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReports from "./pages/admin/AdminReports";
import { AdminFlags, AdminVerification, AdminBilling, AdminAudit } from "./pages/admin/AdminPlaceholders";
import AdminPolicies from "./pages/admin/AdminPolicies";
import NotFound from "./pages/NotFound";

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
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/safety" element={<Safety />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/legal/terms" element={<Terms />} />
              <Route path="/legal/privacy" element={<Privacy />} />
              <Route path="/legal/acceptable-use" element={<AcceptableUse />} />
              <Route path="/legal/anti-solicitation" element={<AntiSolicitation />} />

              {/* Auth */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />

              {/* App */}
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />

              {/* Admin */}
              <Route path="/admin" element={<RequireStaff><AdminOverview /></RequireStaff>} />
              <Route path="/admin/users" element={<RequireStaff><AdminUsers /></RequireStaff>} />
              <Route path="/admin/reports" element={<RequireStaff><AdminReports /></RequireStaff>} />
              <Route path="/admin/flags" element={<RequireStaff><AdminFlags /></RequireStaff>} />
              <Route path="/admin/verification" element={<RequireStaff><AdminVerification /></RequireStaff>} />
              <Route path="/admin/billing" element={<RequireStaff><AdminBilling /></RequireStaff>} />
              <Route path="/admin/audit" element={<RequireStaff><AdminAudit /></RequireStaff>} />
              <Route path="/admin/policies" element={<RequireStaff><AdminPolicies /></RequireStaff>} />

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
