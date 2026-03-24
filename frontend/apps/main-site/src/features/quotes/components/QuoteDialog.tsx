import type { ReactNode } from "react"

type QuoteDialogTone = "default" | "danger" | "success"

const toneStyles: Record<QuoteDialogTone, { border: string; background: string; title: string }> = {
  default: {
    border: "#cbd5e1",
    background: "#ffffff",
    title: "#111827",
  },
  danger: {
    border: "#fecaca",
    background: "#fef2f2",
    title: "#b91c1c",
  },
  success: {
    border: "#bbf7d0",
    background: "#f0fdf4",
    title: "#166534",
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
        padding: "1.5rem",
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
          borderRadius: "1rem",
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
            gap: "1rem",
            padding: "1.25rem 1.25rem 0",
          }}
        >
          <h2 style={{ margin: 0, color: palette.title }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid #d1d5db",
              backgroundColor: "white",
              borderRadius: "9999px",
              width: "2rem",
              height: "2rem",
              cursor: "pointer",
              color: "#6b7280",
              fontSize: "1rem",
              lineHeight: 1,
            }}
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <div style={{ padding: "1rem 1.25rem 1.25rem" }}>{children}</div>
        {footer && (
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              padding: "0 1.25rem 1.25rem",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
