// Automated RLS test for gift_orders / gift_order_events.
//
// Verifies, against the LIVE database, that:
//   1. A male user with no trust badge CANNOT insert a gift_order
//      (is_eligible_for_gifting RLS guard).
//   2. A male user with a trust badge CAN insert a gift_order.
//   3. A third party (neither sender nor recipient, non-staff) CANNOT
//      read that gift_order or its events.
//   4. The recipient CAN read the gift_order and its events.
//   5. Staff CAN read the gift_order and its events.
//
// It also reports a NOTICE when the current RLS does not enforce a
// gender check on the sender, so business rules don't silently drift.
//
// Caller must be authenticated AND have the 'admin' role.
//
// All test users/data are created with the service role and cleaned up
// at the end. Never run this against production data without confirming
// the cleanup step succeeds.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY =
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY")!;

const TEST_PASSWORD = "GiftRlsTest!2025";

type CheckResult = {
  name: string;
  pass: boolean;
  detail: string;
};

function ok(name: string, detail = ""): CheckResult {
  return { name, pass: true, detail };
}
function fail(name: string, detail: string): CheckResult {
  return { name, pass: false, detail };
}

async function ensureUser(
  // deno-lint-ignore no-explicit-any
  admin: any,
  email: string,
  meta: Record<string, unknown>,
): Promise<string> {
  // Try create; if exists, look up.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: meta,
  });
  if (created?.user?.id) return created.user.id;

  if (createErr && !/already/i.test(createErr.message)) {
    throw new Error(`createUser(${email}): ${createErr.message}`);
  }

  // Fallback: page through users to find by email (small test set).
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  throw new Error(`Could not locate user ${email}`);
}

