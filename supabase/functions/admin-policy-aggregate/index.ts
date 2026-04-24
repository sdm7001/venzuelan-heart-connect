// Aggregates blocked / re-accepted members for the policy admin page,
// performing the join + pagination + sorting server-side so the table
// stays responsive even with very large member counts.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const POLICY_KEYS = ["tos", "privacy", "aup", "anti_solicitation"] as const;
type PolicyKey = typeof POLICY_KEYS[number];

type Mode = "blocked" | "completed";
type SortField = "name" | "accepted_at" | "missing_count";
type SortDir = "asc" | "desc";

type AggRow = {
  user_id: string;
  display_name: string | null;
  account_status: string;
  has_current: boolean;
  accepted_keys: number;
  missing_keys: PolicyKey[];
  accepted_at: string | null;       // latest current-version ack
  last_prior_at: string | null;
  last_prior_version: string | null;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // --- AuthN: identify caller via their JWT.
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);

    // --- AuthZ: must be staff.
    const { data: staffOk, error: staffErr } = await userClient.rpc("is_staff", {
      _user_id: userData.user.id,
    });
    if (staffErr || !staffOk) return json({ error: "forbidden" }, 403);

    // --- Parse + validate input.
    const body = await req.json().catch(() => ({}));
    const mode: Mode = body.mode === "completed" ? "completed" : "blocked";
    const exportAll = body.all === true;
    const page = Math.max(1, Math.min(1_000_000, Number(body.page) || 1));
    const pageSize = Math.max(1, Math.min(200, Number(body.pageSize) || 50));
    const search = (typeof body.search === "string" ? body.search : "").trim().toLowerCase();
    const sortField: SortField =
      body.sortField === "accepted_at" || body.sortField === "missing_count"
        ? body.sortField
        : "name";
    const sortDir: SortDir = body.sortDir === "asc" ? "asc" : "desc";
    const policyVersion = typeof body.policyVersion === "string" ? body.policyVersion : null;
    if (!policyVersion) return json({ error: "policyVersion required" }, 400);
    // "before" / "after" / "all" — filters profiles by created_at relative to
    // the most recent policy bump audit event for the active version.
    const onboardedFilter: "before" | "after" | "all" =
      body.onboardedFilter === "before" || body.onboardedFilter === "after"
        ? body.onboardedFilter
        : "all";

    const admin = createClient(url, serviceKey);

    // Find when the active policy version was bumped (most recent
    // policy_version_bumped event whose `next` matches). Falls back to null
    // when there's no bump on record (e.g., initial deploy).
    const { data: bumpEvent } = await admin
      .from("audit_events")
      .select("created_at, metadata")
      .eq("category", "policy")
      .eq("action", "policy_version_bumped")
      .order("created_at", { ascending: false })
      .limit(20);
    const bumpRow = (bumpEvent ?? []).find(
      (e: any) => e?.metadata?.next?.policy_version === policyVersion
    );
    const bumpedAt: string | null = bumpRow?.created_at ?? null;

    const [{ data: profiles, error: pErr }, { data: acks, error: aErr }] = await Promise.all([
      admin
        .from("profiles")
        .select("id, display_name, account_status, created_at")
        .eq("onboarding_completed", true)
        .limit(10000),
      admin
        .from("policy_acknowledgements")
        .select("user_id, policy_key, policy_version, accepted_at")
        .order("accepted_at", { ascending: false })
        .limit(50000),
    ]);
    if (pErr) return json({ error: pErr.message }, 500);
    if (aErr) return json({ error: aErr.message }, 500);

    const acksByUser = new Map<string, typeof acks>();
    for (const a of acks ?? []) {
      const list = acksByUser.get(a.user_id) ?? [];
      list.push(a);
      acksByUser.set(a.user_id, list);
    }

    const aggregated: AggRow[] = (profiles ?? []).map((u) => {
      const list = acksByUser.get(u.id) ?? [];
      const current = list.filter((a) => a.policy_version === policyVersion);
      const currentKeys = new Set(current.map((a) => a.policy_key as PolicyKey));
      const hasCurrent = POLICY_KEYS.every((k) => currentKeys.has(k));
      const acceptedAt = hasCurrent
        ? current.map((a) => a.accepted_at).sort().slice(-1)[0] ?? null
        : null;
      const prior = list.filter((a) => a.policy_version !== policyVersion);
      const lastPrior = prior[0]; // already desc by accepted_at
      return {
        user_id: u.id,
        display_name: u.display_name,
        account_status: u.account_status,
        has_current: hasCurrent,
        accepted_keys: currentKeys.size,
        missing_keys: POLICY_KEYS.filter((k) => !currentKeys.has(k)),
        accepted_at: acceptedAt,
        last_prior_at: lastPrior?.accepted_at ?? null,
        last_prior_version: lastPrior?.policy_version ?? null,
      };
    });

    // Filter by mode + search.
    let filtered = aggregated.filter((r) =>
      mode === "blocked" ? !r.has_current : r.has_current
    );
    if (search) {
      filtered = filtered.filter(
        (r) =>
          (r.display_name ?? "").toLowerCase().includes(search) ||
          r.user_id.toLowerCase().includes(search)
      );
    }

    // Sort server-side.
    const dir = sortDir === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      let va: number | string;
      let vb: number | string;
      if (sortField === "name") {
        va = (a.display_name ?? "").toLowerCase();
        vb = (b.display_name ?? "").toLowerCase();
      } else if (sortField === "accepted_at") {
        // Use whichever date is meaningful for the mode.
        va = (mode === "completed" ? a.accepted_at : a.last_prior_at) ?? "";
        vb = (mode === "completed" ? b.accepted_at : b.last_prior_at) ?? "";
      } else {
        va = a.missing_keys.length;
        vb = b.missing_keys.length;
      }
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });

    const total = filtered.length;
    const rows = exportAll
      ? filtered
      : filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

    return json({
      rows,
      total,
      page: exportAll ? 1 : page,
      pageSize: exportAll ? total : pageSize,
      pageCount: exportAll ? 1 : Math.max(1, Math.ceil(total / pageSize)),
      // Whole-set totals so the stat cards stay accurate regardless of page.
      totals: {
        blocked: aggregated.filter((r) => !r.has_current).length,
        completed: aggregated.filter((r) => r.has_current).length,
        total: aggregated.length,
      },
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
