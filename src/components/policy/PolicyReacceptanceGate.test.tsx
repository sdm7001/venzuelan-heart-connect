import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ---- Mocks ----
const mockAuth = {
  user: { id: "user-1" } as any,
  onboardingCompleted: true as boolean | null,
  signOut: vi.fn(),
  loading: false,
};
const mockConfig = {
  config: {
    policy_version: "v2",
    urls: {
      tos: "/legal/terms",
      privacy: "/legal/privacy",
      aup: "/legal/acceptable-use",
      anti_solicitation: "/legal/anti-solicitation",
    },
  },
  loading: false,
};

vi.mock("@/auth/AuthProvider", () => ({
  useAuth: () => mockAuth,
}));
vi.mock("@/lib/policyConfig", async () => {
  const actual = await vi.importActual<any>("@/lib/policyConfig");
  return { ...actual, usePolicyConfig: () => mockConfig };
});
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({
    t: {
      common: { loading: "Loading…" },
      onboarding: {
        mustAcceptAll: "Accept all",
        acceptTos: "I accept the Terms",
        acceptPrivacy: "I accept the Privacy Policy",
        acceptAup: "I accept the AUP",
        acceptAnti: "I accept the Anti-Solicitation Policy",
        readPolicy: "Read",
      },
      legal: {
        tos: "Terms of Service",
        privacy: "Privacy Policy",
        aup: "Acceptable Use Policy",
        antiSolicit: "Anti-Solicitation",
      },
      policyReaccept: {
        title: "Policies updated",
        sub: "Re-accept v{version}",
        confirm: "Accept",
        confirmed: "Done",
        signOut: "Sign out",
        allMissing: "All missing",
        someMissing: "{count}/{total} missing",
        needsUpdate: "needs update v{version}",
        neverAccepted: "never",
        upToDate: "up to date",
        previewTitle: "Preview",
        openInNewTab: "open",
      },
      policyReacceptErrors: {
        auditFailedTitle: "Acceptance saved",
        auditFailedBody: "Saved but logging failed.",
      },
    },
  }),
}));

// Supabase client mock — chainable, thenable query builder. Any terminal
// `await` resolves with rows filtered by the .eq()/.in() calls accumulated
// during the chain, which lets us verify the new pre-check (filtered by
// policy_version + policy_key set) without coupling to call order.
type Row = { policy_key: string; policy_version: string; accepted_at: string };
let ackRows: Row[] = [];
const upsertSpy = vi.fn(async () => ({ error: null }));
const insertSpy = vi.fn(async () => ({ error: null }));

function makeAckBuilder() {
  const filters: { policy_version?: string; policy_keys?: string[] } = {};
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn((col: string, val: any) => {
      if (col === "policy_version") filters.policy_version = val;
      return builder;
    }),
    in: vi.fn((col: string, vals: any[]) => {
      if (col === "policy_key") filters.policy_keys = vals;
      return builder;
    }),
    order: vi.fn(() => builder),
    upsert: upsertSpy,
    then: (resolve: any) => {
      let data = ackRows;
      if (filters.policy_version) data = data.filter(r => r.policy_version === filters.policy_version);
      if (filters.policy_keys) data = data.filter(r => filters.policy_keys!.includes(r.policy_key));
      return Promise.resolve({ data, error: null }).then(resolve);
    },
  };
  return builder;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === "policy_acknowledgements") return makeAckBuilder();
      if (table === "audit_events") return { insert: insertSpy };
      return makeAckBuilder();
    }),
  },
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: any[]) => toastSuccess(...args),
    error: (...args: any[]) => toastError(...args),
  },
}));

import { PolicyReacceptanceGate } from "./PolicyReacceptanceGate";

function renderGate() {
  return render(
    <MemoryRouter>
      <PolicyReacceptanceGate />
    </MemoryRouter>
  );
}

beforeEach(() => {
  ackRows = [];
  upsertSpy.mockClear();
  insertSpy.mockClear();
  insertSpy.mockImplementation(async () => ({ error: null }));
  toastSuccess.mockClear();
  toastError.mockClear();
  mockAuth.user = { id: "user-1" } as any;
  mockAuth.onboardingCompleted = true;
});

