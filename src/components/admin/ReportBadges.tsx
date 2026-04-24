import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReportStatus, ReportSeverity, ModeratorAction } from "@/lib/moderation";

const statusStyle: Record<ReportStatus, string> = {
  new: "bg-info/15 text-info",
  in_review: "bg-warning/20 text-warning",
  escalated: "bg-destructive/15 text-destructive",
  actioned: "bg-primary-soft text-burgundy",
  closed: "bg-muted text-muted-foreground",
};

const severityStyle: Record<ReportSeverity, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/15 text-info",
  high: "bg-warning/20 text-warning",
  critical: "bg-destructive/15 text-destructive",
};

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <Badge variant="outline" className={cn("border-0 capitalize", statusStyle[status])}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export function ReportSeverityBadge({ severity }: { severity: ReportSeverity }) {
  return (
    <Badge variant="outline" className={cn("border-0 capitalize", severityStyle[severity])}>
      {severity}
    </Badge>
  );
}

export function ModeratorActionBadge({ action }: { action: ModeratorAction }) {
  return (
    <Badge variant="outline" className="border-0 bg-muted/60 text-foreground capitalize">
      {action.replace(/_/g, " ")}
    </Badge>
  );
}
