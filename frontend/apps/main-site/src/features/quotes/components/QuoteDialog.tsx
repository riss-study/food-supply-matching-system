import type { ReactNode } from "react"

type QuoteDialogTone = "default" | "danger" | "success"

const toneStyles: Record<QuoteDialogTone, { border: string; background: string; title: string }> = {
  default: {
    border: "var(--line-strong)",
    background: "var(--white)",
    title: "var(--ink)",
  },
  danger: {
    border: "var(--danger-soft)",
    background: "var(--danger-soft)",
    title: "var(--danger)",
  },
  success: {
    border: "var(--success-soft)",
    background: "var(--success-soft)",
    title: "var(--success)",
  },
}

type QuoteDialogProps = {
  title: string
  tone?: QuoteDialogTone
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function QuoteDialog({ title, tone = "default", onClose, children, footer }: QuoteDialogProps) {
  const palette = toneStyles[tone]

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 1000,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: "min(100%, 720px)",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 16,
          border: `1px solid ${palette.border}`,
          backgroundColor: palette.background,
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            padding: "20px 20px 0",
          }}
        >
          <h2 style={{ margin: 0, color: palette.title }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid var(--line-strong)",
              backgroundColor: "var(--paper)",
              borderRadius: "9999px",
              width: 32,
              height: 32,
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: 16,
              lineHeight: 1,
            }}
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <div style={{ padding: "16px 20px 20px" }}>{children}</div>
        {footer && (
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              padding: "0 20px 20px",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
