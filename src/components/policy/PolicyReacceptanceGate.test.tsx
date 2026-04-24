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

// Supabase client mock — chainable query builder.
type Row = { policy_key: string; policy_version: string; accepted_at: string };
let ackRows: Row[] = [];
const upsertSpy = vi.fn(async () => ({ error: null }));
const insertSpy = vi.fn(async () => ({ error: null }));

vi.mock("@/integrations/supabase/client", () => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn(async () => ({ data: ackRows, error: null })),
  };
  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === "policy_acknowledgements") {
          return {
            ...builder,
            upsert: upsertSpy,
          };
        }
        if (table === "audit_events") {
          return { insert: insertSpy };
        }
        return builder;
      }),
    },
  };
});

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
