/**
 * Dev-only responsive QA harness.
 *
 * Visit /__responsive. Pick a route + device size; the harness renders the
 * route inside a device-sized iframe and:
 *   - highlights any element wider than its container (overflow → red outline)
 *   - shows current safe-area-inset values (env(safe-area-inset-*))
 *   - draws guides for the safe-area zones so you can verify padding
 *
 * NOT registered in production builds. NOT linked from anywhere.
 */
import { useEffect, useMemo, useRef, useState } from "react";

type Device = {
  id: string;
  name: string;
  w: number;
  h: number;
  // Safe-area inset hints (px) the iframe will simulate via injected CSS.
  insets: { top: number; right: number; bottom: number; left: number };
  family: "iphone" | "android";
};

const DEVICES: Device[] = [
  // iPhone
  { id: "iphone-se", name: "iPhone SE", w: 320, h: 568, insets: { top: 20, right: 0, bottom: 0, left: 0 }, family: "iphone" },
  { id: "iphone-13-mini", name: "iPhone 13 mini", w: 375, h: 812, insets: { top: 50, right: 0, bottom: 34, left: 0 }, family: "iphone" },
  { id: "iphone-14", name: "iPhone 14", w: 390, h: 844, insets: { top: 47, right: 0, bottom: 34, left: 0 }, family: "iphone" },
  { id: "iphone-14-pro-max", name: "iPhone 14 Pro Max", w: 430, h: 932, insets: { top: 59, right: 0, bottom: 34, left: 0 }, family: "iphone" },
  // Android
  { id: "pixel-5", name: "Pixel 5", w: 393, h: 851, insets: { top: 24, right: 0, bottom: 16, left: 0 }, family: "android" },
  { id: "galaxy-s20", name: "Galaxy S20", w: 360, h: 800, insets: { top: 24, right: 0, bottom: 16, left: 0 }, family: "android" },
  { id: "pixel-7-pro", name: "Pixel 7 Pro", w: 412, h: 915, insets: { top: 28, right: 0, bottom: 16, left: 0 }, family: "android" },
];

const ROUTES = [
  "/", "/how-it-works", "/safety", "/faq", "/resources",
  "/auth", "/auth?mode=join",
];

type OverflowReport = { count: number; samples: string[] };

const PROBE_SCRIPT = (insets: Device["insets"]) => `
(() => {
  // 1) Simulate safe-area insets using env() polyfill via CSS variables on :root,
  //    plus a polyfill for env(safe-area-inset-*) by overriding viewport-fit.
  const style = document.createElement('style');
  style.id = '__qa-safe-area';
  style.textContent = \`
    :root {
      --qa-sat: ${insets.top}px;
      --qa-sar: ${insets.right}px;
      --qa-sab: ${insets.bottom}px;
      --qa-sal: ${insets.left}px;
    }
    /* Visualize the safe-area zones with translucent guides. */
    html::before, html::after {
      content: '';
      position: fixed;
      left: 0;
      right: 0;
      pointer-events: none;
      z-index: 2147483646;
      background: repeating-linear-gradient(
        45deg,
        rgba(255, 0, 90, 0.18) 0 6px,
        rgba(255, 0, 90, 0.06) 6px 12px
      );
    }
    html::before { top: 0; height: var(--qa-sat); }
    html::after  { bottom: 0; height: var(--qa-sab); }

    /* Outline anything wider than the viewport (horizontal overflow). */
    .__qa-overflow {
      outline: 2px solid #ff003b !important;
      outline-offset: -2px;
      box-shadow: inset 0 0 0 1px rgba(255, 0, 59, 0.4);
    }
  \`;
  document.head.appendChild(style);

  // 2) Mark overflowing elements and collect a small sample for the parent.
  const vw = document.documentElement.clientWidth;
  const samples = [];
  let count = 0;
  const all = document.querySelectorAll('body *');
  all.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > vw + 0.5 || r.right > vw + 0.5 || r.left < -0.5) {
      el.classList.add('__qa-overflow');
      count++;
      if (samples.length < 8) {
        const tag = el.tagName.toLowerCase();
        const cls = (el.className && typeof el.className === 'string')
          ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.')
          : '';
        samples.push(\`\${tag}\${cls} (w=\${Math.round(r.width)}, right=\${Math.round(r.right)})\`);
      }
    }
  });

  // 3) Send report back to parent.
  parent.postMessage({
    __qa: true,
    overflow: { count, samples },
    insets: {
      top: getComputedStyle(document.documentElement).getPropertyValue('--qa-sat').trim(),
      right: getComputedStyle(document.documentElement).getPropertyValue('--qa-sar').trim(),
      bottom: getComputedStyle(document.documentElement).getPropertyValue('--qa-sab').trim(),
      left: getComputedStyle(document.documentElement).getPropertyValue('--qa-sal').trim(),
    },
  }, '*');
})();
`;

