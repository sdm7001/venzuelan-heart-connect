// Seed demo data for the MatchVenezuelan P0 foundation.
// Caller must be authenticated AND have the 'admin' role.
// Idempotent-ish: re-running upserts demo accounts and appends a fresh batch
// of demo reports/flags/billing/audit so you can keep stress-testing queues.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY")!;

const DEMO_PASSWORD = "DemoMatch2025!";

type Role =
  | "female_user" | "male_user" | "moderator" | "admin"
  | "support" | "verification_reviewer";

type DemoUser = {
  email: string;
  display_name: string;
  role: Role;
  gender?: "female" | "male";
  country?: string;
  city?: string;
  bio?: string;
  intention?: "marriage" | "serious_relationship" | "travel_meet" | "friendship_first";
  language?: "en" | "es";
};

const DEMO_USERS: DemoUser[] = [
  { email: "demo.admin@matchvenezuelan.test",     display_name: "Demo Admin",     role: "admin" },
  { email: "demo.mod@matchvenezuelan.test",       display_name: "Demo Moderator", role: "moderator" },
  { email: "demo.support@matchvenezuelan.test",   display_name: "Demo Support",   role: "support" },
  { email: "demo.verify@matchvenezuelan.test",    display_name: "Demo Verifier",  role: "verification_reviewer" },
  { email: "demo.maria@matchvenezuelan.test",     display_name: "María C.",   role: "female_user", gender: "female", country: "Venezuela", city: "Caracas",   intention: "marriage",            language: "es", bio: "Profesora de español. Me encanta la salsa, los libros y los viajes." },
  { email: "demo.valentina@matchvenezuelan.test", display_name: "Valentina R.", role: "female_user", gender: "female", country: "Spain",     city: "Madrid",    intention: "serious_relationship", language: "es", bio: "Caraqueña en Madrid. Buscando algo serio y respetuoso." },
  { email: "demo.luisa@matchvenezuelan.test",     display_name: "Luisa P.",   role: "female_user", gender: "female", country: "Italy",     city: "Milan",     intention: "marriage",            language: "en", bio: "Engineer, Venezuelan roots. Family means everything." },
  { email: "demo.james@matchvenezuelan.test",     display_name: "James W.",   role: "male_user",   gender: "male",   country: "USA",       city: "Miami",     intention: "marriage",            language: "en", bio: "Architect, traveled to Caracas twice. Looking for a real partner." },
  { email: "demo.thomas@matchvenezuelan.test",    display_name: "Thomas K.",  role: "male_user",   gender: "male",   country: "Germany",   city: "Berlin",    intention: "serious_relationship", language: "en", bio: "Doctor in Berlin. Speak some Spanish, learning more." },
  { email: "demo.daniel@matchvenezuelan.test",    display_name: "Daniel S.",  role: "male_user",   gender: "male",   country: "Canada",    city: "Toronto",   intention: "travel_meet",         language: "en", bio: "Software founder, love Latin culture and food." },
  { email: "demo.badactor@matchvenezuelan.test",  display_name: "Suspicious User", role: "male_user", gender: "male", country: "Unknown", city: "—", intention: "travel_meet", language: "en", bio: "[seed] Demo bad-actor account used to populate the moderation queue." },
];

const REPORT_CATEGORIES = [
  "scam_or_fraud", "solicitation", "off_platform_payment_request",
  "harassment", "explicit_content", "impersonation", "spam",
] as const;

const SEVERITY_BY_CATEGORY: Record<string, "low" | "medium" | "high" | "critical"> = {
  scam_or_fraud: "high",
  solicitation: "critical",
  off_platform_payment_request: "high",
  harassment: "medium",
  explicit_content: "high",
  impersonation: "high",
  spam: "low",
};

const STATUS_DISTRIBUTION: ("new" | "in_review" | "escalated" | "actioned" | "closed")[] =
  ["new", "new", "new", "in_review", "in_review", "escalated", "actioned", "closed"];

