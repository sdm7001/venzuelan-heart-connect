import { useEffect, useState } from "react";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/layout/AppLayout";
import { Flag } from "lucide-react";

export default function AdminReports() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setRows(data ?? []));
  }, []);

  return (
    <AdminLayout>
      <AdminPageHeader title="Reports queue" sub="Triage member-submitted reports" />
      {rows.length === 0 ? (
        <EmptyState icon={<Flag className="h-5 w-5" />} title="No reports yet" body="Member-submitted reports will appear here. Each can be triaged with status (new → in review → escalated → actioned → closed) and severity (low → critical)." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Target</th>
                <th className="px-4 py-3 text-left">Severity</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{r.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.target}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{r.severity}</Badge></td>
                  <td className="px-4 py-3"><Badge>{r.status}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