async function signInClient(email: string) {
  const c = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: TEST_PASSWORD });
  if (error) throw new Error(`signIn(${email}): ${error.message}`);
  return c;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // --- Authn / authz: caller must be an admin ---
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing bearer token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: caller, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr || !caller?.user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
    _user_id: caller.user.id,
    _role: "admin",
  });
  if (roleErr || !isAdmin) {
    return new Response(JSON.stringify({ error: "Admin role required" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: CheckResult[] = [];
  const notes: string[] = [];
  const stamp = Date.now();
  const senderEmail = `gift.rls.sender.${stamp}@matchvenezuelan.test`;
  const recipientEmail = `gift.rls.recipient.${stamp}@matchvenezuelan.test`;
  const outsiderEmail = `gift.rls.outsider.${stamp}@matchvenezuelan.test`;
  const staffEmail = `gift.rls.staff.${stamp}@matchvenezuelan.test`;

  let senderId = "", recipientId = "", outsiderId = "", staffId = "";
  let badgeId: string | null = null;
  let blockedOrderId: string | null = null;
  let allowedOrderId: string | null = null;
  let eventId: string | null = null;

  try {
    // 1. Provision four isolated test users via service role.
    senderId = await ensureUser(admin, senderEmail, {
      account_type: "male_user", display_name: "RLS Sender", preferred_language: "en",
    });
    recipientId = await ensureUser(admin, recipientEmail, {
      account_type: "female_user", display_name: "RLS Recipient", preferred_language: "en",
    });
    outsiderId = await ensureUser(admin, outsiderEmail, {
      account_type: "male_user", display_name: "RLS Outsider", preferred_language: "en",
    });
    staffId = await ensureUser(admin, staffEmail, {
      account_type: "moderator", display_name: "RLS Staff", preferred_language: "en",
    });

    // 2. Force onboarding_completed = true for all four (RLS gates depend on it).
    await admin.from("profiles").update({ onboarding_completed: true })
      .in("id", [senderId, recipientId, outsiderId, staffId]);

    // 3. Pick any active gift to use.
    const { data: gifts, error: giftErr } = await admin
      .from("gifts").select("id").eq("active", true).limit(1);
    if (giftErr) throw new Error(`load gifts: ${giftErr.message}`);
    if (!gifts || gifts.length === 0) {
      // Insert a temporary one if catalog is empty.
      const { data: g, error: gErr } = await admin.from("gifts").insert({
        code: `rls_test_${stamp}`, name: "RLS Test Gift", credit_cost: 1, active: true,
      }).select("id").single();
      if (gErr) throw new Error(`create test gift: ${gErr.message}`);
      gifts!.push(g);
    }
    const giftId = gifts![0].id as string;

    // ---- CHECK 1: ineligible sender (no trust badge) is BLOCKED by RLS ----
    {
      const senderClient = await signInClient(senderEmail);
      const { error } = await senderClient.from("gift_orders").insert({
        sender_id: senderId, recipient_id: recipientId, gift_id: giftId,
        kind: "virtual", credit_cost: 1, status: "created", message: "blocked",
      }).select("id").single();
      if (error) {
        results.push(ok(
          "Ineligible sender blocked from inserting gift_orders",
          `RLS rejected as expected: ${error.message}`,
        ));
      } else {
        results.push(fail(
          "Ineligible sender blocked from inserting gift_orders",
          "INSERT succeeded but is_eligible_for_gifting should be false (no trust badge).",
        ));
        // Capture id for cleanup.
        const { data: rows } = await admin.from("gift_orders").select("id")
          .eq("sender_id", senderId).order("created_at", { ascending: false }).limit(1);
        if (rows?.[0]) blockedOrderId = rows[0].id;
      }
    }

    // ---- Award a trust badge to the sender (service role) so they become eligible ----
    {
      const { data: b, error } = await admin.from("trust_badges").insert({
        user_id: senderId, kind: "photo_verified", awarded_by: caller.user.id,
      }).select("id").single();
      if (error) throw new Error(`award badge: ${error.message}`);
      badgeId = b.id;
    }

    // ---- CHECK 2: eligible sender CAN insert gift_orders ----
    {
      const senderClient = await signInClient(senderEmail);
      const { data, error } = await senderClient.from("gift_orders").insert({
        sender_id: senderId, recipient_id: recipientId, gift_id: giftId,
        kind: "virtual", credit_cost: 1, status: "created", message: "allowed",
      }).select("id").single();
      if (error || !data) {
        results.push(fail(
          "Eligible sender can insert gift_orders",
          `Expected success but got: ${error?.message ?? "no row returned"}`,
        ));
      } else {
        allowedOrderId = data.id;
        results.push(ok("Eligible sender can insert gift_orders", `order ${data.id}`));
      }
    }

    // Seed a status event via service role (only staff can insert per RLS).
    if (allowedOrderId) {
      const { data: ev, error } = await admin.from("gift_order_events").insert({
        order_id: allowedOrderId, status: "processing", actor_id: caller.user.id,
        notes: "RLS test event",
      }).select("id").single();
      if (error) throw new Error(`seed event: ${error.message}`);
      eventId = ev.id;
    }

    // ---- CHECK 3a: outsider CANNOT read the gift_order ----
    if (allowedOrderId) {
      const outsider = await signInClient(outsiderEmail);
      // Force role refresh / onboarding.
      await admin.from("profiles").update({ onboarding_completed: true }).eq("id", outsiderId);
      const { data, error } = await outsider.from("gift_orders")
        .select("id").eq("id", allowedOrderId).maybeSingle();
      if (error) {
        results.push(ok("Outsider cannot read gift_orders",
          `Query errored (acceptable): ${error.message}`));
      } else if (data) {
        results.push(fail("Outsider cannot read gift_orders",
          "Outsider was able to SELECT the order — RLS leak."));
      } else {
        results.push(ok("Outsider cannot read gift_orders", "Returned 0 rows as expected."));
      }
    }

    // ---- CHECK 3b: outsider CANNOT read gift_order_events ----
    if (allowedOrderId) {
      const outsider = await signInClient(outsiderEmail);
      const { data, error } = await outsider.from("gift_order_events")
        .select("id").eq("order_id", allowedOrderId);
      if (error) {
        results.push(ok("Outsider cannot read gift_order_events",
          `Query errored (acceptable): ${error.message}`));
      } else if (data && data.length > 0) {
        results.push(fail("Outsider cannot read gift_order_events",
          `Outsider got ${data.length} event row(s) — RLS leak.`));
      } else {
        results.push(ok("Outsider cannot read gift_order_events", "Returned 0 rows as expected."));
      }
    }

    // ---- CHECK 4: recipient CAN read order + events ----
    if (allowedOrderId) {
      const recipient = await signInClient(recipientEmail);
      const { data: o } = await recipient.from("gift_orders")
        .select("id").eq("id", allowedOrderId).maybeSingle();
      results.push(o
        ? ok("Recipient can read their gift_orders")
        : fail("Recipient can read their gift_orders", "Recipient saw 0 rows."));

      const { data: ev } = await recipient.from("gift_order_events")
        .select("id").eq("order_id", allowedOrderId);
      results.push((ev && ev.length > 0)
        ? ok("Recipient can read gift_order_events", `${ev.length} event(s)`)
        : fail("Recipient can read gift_order_events", "Recipient saw 0 events."));
    }

    // ---- CHECK 5: staff (moderator) CAN read order + events ----
    if (allowedOrderId) {
      // grant moderator role
      await admin.from("user_roles").upsert(
        { user_id: staffId, role: "moderator" },
        { onConflict: "user_id,role" },
      );
      const staff = await signInClient(staffEmail);
      const { data: o } = await staff.from("gift_orders")
        .select("id").eq("id", allowedOrderId).maybeSingle();
      results.push(o
        ? ok("Staff can read any gift_orders")
        : fail("Staff can read any gift_orders", "Moderator saw 0 rows."));

      const { data: ev } = await staff.from("gift_order_events")
        .select("id").eq("order_id", allowedOrderId);
      results.push((ev && ev.length > 0)
        ? ok("Staff can read gift_order_events", `${ev.length} event(s)`)
        : fail("Staff can read gift_order_events", "Moderator saw 0 events."));
    }

    // ---- Notice: gender enforcement ----
    notes.push(
      "NOTE: Current RLS on gift_orders enforces is_eligible_for_gifting() but does NOT " +
      "restrict sender gender. If 'only male users can send' is a business rule, add it " +
      "to is_eligible_for_gifting or a new RLS clause — this test will not catch it today.",
    );
  } catch (e) {
    results.push(fail("Harness", (e as Error).message));
  } finally {
    // Cleanup — best effort, service role.
    try {
      if (eventId) await admin.from("gift_order_events").delete().eq("id", eventId);
      if (allowedOrderId) await admin.from("gift_orders").delete().eq("id", allowedOrderId);
      if (blockedOrderId) await admin.from("gift_orders").delete().eq("id", blockedOrderId);
      if (badgeId) await admin.from("trust_badges").delete().eq("id", badgeId);
      for (const id of [senderId, recipientId, outsiderId, staffId]) {
        if (id) {
          await admin.auth.admin.deleteUser(id).catch(() => {});
        }
      }
    } catch (_) { /* swallow cleanup errors */ }
  }

  const summary = {
    total: results.length,
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass).length,
  };

  return new Response(
    JSON.stringify({ summary, results, notes }, null, 2),
    {
      status: summary.failed === 0 ? 200 : 207,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