const REPORT_DESCRIPTIONS: Record<string, string> = {
  scam_or_fraud: "User asked me to send money via Western Union after only two messages.",
  solicitation: "Profile is offering paid 'companionship' services. This violates the platform.",
  off_platform_payment_request: "Asked me to pay for a video call through CashApp.",
  harassment: "Repeated unwanted messages after I declined to respond.",
  explicit_content: "Profile photos contain explicit content.",
  impersonation: "Photos appear to be stolen from a public Instagram account.",
  spam: "Same copy-pasted opening message sent dozens of times.",
};

async function ensureUser(admin: any, u: DemoUser): Promise<string> {
  const { data: created, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: {
      display_name: u.display_name,
      account_type: u.role,
      preferred_language: u.language ?? "en",
      age_confirmed: true,
    },
  });

  let userId: string | undefined = created?.user?.id;

  if (error || !userId) {
    for (let page = 1; page <= 5 && !userId; page++) {
      const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      const match = list?.users.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());
      if (match) userId = match.id;
      if (!list || list.users.length < 200) break;
    }
    if (!userId) throw new Error(`Could not create or locate user ${u.email}: ${error?.message}`);
  }

  await admin.from("profiles").update({
    display_name: u.display_name,
    gender: u.gender ?? null,
    country: u.country ?? null,
    city: u.city ?? null,
    bio: u.bio ?? null,
    relationship_intention: u.intention ?? null,
    preferred_language: u.language ?? "en",
    age_confirmed: true,
    onboarding_completed: true,
    community_rules_accepted_at: new Date().toISOString(),
    account_status: "active",
  }).eq("id", userId);

  const { data: existingRoles } = await admin.from("user_roles").select("role").eq("user_id", userId);
  const has = new Set((existingRoles ?? []).map((r: any) => r.role));
  if (!has.has(u.role)) {
    await admin.from("user_roles").insert({ user_id: userId, role: u.role });
  }

  return userId;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing bearer token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    const admin: any = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", callerId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const idsByEmail: Record<string, string> = {};
    for (const u of DEMO_USERS) {
      idsByEmail[u.email] = await ensureUser(admin, u);
    }

    const adminId       = idsByEmail["demo.admin@matchvenezuelan.test"];
    const modId         = idsByEmail["demo.mod@matchvenezuelan.test"];
    const verifyId      = idsByEmail["demo.verify@matchvenezuelan.test"];
    const badActorId    = idsByEmail["demo.badactor@matchvenezuelan.test"];
    const femaleIds = [
      idsByEmail["demo.maria@matchvenezuelan.test"],
      idsByEmail["demo.valentina@matchvenezuelan.test"],
      idsByEmail["demo.luisa@matchvenezuelan.test"],
    ];
    const maleIds = [
      idsByEmail["demo.james@matchvenezuelan.test"],
      idsByEmail["demo.thomas@matchvenezuelan.test"],
      idsByEmail["demo.daniel@matchvenezuelan.test"],
    ];

    const now = Date.now();
    const reportRows = REPORT_CATEGORIES.map((cat, i) => {
      const reporter = femaleIds[i % femaleIds.length];
      const reportedUser = i === REPORT_CATEGORIES.length - 1
        ? maleIds[0]
        : badActorId;
      const status = STATUS_DISTRIBUTION[i % STATUS_DISTRIBUTION.length];
      return {
        reporter_id: reporter,
        reported_user_id: reportedUser,
        target: "profile",
        category: cat,
        severity: SEVERITY_BY_CATEGORY[cat],
        status,
        description: `[seed] ${REPORT_DESCRIPTIONS[cat]}`,
        assigned_to: status === "new" ? null : modId,
        created_at: new Date(now - (i + 1) * 3_600_000).toISOString(),
      };
    });
    const { data: insertedReports, error: repErr } = await admin
      .from("reports").insert(reportRows).select("id,status,reported_user_id,category");
    if (repErr) throw repErr;

    const actions: any[] = [];
    for (const r of insertedReports ?? []) {
      if (r.status === "new") continue;
      actions.push({
        report_id: r.id, target_user_id: r.reported_user_id, moderator_id: modId,
        action: "add_note", notes: "[seed] Triaged. Gathering more evidence.",
      });
      if (r.status === "actioned") {
        actions.push({
          report_id: r.id, target_user_id: r.reported_user_id, moderator_id: modId,
          action: "warn_user", notes: "[seed] Sent formal warning per policy.",
        });
      }
      if (r.status === "escalated") {
        actions.push({
          report_id: r.id, target_user_id: r.reported_user_id, moderator_id: modId,
          action: "escalate", notes: "[seed] Pattern across multiple reports — escalating to admin.",
        });
      }
      if (r.status === "closed") {
        actions.push({
          report_id: r.id, target_user_id: r.reported_user_id, moderator_id: modId,
          action: "close_case", notes: "[seed] No violation found after review.",
        });
      }
    }
    if (actions.length) await admin.from("moderation_actions").insert(actions);

    await admin.from("moderation_flags").insert([
      { user_id: badActorId, kind: "scam_or_fraud", severity: "high", status: "new", source: "automated_scan", context: { signal: "money_keyword_count", value: 4 } },
      { user_id: badActorId, kind: "solicitation",  severity: "critical", status: "in_review", source: "automated_scan", context: { signal: "external_url_in_bio", url: "example.com/services" } },
      { user_id: maleIds[2], kind: "spam",          severity: "low",  status: "new", source: "rate_limit", context: { signal: "messages_per_minute", value: 60 } },
    ]);

    await admin.from("verification_requests").insert([
      { user_id: femaleIds[0], type: "photo",     status: "submitted",        submitted_at: new Date().toISOString() },
      { user_id: femaleIds[1], type: "id",        status: "under_review",     submitted_at: new Date().toISOString(), reviewer_id: verifyId },
      { user_id: maleIds[0],   type: "social",    status: "needs_more_info",  submitted_at: new Date().toISOString(), reviewer_id: verifyId, reviewer_notes: "[seed] LinkedIn link returns 404." },
      { user_id: maleIds[1],   type: "concierge", status: "approved",         submitted_at: new Date().toISOString(), resolved_at: new Date().toISOString(), reviewer_id: verifyId },
    ]);

    const billing: any[] = [];
    for (const id of maleIds) {
      billing.push(
        { user_id: id, event_type: "subscription_started", amount_cents: 2999, currency: "USD", metadata: { tier: "level_1", source: "seed" } },
        { user_id: id, event_type: "credit_purchase",      amount_cents: 999,  currency: "USD", metadata: { credits: 50, source: "seed" } },
      );
    }
    billing.push({ user_id: maleIds[0], event_type: "refund_issued", amount_cents: -999, currency: "USD", metadata: { reason: "demo_refund", source: "seed" } });
    await admin.from("billing_events").insert(billing);

    const { data: wallets } = await admin.from("credit_wallets").select("id,user_id").in("user_id", maleIds);
    if (wallets && wallets.length) {
      await admin.from("credit_transactions").insert(
        wallets.map((w: any) => ({ wallet_id: w.id, delta: 50, reason: "[seed] welcome credits" })),
      );
      for (const w of wallets) {
        await admin.from("credit_wallets").update({ balance: 50 }).eq("id", w.id);
      }
    }

    await admin.from("audit_events").insert({
      actor_id: callerId,
      subject_id: callerId,
      category: "admin",
      action: "demo_data_seeded",
      metadata: {
        users_created_or_updated: Object.keys(idsByEmail).length,
        reports_inserted: reportRows.length,
        moderation_actions_inserted: actions.length,
        billing_events_inserted: billing.length,
      },
    });

    return new Response(JSON.stringify({
      ok: true,
      summary: {
        users: Object.keys(idsByEmail).length,
        reports: reportRows.length,
        moderation_actions: actions.length,
        flags: 3,
        verifications: 4,
        billing_events: billing.length,
      },
      demo_credentials: {
        password: DEMO_PASSWORD,
        accounts: DEMO_USERS.map((u) => ({ email: u.email, role: u.role })),
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("seed-demo error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