export default function ResponsiveQA() {
  const [device, setDevice] = useState<Device>(DEVICES[1]);
  const [route, setRoute] = useState<string>(ROUTES[0]);
  const [report, setReport] = useState<{ overflow: OverflowReport; insets: Record<string, string> | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const src = useMemo(() => `${route}${route.includes("?") ? "&" : "?"}__qa=1`, [route]);

  useEffect(() => {
    type QaMsg = { __qa: true; overflow: OverflowReport; insets: Record<string, string> };
    const onMsg = (e: MessageEvent) => {
      const d = e.data as QaMsg | null;
      if (d?.__qa) {
        setReport({ overflow: d.overflow, insets: d.insets });
        setLoading(false);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  function runProbe() {
    const f = frameRef.current;
    if (!f?.contentWindow) return;
    setLoading(true);
    setReport(null);
    try {
      // Inject our probe script into the iframe.
      const script = f.contentWindow.document.createElement("script");
      script.textContent = PROBE_SCRIPT(device.insets);
      f.contentWindow.document.body.appendChild(script);
    } catch (e) {
      setLoading(false);
      setReport({ overflow: { count: -1, samples: [String(e)] }, insets: null });
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 font-mono text-xs">
      <h1 className="mb-3 text-base font-semibold">Responsive QA — overflow & safe-area</h1>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1">
          <span className="text-muted-foreground">Route</span>
          <select
            value={route}
            onChange={(e) => { setRoute(e.target.value); setReport(null); }}
            className="rounded-md border border-border bg-card px-2 py-1"
          >
            {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>

        <label className="flex items-center gap-1">
          <span className="text-muted-foreground">Device</span>
          <select
            value={device.id}
            onChange={(e) => { setDevice(DEVICES.find(d => d.id === e.target.value) ?? DEVICES[0]); setReport(null); }}
            className="rounded-md border border-border bg-card px-2 py-1"
          >
            {DEVICES.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.w}×{d.h}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={runProbe}
          disabled={loading}
          className="rounded-md border border-border bg-card px-3 py-1 font-medium hover:bg-accent disabled:opacity-60"
        >
          {loading ? "Probing…" : "Run probe"}
        </button>

        <span className="text-muted-foreground">
          family: <strong>{device.family}</strong> ·
          {" "}safe-area top/right/bottom/left:
          {" "}<strong>{device.insets.top}/{device.insets.right}/{device.insets.bottom}/{device.insets.left}</strong>
        </span>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <div className="rounded-xl border border-border bg-card p-2 shadow-card">
          <div className="mb-1 text-[10px] text-muted-foreground">{device.name} · {device.w}×{device.h}</div>
          <iframe
            ref={frameRef}
            title="responsive-frame"
            src={src}
            onLoad={() => { setReport(null); }}
            style={{ width: device.w, height: device.h }}
            className="block rounded-md border border-border bg-background"
          />
        </div>

        <div className="min-w-[240px] max-w-md flex-1 space-y-2">
          {!report && (
            <p className="text-muted-foreground">Click <strong>Run probe</strong> after the frame finishes loading. The probe injects safe-area guides (pink hatched bars at the top/bottom) and outlines any element wider than the viewport.</p>
          )}
          {report && (
            <>
              <div className={`rounded-md border p-2 ${report.overflow.count === 0 ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
                <div className="font-semibold">
                  {report.overflow.count === 0
                    ? "✓ No horizontal overflow"
                    : `⚠ ${report.overflow.count} overflowing elements`}
                </div>
                {report.overflow.samples.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {report.overflow.samples.map((s, i) => (
                      <li key={i} className="break-words">{s}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-md border border-border bg-card p-2">
                <div className="font-semibold">Safe-area insets (simulated)</div>
                <pre className="mt-1 whitespace-pre-wrap break-words text-[11px]">{JSON.stringify(report.insets, null, 2)}</pre>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-muted-foreground">
        Tip: use the existing <code>safe-pad</code> utilities (or apply
        <code> padding-top: max(env(safe-area-inset-top), 0.5rem)</code> on fixed/sticky bars)
        to keep content out of the hatched zones.
      </p>
    </div>
  );
}
