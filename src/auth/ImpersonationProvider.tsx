import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";

const STORAGE_KEY = "mv_impersonation_v1";
const MAX_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export type ImpersonationSession = {
  actorId: string;
  targetId: string;
  targetName: string;
  reason: string;
  startedAt: number;
};

type Ctx = {
  session: ImpersonationSession | null;
  active: boolean;
  start: (target: { id: string; name: string }, reason: string) => Promise<void>;
  end: (note?: string) => Promise<void>;
  remainingMs: number;
};

const ImpersonationCtx = createContext<Ctx | null>(null);

function load(): ImpersonationSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as ImpersonationSession;
    if (Date.now() - s.startedAt > MAX_DURATION_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [session, setSession] = useState<ImpersonationSession | null>(() => load());
  const [now, setNow] = useState(Date.now());

  // Drop the session if the actor signs out or loses admin
  useEffect(() => {
    if (session && (!user || user.id !== session.actorId || !isAdmin)) {
      sessionStorage.removeItem(STORAGE_KEY);
      setSession(null);
    }
  }, [user, isAdmin, session]);

  // Tick for countdown / auto-expire
  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => {
      const elapsed = Date.now() - session.startedAt;
      if (elapsed >= MAX_DURATION_MS) {
        void end("auto_expired");
      } else {
        setNow(Date.now());
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const start = useCallback(async (target: { id: string; name: string }, reason: string) => {
    if (!user) throw new Error("Not signed in");
    if (!isAdmin) throw new Error("Admin role required");
    if (!reason || reason.trim().length < 10) throw new Error("Please provide a reason (min 10 characters)");
    if (target.id === user.id) throw new Error("Cannot impersonate yourself");

    const next: ImpersonationSession = {
      actorId: user.id,
      targetId: target.id,
      targetName: target.name,
      reason: reason.trim(),
      startedAt: Date.now(),
    };

    const { error } = await supabase.from("audit_events").insert({
      actor_id: user.id,
      subject_id: target.id,
      category: "admin",
      action: "impersonation_started",
      metadata: {
        reason: next.reason,
        target_name: target.name,
        max_duration_minutes: MAX_DURATION_MS / 60000,
        user_agent: navigator.userAgent,
      },
    });
    if (error) throw error;

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  }, [user, isAdmin]);

  const end = useCallback(async (note?: string) => {
    const current = session ?? load();
    if (!current) return;
    const durationMs = Date.now() - current.startedAt;
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
    await supabase.from("audit_events").insert({
      actor_id: current.actorId,
      subject_id: current.targetId,
      category: "admin",
      action: "impersonation_ended",
      metadata: {
        duration_seconds: Math.round(durationMs / 1000),
        reason: current.reason,
        end_note: note ?? "manual",
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const remainingMs = session ? Math.max(0, MAX_DURATION_MS - (now - session.startedAt)) : 0;

  return (
    <ImpersonationCtx.Provider value={{ session, active: !!session, start, end, remainingMs }}>
      {children}
    </ImpersonationCtx.Provider>
  );
}

export function useImpersonation() {
  const ctx = useContext(ImpersonationCtx);
  if (!ctx) throw new Error("useImpersonation must be used within ImpersonationProvider");
  return ctx;
}
