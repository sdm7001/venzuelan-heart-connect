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
  });

  it("does not render for users who have not completed onboarding", async () => {
    mockAuth.onboardingCompleted = false;
    const { container } = renderGate();
    await waitFor(() => {
      expect(container.querySelector("[role='dialog']")).toBeNull();
    });
  });
});
