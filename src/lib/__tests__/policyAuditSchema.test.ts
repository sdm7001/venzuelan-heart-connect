import { describe, it, expect } from "vitest";
import {
  assertPolicyReacceptedMetadata,
  policyReacceptedMetadataSchema,
} from "../policyAuditSchema";

const validBase = {
  policy_version: "2025-02-01",
  accepted_keys: ["tos", "privacy", "aup", "anti_solicitation"] as const,
  newly_acknowledged: ["tos", "privacy"] as const,
  already_acknowledged: ["aup", "anti_solicitation"] as const,
  per_key: {
    tos: "newly_acknowledged",
    privacy: "newly_acknowledged",
    aup: "already_existed",
    anti_solicitation: "already_existed",
  },
  prior_versions: {
    tos: "2025-01-01",
    privacy: "2025-01-01",
    aup: null,
    anti_solicitation: "2024-12-01",
  },
};

describe("policyReacceptedMetadataSchema", () => {
  it("accepts a well-formed payload", () => {
    expect(() => assertPolicyReacceptedMetadata(validBase)).not.toThrow();
  });

  it("rejects unknown policy keys", () => {
    const bad = { ...validBase, accepted_keys: ["tos", "marketing"] };
    expect(() => assertPolicyReacceptedMetadata(bad)).toThrow();
  });

  it("rejects when newly + already do not partition accepted_keys", () => {
    const bad = {
      ...validBase,
      newly_acknowledged: ["tos"],
      already_acknowledged: ["aup", "anti_solicitation"],
      // privacy missing from both partitions
    };
    expect(() => assertPolicyReacceptedMetadata(bad)).toThrow(/partition|equal accepted_keys/i);
  });

  it("rejects per_key disagreeing with the partition", () => {
    const bad = {
      ...validBase,
      per_key: { ...validBase.per_key, tos: "already_existed" },
    };
    expect(() => assertPolicyReacceptedMetadata(bad)).toThrow(/disagrees/i);
  });

  it("rejects prior_versions equal to the active version", () => {
    const bad = {
      ...validBase,
      prior_versions: { ...validBase.prior_versions, tos: "2025-02-01" },
    };
    expect(() => assertPolicyReacceptedMetadata(bad)).toThrow(/must not equal the active/i);
  });

  it("rejects missing per_key entries", () => {
    const { aup, ...partialPerKey } = validBase.per_key;
    const bad = { ...validBase, per_key: partialPerKey };
    expect(policyReacceptedMetadataSchema.safeParse(bad).success).toBe(false);
  });
});
