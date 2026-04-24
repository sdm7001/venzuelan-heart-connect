// Moderation domain helpers — single source of truth for status transitions
// and moderator actions. Keep this in sync with the database enums:
//   report_status, report_severity, report_category, report_target,
//   moderator_action, account_status.

export type ReportStatus = "new" | "in_review" | "escalated" | "actioned" | "closed";
export type ReportSeverity = "low" | "medium" | "high" | "critical";
export type ReportCategory =
  | "scam_or_fraud" | "impersonation" | "solicitation" | "explicit_content"
  | "harassment" | "underage_concern" | "spam" | "off_platform_payment_request" | "other";
export type ReportTarget = "profile" | "photo" | "message" | "account";
export type AccountStatus = "active" | "restricted" | "suspended" | "banned" | "pending_verification";

export type ModeratorAction =
  | "warn_user" | "remove_content" | "reject_photo" | "restrict_features"
  | "suspend_account" | "ban_account" | "add_note" | "escalate" | "close_case";

// Allowed forward transitions. Re-opening (back to in_review) is also allowed
// from escalated/actioned/closed so admins can correct mistakes.
export const ALLOWED_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  new:        ["in_review", "escalated", "actioned", "closed"],
  in_review:  ["escalated", "actioned", "closed"],
  escalated:  ["in_review", "actioned", "closed"],
  actioned:   ["in_review", "closed"],
  closed:     ["in_review"],
};

export type ActionDef = {
  value: ModeratorAction;
  label: string;
  description: string;
  // Final report status implied by this moderator action
  resultingStatus: ReportStatus;
  // If set, the target user's account_status is updated to this value
  setsAccountStatus?: AccountStatus;
  // Visual emphasis
  tone: "neutral" | "warn" | "danger";
};

export const ACTIONS: ActionDef[] = [
  { value: "add_note",          label: "Add internal note", description: "Record context without changing status.",           resultingStatus: "in_review", tone: "neutral" },
  { value: "warn_user",         label: "Warn user",         description: "Send a formal warning. Report moves to actioned.",  resultingStatus: "actioned",  tone: "neutral" },
  { value: "remove_content",    label: "Remove content",    description: "Take down the reported message or item.",           resultingStatus: "actioned",  tone: "warn" },
  { value: "reject_photo",      label: "Reject photo",      description: "Reject a photo and notify the user.",               resultingStatus: "actioned",  tone: "warn" },
  { value: "restrict_features", label: "Restrict account",  description: "Limit messaging or discovery while under review.",  resultingStatus: "actioned",  tone: "warn",   setsAccountStatus: "restricted" },
  { value: "suspend_account",   label: "Suspend account",   description: "Temporarily block sign-in pending review.",         resultingStatus: "actioned",  tone: "danger", setsAccountStatus: "suspended" },
  { value: "ban_account",       label: "Ban account",       description: "Permanently terminate the account. Irreversible.",  resultingStatus: "actioned",  tone: "danger", setsAccountStatus: "banned" },
  { value: "escalate",          label: "Escalate to admin", description: "Hand off to senior staff for review.",              resultingStatus: "escalated", tone: "warn" },
  { value: "close_case",        label: "Close — no action", description: "No violation found. Close and notify reporter.",    resultingStatus: "closed",    tone: "neutral" },
];

export const ACTIONS_BY_VALUE: Record<ModeratorAction, ActionDef> =
  ACTIONS.reduce((acc, a) => { acc[a.value] = a; return acc; }, {} as Record<ModeratorAction, ActionDef>);

export const STATUS_LABEL: Record<ReportStatus, string> = {
  new: "New",
  in_review: "In review",
  escalated: "Escalated",
  actioned: "Actioned",
  closed: "Closed",
};

export const MIN_NOTE_LENGTH = 10;
export const MAX_NOTE_LENGTH = 1000;

export function noteIsValid(note: string) {
  const t = note.trim();
  return t.length >= MIN_NOTE_LENGTH && t.length <= MAX_NOTE_LENGTH;
}
