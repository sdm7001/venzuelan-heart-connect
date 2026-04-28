import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import {
  DEFAULT_POLICY_CONFIG,
  PolicyConfig,
  PolicyKey,
  fetchPolicyConfig,
} from "@/lib/policyConfig";
import { format } from "date-fns";
import { History, Save, RotateCcw, FileText } from "lucide-react";

const POLICY_FIELDS: { key: PolicyKey; label: string }[] = [
  { key: "tos", label: "Terms of Service URL" },
  { key: "privacy", label: "Privacy Policy URL" },
  { key: "aup", label: "Acceptable Use Policy URL" },
  { key: "anti_solicitation", label: "Anti-Solicitation Policy URL" },
];

// version like 2025-01-01 OR semver-ish
const versionSchema = z
  .string()
  .trim()
  .min(3, "Version is required")
  .max(40, "Version too long")
  .regex(/^[A-Za-z0-9._-]+$/, "Use letters, numbers, '.', '_' or '-'");

const urlSchema = z
  .string()
  .trim()
  .min(1, "URL is required")
  .max(500, "URL too long")
  .refine(v => v.startsWith("/") || /^https?:\/\//i.test(v), {
    message: "Must start with '/' or http(s)://",
  });

type HistoryRow = {
  id: string;
  value: PolicyConfig;
  changed_by: string | null;
  changed_at: string;
};

export function AdminPolicies() {
  const { isAdmin, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState<PolicyConfig>(DEFAULT_POLICY_CONFIG);
  const [draft, setDraft] = useState<PolicyConfig>(DEFAULT_POLICY_CONFIG);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("app_settings")
      .select("value, updated_at")
      .eq("key", "policy_config")
      .maybeSingle();
    const cfg = data?.value
      ? {
          policy_version:
            (data.value as { policy_version?: string; urls?: Record<string, string> } | null)?.policy_version ?? DEFAULT_POLICY_CONFIG.policy_version,
          urls: { ...DEFAULT_POLICY_CONFIG.urls, ...((data.value as { policy_version?: string; urls?: Record<string, string> } | null)?.urls ?? {}) },
        }
      : await fetchPolicyConfig();
    setOriginal(cfg);
    setDraft(cfg);
    setUpdatedAt(data?.updated_at ?? null);

    const { data: hist } = await supabase
      .from("app_settings_history")
      .select("id, value, changed_by, changed_at")
      .eq("key", "policy_config")
      .order("changed_at", { ascending: false })
      .limit(10);
    setHistory((hist as HistoryRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(original), [draft, original]);

  function setUrl(key: PolicyKey, value: string) {
    setDraft(d => ({ ...d, urls: { ...d.urls, [key]: value } }));
  }

  async function handleSave() {
    if (!isAdmin) return;
    const versionParse = versionSchema.safeParse(draft.policy_version);
    if (!versionParse.success) return toast.error(versionParse.error.issues[0].message);
    for (const f of POLICY_FIELDS) {
      const r = urlSchema.safeParse(draft.urls[f.key]);
      if (!r.success) return toast.error(`${f.label}: ${r.error.issues[0].message}`);
    }

    setSaving(true);
    const versionChanged = draft.policy_version !== original.policy_version;

    const { error } = await supabase
      .from("app_settings")
      .update({ value: draft as never, updated_by: user?.id ?? null } as never)
      .eq("key", "policy_config");

    if (error) {
      setSaving(false);
      return toast.error(error.message);
    }

    await supabase.from("app_settings_history").insert({
      key: "policy_config",
      value: draft as never,
      changed_by: user?.id ?? null,
    } as never);

    await supabase.from("audit_events").insert({
      actor_id: user?.id ?? null,
      category: "policy",
      action: versionChanged ? "policy_version_bumped" : "policy_urls_updated",
      metadata: {
        previous: original,
        next: draft,
      } as never,
    } as never);

    toast.success(
      versionChanged
        ? `Saved. Members will be re-prompted to accept v${draft.policy_version}.`
        : "Policy URLs updated."
    );
    setSaving(false);
    load();
  }

  function handleReset() { setDraft(original); }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Policies & legal URLs"
        sub="Manage the active policy version and the URLs members link to during onboarding. Bumping the version re-prompts members to acknowledge."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={!dirty || saving}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!dirty || saving || !isAdmin}>
              <Save className="h-4 w-4 mr-1" /> {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        }
      />

      {!isAdmin && (
        <div className="mb-4 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Read-only — only admins can change policy settings.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Active configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="policy_version">Policy version</Label>
              <Input
                id="policy_version"
                value={draft.policy_version}
                onChange={(e) => setDraft(d => ({ ...d, policy_version: e.target.value }))}
                placeholder="2025-01-01"
                disabled={!isAdmin || loading}
              />
              <p className="text-xs text-muted-foreground">
                When changed, all members must re-acknowledge the policies before continuing.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              {POLICY_FIELDS.map(f => (
                <div key={f.key} className="space-y-2">
                  <Label htmlFor={`url-${f.key}`}>{f.label}</Label>
                  <Input
                    id={`url-${f.key}`}
                    value={draft.urls[f.key]}
                    onChange={(e) => setUrl(f.key, e.target.value)}
                    placeholder="/legal/..."
                    disabled={!isAdmin || loading}
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Use a relative path (<code>/legal/terms</code>) for in-app pages, or a full <code>https://</code> URL for externally hosted documents.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> Recent changes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground">
              {updatedAt ? `Last updated ${format(new Date(updatedAt), "PPp")}` : "No updates yet."}
            </div>
            <Separator />
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No history recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {history.map(h => (
                  <li key={h.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        v{h.value?.policy_version ?? "?"}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {format(new Date(h.changed_at), "PPp")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default AdminPolicies;
