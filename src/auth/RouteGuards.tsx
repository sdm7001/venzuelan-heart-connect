import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { PolicyReacceptanceGate } from "@/components/policy/PolicyReacceptanceGate";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, onboardingCompleted } = useAuth();
  const loc = useLocation();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/auth" state={{ from: loc }} replace />;
  if (onboardingCompleted === false && loc.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  return (
    <>
      {children}
      <PolicyReacceptanceGate />
    </>
  );
}

export function RequireStaff({ children }: { children: ReactNode }) {
  const { user, isStaff, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isStaff) return <Navigate to="/dashboard" replace />;
  return (
    <>
      {children}
      <PolicyReacceptanceGate />
    </>
  );
}

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
