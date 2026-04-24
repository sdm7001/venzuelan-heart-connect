import { useEffect, useState } from "react";
import { useImpersonation } from "@/auth/ImpersonationProvider";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function ImpersonationBanner() {
  const { session, active, end, remainingMs } = useImpersonation();
  const [, setTick] = useState(0);

  // Re-render every second so the timer ticks
  useEffect(() => {
    if (!active) return;
    const i = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(i);
  }, [active]);

  if (!active || !session) return null;

  return (
    <div className="sticky top-0 z-50 border-b border-warning/40 bg-warning text-warning-foreground shadow-card">
      <div className="container flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <Eye className="h-4 w-4 shrink-0" />
          <span className="font-semibold">Viewing as</span>
          <span className="truncate font-mono">{session.targetName}</span>
          <span className="hidden text-xs opacity-80 md:inline">· read-only · audit logged</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums opacity-90">expires in {fmt(remainingMs)}</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-warning-foreground/30 bg-warning-foreground/10 text-warning-foreground hover:bg-warning-foreground/20"
            onClick={() => void end("manual")}
          >
            <X className="mr-1 h-3 w-3" /> End session
          </Button>
        </div>
      </div>
    </div>
  );
}
