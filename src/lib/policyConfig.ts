import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PolicyKey = "tos" | "privacy" | "aup" | "anti_solicitation";

export type PolicyConfig = {
  policy_version: string;
  urls: Record<PolicyKey, string>;
};

export const DEFAULT_POLICY_CONFIG: PolicyConfig = {
  policy_version: "2025-01-01",
  urls: {
    tos: "/legal/terms",
    privacy: "/legal/privacy",
    aup: "/legal/acceptable-use",
    anti_solicitation: "/legal/anti-solicitation",
  },
};

export async function fetchPolicyConfig(): Promise<PolicyConfig> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "policy_config")
    .maybeSingle();
  if (error || !data?.value) return DEFAULT_POLICY_CONFIG;
  const v = data.value as Partial<PolicyConfig>;
  return {
    policy_version: v.policy_version ?? DEFAULT_POLICY_CONFIG.policy_version,
    urls: { ...DEFAULT_POLICY_CONFIG.urls, ...(v.urls ?? {}) },
  };
}

export function usePolicyConfig() {
  const [config, setConfig] = useState<PolicyConfig>(DEFAULT_POLICY_CONFIG);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetchPolicyConfig().then(c => {
      if (active) {
        setConfig(c);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);
  return { config, loading };
}
