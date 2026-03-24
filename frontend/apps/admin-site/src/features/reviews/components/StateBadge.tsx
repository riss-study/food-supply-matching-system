export type ReviewState = "draft" | "submitted" | "under_review" | "hold" | "approved" | "rejected" | "suspended"

export function getStateBadgeColor(state: string): { bg: string; text: string; border: string } {
  switch (state) {
    case "submitted":
      return { bg: "#dbeafe", text: "#1e40af", border: "#3b82f6" }
    case "under_review":
      return { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" }
    case "hold":
      return { bg: "#ffedd5", text: "#9a3412", border: "#f97316" }
    case "approved":
      return { bg: "#d1fae5", text: "#065f46", border: "#10b981" }
    case "rejected":
      return { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" }
    case "suspended":
      return { bg: "#f3f4f6", text: "#374151", border: "#6b7280" }
    case "draft":
      return { bg: "#f3f4f6", text: "#4b5563", border: "#9ca3af" }
    default:
      return { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" }
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
      style={{
        display: "inline-block",
        padding: "0.25rem 0.75rem",
        fontSize: "0.75rem",
        fontWeight: 600,
        textTransform: "uppercase" as const,
        letterSpacing: "0.025em",
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: "9999px",
      }}
    >
      {label}
    </span>
  )
}
