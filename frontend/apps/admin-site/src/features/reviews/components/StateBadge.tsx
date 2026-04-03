export type ReviewState = "draft" | "submitted" | "under_review" | "hold" | "approved" | "rejected" | "suspended"

export function getStateBadgeColor(state: string): { bg: string; text: string; border: string } {
  switch (state) {
    case "submitted":
      return { bg: "var(--info-soft)", text: "var(--info)", border: "var(--info)" }
    case "under_review":
      return { bg: "var(--warning-soft)", text: "var(--warning)", border: "var(--warning)" }
    case "hold":
      return { bg: "var(--warning-soft)", text: "var(--warning)", border: "var(--warning)" }
    case "approved":
      return { bg: "var(--success-soft)", text: "var(--success)", border: "var(--success)" }
    case "rejected":
      return { bg: "var(--danger-soft)", text: "var(--danger)", border: "var(--danger)" }
    case "suspended":
      return { bg: "var(--panel)", text: "var(--muted)", border: "var(--muted)" }
    case "draft":
      return { bg: "var(--panel)", text: "var(--muted)", border: "var(--line-strong)" }
    default:
      return { bg: "var(--panel)", text: "var(--muted)", border: "var(--line)" }
  }
}

export function getStateLabel(state: string): string {
  const labels: Record<string, string> = {
    draft: "작성중",
    submitted: "제출됨",
    under_review: "검토중",
    hold: "보류",
    approved: "승인됨",
    rejected: "반려",
    suspended: "중단",
  }
  return labels[state] || state
}

interface StateBadgeProps {
  state: string
}

export function StateBadge({ state }: StateBadgeProps) {
  const colors = getStateBadgeColor(state)
  const label = getStateLabel(state)

  return (
    <span
      className="badge"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {label}
    </span>
  )
}
