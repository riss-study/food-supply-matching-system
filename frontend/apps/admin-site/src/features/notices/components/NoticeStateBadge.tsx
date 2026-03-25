export type NoticeState = "draft" | "published" | "archived"

export function getNoticeStateBadgeColor(state: string): { bg: string; text: string; border: string } {
  switch (state) {
    case "draft":
      return { bg: "#f3f4f6", text: "#4b5563", border: "#9ca3af" }
    case "published":
      return { bg: "#d1fae5", text: "#065f46", border: "#10b981" }
    case "archived":
      return { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" }
    default:
      return { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" }
  }
}

export function getNoticeStateLabel(state: string): string {
  const labels: Record<string, string> = {
    draft: "작성중",
    published: "게시됨",
    archived: "보관됨",
  }
  return labels[state] || state
}

interface NoticeStateBadgeProps {
  state: string
}

export function NoticeStateBadge({ state }: NoticeStateBadgeProps) {
  const colors = getNoticeStateBadgeColor(state)
  const label = getNoticeStateLabel(state)

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
