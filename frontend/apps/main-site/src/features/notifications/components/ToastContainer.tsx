import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useNotificationStore } from "../store/notification-store"

const TOAST_DURATION_MS = 5000

/**
 * 화면 우측 상단 fixed position. 최대 5개 stack. 각 toast 클릭하면 thread 페이지로 이동.
 *
 * selector 정책: `role="alert"` (기존 컨벤션 의미 기반) + `.toast-notification` 클래스
 *   (CSS 셀렉터 보강). e2e 는 `getByRole("alert")` 우선.
 */
export function ToastContainer() {
  const toasts = useNotificationStore((s) => s.toasts)
  const dismissToast = useNotificationStore((s) => s.dismissToast)
  const navigate = useNavigate()

  // 각 toast 마다 자동 dismiss 타이머
  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((toast) =>
      window.setTimeout(() => dismissToast(toast.id), TOAST_DURATION_MS),
    )
    return () => {
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [toasts, dismissToast])

  if (toasts.length === 0) return null

  return (
    <div
      className="toast-container"
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 1000,
        maxWidth: 360,
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          aria-live="polite"
          className="toast-notification surface"
          style={{
            cursor: "pointer",
            padding: "12px 16px",
            borderLeft: "4px solid var(--accent, #2563eb)",
            background: "var(--bg, #fff)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
          onClick={() => {
            dismissToast(toast.id)
            navigate(`/threads/${toast.threadId}`)
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <strong className="text-sm">{toast.senderDisplayName}</strong>
            <button
              type="button"
              aria-label="알림 닫기"
              onClick={(e) => {
                e.stopPropagation()
                dismissToast(toast.id)
              }}
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
            >
              ×
            </button>
          </div>
          <div className="text-xs text-muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {toast.threadTitle}
          </div>
          <div className="text-sm" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {toast.preview}
          </div>
        </div>
      ))}
    </div>
  )
}
