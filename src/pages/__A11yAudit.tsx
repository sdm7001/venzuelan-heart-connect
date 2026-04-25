/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Dev-only accessibility audit harness.
 *
 * Visit /__a11y on a mobile viewport. The page loads each public route in an
 * iframe (sized to the parent), runs axe-core inside the frame, and writes a
 * compact summary to the parent's console (and to the page itself).
 *
 * NOT registered in production builds. NOT linked from anywhere. Safe to remove.
 */
import { useEffect, useState } from "react";

type Violation = {
  id: string;
  impact: string | null;
  help: string;
  nodes: number;
  helpUrl: string;
};
type Report = { route: string; violations: Violation[]; error?: string };

const ROUTES = ["/", "/how-it-works", "/safety", "/faq", "/resources", "/auth", "/auth?mode=join"];
const AXE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js";

function summarize(results: any): Violation[] {
  return (results?.violations ?? []).map((v: any) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes?.length ?? 0,
    helpUrl: v.helpUrl,
  }));
}

async function runAxeIn(win: Window): Promise<any> {
  // Load axe inside the frame if not already present.
  if (!(win as any).axe) {
    await new Promise<void>((resolve, reject) => {
      const s = win.document.createElement("script");
      s.src = AXE_CDN;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("axe load failed"));
      win.document.head.appendChild(s);
    });
  }
  return (win as any).axe.run(win.document, {
    runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  });
}

export default function A11yAudit() {
  const [reports, setReports] = useState<Report[]>([]);
  const [running, setRunning] = useState(false);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    (async () => {
      const out: Report[] = [];
      for (const route of ROUTES) {
        if (cancelled) return;
        setSrc(route);
        // Wait for iframe load.
        await new Promise<void>((resolve) => {
          const handler = () => {
            window.removeEventListener("__frame_loaded", handler);
            resolve();
          };
          window.addEventListener("__frame_loaded", handler);
          // Safety timeout in case the load event doesn't fire.
          setTimeout(resolve, 4000);
        });
        try {
          const frame = document.getElementById("audit-frame") as HTMLIFrameElement | null;
          const win = frame?.contentWindow;
          if (!win) throw new Error("no frame window");
          // Give the route a beat to render.
          await new Promise(r => setTimeout(r, 600));
          const results = await runAxeIn(win);
          out.push({ route, violations: summarize(results) });
        } catch (e: any) {
          out.push({ route, violations: [], error: e?.message ?? String(e) });
        }
        setReports([...out]);
      }
      setRunning(false);
      // eslint-disable-next-line no-console
      console.log("[a11y-audit] DONE", JSON.stringify(out, null, 2));
    })();
    return () => { cancelled = true; };
  }, [running]);

  return (
    <div className="min-h-screen bg-background p-4 font-mono text-xs">
      <h1 className="mb-3 text-base font-semibold">A11y audit harness</h1>
      <button
        type="button"
        onClick={() => { setReports([]); setRunning(true); }}
        disabled={running}
        className="mb-3 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-60"
      >
        {running ? "Running…" : "Run audit"}
      </button>

      <iframe
        id="audit-frame"
        title="audit"
        src={src ?? "about:blank"}
        onLoad={() => window.dispatchEvent(new Event("__frame_loaded"))}
        className="mb-4 block h-[640px] w-full max-w-sm border border-border"
      />

      <div className="space-y-3">
        {reports.map(r => (
          <div key={r.route} className="rounded-md border border-border bg-card p-3">
            <div className="font-semibold">{r.route} — {r.error ? `ERROR: ${r.error}` : `${r.violations.length} violations`}</div>
            {r.violations.map(v => (
              <div key={v.id} className="mt-1 break-words">
                <span className="font-semibold">[{v.impact ?? "?"}]</span> {v.id} — {v.help} ({v.nodes} nodes)
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