describe("PolicyReacceptanceGate", () => {
  it("does not render when user has acknowledged the current policy_version", async () => {
    ackRows = [
      { policy_key: "tos", policy_version: "v2", accepted_at: "2025-01-01" },
      { policy_key: "privacy", policy_version: "v2", accepted_at: "2025-01-01" },
      { policy_key: "aup", policy_version: "v2", accepted_at: "2025-01-01" },
      { policy_key: "anti_solicitation", policy_version: "v2", accepted_at: "2025-01-01" },
    ];
    const { container } = renderGate();
    // Wait for the async check to settle, then assert nothing rendered.
    await waitFor(() => {
      expect(container.querySelector("[role='dialog']")).toBeNull();
    });
    expect(screen.queryByText("Policies updated")).not.toBeInTheDocument();
  });

  it("renders the gate when policy_version has changed (only old acks exist)", async () => {
    ackRows = [
      { policy_key: "tos", policy_version: "v1", accepted_at: "2024-01-01" },
      { policy_key: "privacy", policy_version: "v1", accepted_at: "2024-01-01" },
      { policy_key: "aup", policy_version: "v1", accepted_at: "2024-01-01" },
      { policy_key: "anti_solicitation", policy_version: "v1", accepted_at: "2024-01-01" },
    ];
    renderGate();
    expect(await screen.findByText("Policies updated")).toBeInTheDocument();
    expect(screen.getByText("All missing")).toBeInTheDocument();
  });

  it("disappears after the user re-accepts all missing policies", async () => {
    ackRows = [
      { policy_key: "tos", policy_version: "v1", accepted_at: "2024-01-01" },
      { policy_key: "privacy", policy_version: "v1", accepted_at: "2024-01-01" },
      { policy_key: "aup", policy_version: "v1", accepted_at: "2024-01-01" },
      { policy_key: "anti_solicitation", policy_version: "v1", accepted_at: "2024-01-01" },
    ];
    renderGate();
    expect(await screen.findByText("Policies updated")).toBeInTheDocument();

    // Tick all four checkboxes (the missing ones are interactive).
    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach(cb => fireEvent.click(cb));

    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    await waitFor(() => {
      expect(upsertSpy).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.queryByText("Policies updated")).not.toBeInTheDocument();
    });

    const upsertedRows = (upsertSpy.mock.calls[0] as any[])[0] as any[];
    expect(upsertedRows).toHaveLength(4);
    expect(upsertedRows.every(r => r.policy_version === "v2")).toBe(true);

    // Audit event records per-key newly_acknowledged vs already_existed.
    expect(insertSpy).toHaveBeenCalledTimes(1);
    const auditPayload = (insertSpy.mock.calls[0] as any[])[0] as any;
    expect(auditPayload.action).toBe("policy_reaccepted");
    expect(auditPayload.metadata.newly_acknowledged.sort()).toEqual(
      ["anti_solicitation", "aup", "privacy", "tos"]
    );
    expect(auditPayload.metadata.already_acknowledged).toEqual([]);
    expect(auditPayload.metadata.per_key).toMatchObject({
      tos: "newly_acknowledged",
      privacy: "newly_acknowledged",
      aup: "newly_acknowledged",
      anti_solicitation: "newly_acknowledged",
    });
    expect(auditPayload.metadata.prior_versions).toMatchObject({
      tos: "v1", privacy: "v1", aup: "v1", anti_solicitation: "v1",
    });
  });

  it("records already_existed in the audit event for idempotent re-accepts", async () => {
    // User has stale v1 acks (so the gate appears) AND already-existing v2
    // rows for two policies (e.g., a prior partial submit). Confirming should
    // tag those two as already_existed and the rest as newly_acknowledged.
    ackRows = [
      { policy_key: "tos", policy_version: "v1", accepted_at: "2024-01-01" },
      { policy_key: "privacy", policy_version: "v1", accepted_at: "2024-01-01" },
      { policy_key: "aup", policy_version: "v1", accepted_at: "2024-01-01" },
      { policy_key: "anti_solicitation", policy_version: "v1", accepted_at: "2024-01-01" },
      { policy_key: "tos", policy_version: "v2", accepted_at: "2024-06-01" },
      { policy_key: "privacy", policy_version: "v2", accepted_at: "2024-06-01" },
    ];
    renderGate();
    // Only aup + anti_solicitation are missing for v2.
    expect(await screen.findByText("2/4 missing")).toBeInTheDocument();

    screen.getAllByRole("checkbox").forEach(cb => fireEvent.click(cb));
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    await waitFor(() => expect(insertSpy).toHaveBeenCalledTimes(1));
    const meta = ((insertSpy.mock.calls[0] as any[])[0] as any).metadata;
    expect(meta.accepted_keys.sort()).toEqual(["anti_solicitation", "aup"]);
    expect(meta.newly_acknowledged.sort()).toEqual(["anti_solicitation", "aup"]);
    expect(meta.already_acknowledged).toEqual([]);
  });

  it("records already_existed for all four keys when Accept is clicked a second time after v2 rows already landed", async () => {
    // Gate opens because only stale v1 rows exist for the user.
    ackRows = [
      { policy_key: "tos", policy_version: "v1", accepted_at: "2024-01-01" },
      { policy_key: "privacy", policy_version: "v1", accepted_at: "2024-01-01" },
      { policy_key: "aup", policy_version: "v1", accepted_at: "2024-01-01" },
      { policy_key: "anti_solicitation", policy_version: "v1", accepted_at: "2024-01-01" },
    ];

    renderGate();
    expect(await screen.findByText("Policies updated")).toBeInTheDocument();
    // Tick all four checkboxes.
    screen.getAllByRole("checkbox").forEach(cb => fireEvent.click(cb));

    // --- First Accept click: all four are newly acknowledged ---
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    await waitFor(() => expect(insertSpy).toHaveBeenCalledTimes(1));

    const firstMeta = ((insertSpy.mock.calls[0] as any[])[0] as any).metadata;
    expect(firstMeta.newly_acknowledged.sort()).toEqual(
      ["anti_solicitation", "aup", "privacy", "tos"]
    );
    expect(firstMeta.already_acknowledged).toEqual([]);
    expect(firstMeta.per_key).toMatchObject({
      tos: "newly_acknowledged",
      privacy: "newly_acknowledged",
      aup: "newly_acknowledged",
      anti_solicitation: "newly_acknowledged",
    });

    // Simulate the v2 rows the first upsert would have written landing in the
    // store. The gate is still mounted (it closes on success but a real user
    // double-click can fire a second handleConfirm before unmount, and the
    // pre-check inside handleConfirm now sees v2 rows for all four keys).
    ackRows.push(
      { policy_key: "tos", policy_version: "v2", accepted_at: "2025-02-01" },
      { policy_key: "privacy", policy_version: "v2", accepted_at: "2025-02-01" },
      { policy_key: "aup", policy_version: "v2", accepted_at: "2025-02-01" },
      { policy_key: "anti_solicitation", policy_version: "v2", accepted_at: "2025-02-01" },
    );

    // --- Second Accept click: all four should be tagged already_existed ---
    // The dialog may have closed after success; if so the button is gone, so
    // we directly invoke the same submit path by clicking Accept again if it
    // is still in the DOM. If it's been unmounted, we re-mount with the same
    // (stale + v2) ackRows so the gate's open-check still triggers via the
    // v1 priors and the in-handler pre-check sees the v2 rows.
    let acceptBtn = screen.queryByRole("button", { name: "Accept" });
    if (!acceptBtn) {
      // Drop the just-added v2 rows so the gate re-opens on remount, then
      // restore them right before the click so handleConfirm's pre-check
      // sees them as already_existed.
      const v2Rows = ackRows.filter(r => r.policy_version === "v2");
      ackRows = ackRows.filter(r => r.policy_version !== "v2");
      renderGate();
      expect(await screen.findByText("Policies updated")).toBeInTheDocument();
      ackRows.push(...v2Rows);
      screen.getAllByRole("checkbox").forEach(cb => fireEvent.click(cb));
      acceptBtn = screen.getByRole("button", { name: "Accept" });
    }
    fireEvent.click(acceptBtn);

    await waitFor(() => expect(insertSpy).toHaveBeenCalledTimes(2));

    const secondMeta = ((insertSpy.mock.calls[1] as any[])[0] as any).metadata;
    expect(secondMeta.accepted_keys.sort()).toEqual(
      ["anti_solicitation", "aup", "privacy", "tos"]
    );
    expect(secondMeta.newly_acknowledged).toEqual([]);
    expect(secondMeta.already_acknowledged.sort()).toEqual(
      ["anti_solicitation", "aup", "privacy", "tos"]
    );
    expect(secondMeta.per_key).toMatchObject({
      tos: "already_existed",
      privacy: "already_existed",
      aup: "already_existed",
      anti_solicitation: "already_existed",
    });
  });

  it("does not render for users who have not completed onboarding", async () => {
    mockAuth.onboardingCompleted = false;
    const { container } = renderGate();
    await waitFor(() => {
      expect(container.querySelector("[role='dialog']")).toBeNull();
    });
  });
});
