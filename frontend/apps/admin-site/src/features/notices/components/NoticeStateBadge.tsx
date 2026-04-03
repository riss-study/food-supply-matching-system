export type NoticeState = "draft" | "published" | "archived"

export function getNoticeStateBadgeColor(state: string): { bg: string; text: string; border: string } {
  switch (state) {
    case "draft":
      return { bg: "var(--panel)", text: "var(--muted)", border: "var(--line-strong)" }
    case "published":
      return { bg: "var(--success-soft)", text: "var(--success)", border: "var(--success)" }
    case "archived":
      return { bg: "var(--danger-soft)", text: "var(--danger)", border: "var(--danger)" }
    default:
      return { bg: "var(--panel)", text: "var(--muted)", border: "var(--line)" }
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
