import { z } from "zod";
import type { PolicyKey } from "./policyConfig";

// Strict shape contract for `audit_events.metadata` when
// `action = 'policy_reaccepted'`. Validated client-side before insert so we
// can fail loudly during development instead of writing junk that the admin
// audit UI later has to parse defensively.
//
// Why this lives in its own module: the gate writes these events and the
// test suite asserts against the same shape — having the schema in one place
// keeps them honest.

export const POLICY_KEYS: readonly PolicyKey[] = [
  "tos",
  "privacy",
  "aup",
  "anti_solicitation",
] as const;

const policyKeyEnum = z.enum(["tos", "privacy", "aup", "anti_solicitation"] as const);

// Per-key status for THIS reacceptance flow. The set of keys here must
// equal `accepted_keys` (enforced via .superRefine below).
const perKeySchema = z.record(
  policyKeyEnum,
  z.enum(["newly_acknowledged", "already_existed"]),
);

// Snapshot of the most recent prior-version acceptance for each key at the
// moment the user re-accepted. `null` means the user had never accepted that
// policy at any earlier version.
const priorVersionsSchema = z.record(
  policyKeyEnum,
  z.string().min(1).nullable(),
);

export const policyReacceptedMetadataSchema = z
  .object({
    policy_version: z.string().min(1, "policy_version is required"),
    accepted_keys: z.array(policyKeyEnum).min(1, "accepted_keys cannot be empty"),
    newly_acknowledged: z.array(policyKeyEnum),
    already_acknowledged: z.array(policyKeyEnum),
    per_key: perKeySchema,
    prior_versions: priorVersionsSchema,
  })
  .superRefine((meta, ctx) => {
    const accepted = new Set(meta.accepted_keys);

    // newly + already must partition accepted_keys (no overlap, full cover).
    const overlap = meta.newly_acknowledged.filter((k) =>
      meta.already_acknowledged.includes(k),
    );
    if (overlap.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Keys cannot be both newly and already acknowledged: ${overlap.join(", ")}`,
        path: ["already_acknowledged"],
      });
    }
    const union = new Set([...meta.newly_acknowledged, ...meta.already_acknowledged]);
    if (union.size !== accepted.size || [...accepted].some((k) => !union.has(k))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "newly_acknowledged ∪ already_acknowledged must equal accepted_keys",
        path: ["newly_acknowledged"],
      });
    }

    // per_key must have an entry for every accepted key — and only those keys.
    const perKeyKeys = new Set(Object.keys(meta.per_key));
    const missingPerKey = [...accepted].filter((k) => !perKeyKeys.has(k));
    if (missingPerKey.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `per_key missing entries for: ${missingPerKey.join(", ")}`,
        path: ["per_key"],
      });
    }
    const extraPerKey = [...perKeyKeys].filter((k) => !accepted.has(k as PolicyKey));
    if (extraPerKey.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `per_key has unexpected entries: ${extraPerKey.join(", ")}`,
        path: ["per_key"],
      });
    }

    // per_key status must agree with the newly/already partitions.
    for (const k of accepted) {
      const status = meta.per_key[k];
      const expected = meta.newly_acknowledged.includes(k)
        ? "newly_acknowledged"
        : "already_existed";
      if (status !== expected) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `per_key[${k}]='${status}' disagrees with partition (expected '${expected}')`,
          path: ["per_key", k],
        });
      }
    }

    // prior_versions must cover every accepted key (value may be null).
    const priorKeys = new Set(Object.keys(meta.prior_versions));
    const missingPrior = [...accepted].filter((k) => !priorKeys.has(k));
    if (missingPrior.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `prior_versions missing entries for: ${missingPrior.join(", ")}`,
        path: ["prior_versions"],
      });
    }

    // prior_versions[k] must NEVER equal the active policy_version — by
    // definition it's the previous one (or null if user is brand new).
    for (const [k, v] of Object.entries(meta.prior_versions)) {
      if (v === meta.policy_version) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `prior_versions[${k}] must not equal the active policy_version`,
          path: ["prior_versions", k],
        });
      }
    }
  });

export type PolicyReacceptedMetadata = z.infer<typeof policyReacceptedMetadataSchema>;

/**
 * Throws a descriptive Error if the metadata doesn't match the contract.
 * Returns the typed metadata on success.
 */
export function assertPolicyReacceptedMetadata(
  metadata: unknown,
): PolicyReacceptedMetadata {
  const parsed = policyReacceptedMetadataSchema.safeParse(metadata);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid policy_reaccepted metadata — ${detail}`);
  }
  return parsed.data;
}
