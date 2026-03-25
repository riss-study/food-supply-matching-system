import { Link } from "react-router-dom"
import { useThreads } from "../hooks/useThreads"
import type { ThreadSummary } from "@fsm/types"

function ThreadListItem({ thread }: { thread: ThreadSummary }) {
  const hasUnread = thread.unreadCount > 0

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
    } else if (diffDays < 7) {
      return `${diffDays}일 전`
    } else {
      return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
    }
  }

  return (
    <Link
      to={`/threads/${thread.threadId}`}
      style={{
        display: "block",
        padding: "1rem 1.25rem",
        backgroundColor: hasUnread ? "#eff6ff" : "white",
        borderRadius: "0.75rem",
        border: `1px solid ${hasUnread ? "#bfdbfe" : "#e2e8f0"}`,
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.125rem 0.5rem",
                backgroundColor: thread.otherParty.role === "supplier" ? "#dbeafe" : "#fce7f3",
                color: thread.otherParty.role === "supplier" ? "#1e40af" : "#9d174d",
                borderRadius: "9999px",
                fontWeight: 600,
              }}
            >
              {thread.otherParty.role === "supplier" ? "공급자" : "의뢰자"}
            </span>
            <span style={{ fontWeight: 600, color: "#1e293b" }}>{thread.otherParty.displayName}</span>
          </div>

          <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.25rem" }}>
            의뢰: {thread.requestTitle}
          </div>

          {thread.lastMessage ? (
            <div
              style={{
                fontSize: "0.875rem",
                color: hasUnread ? "#1e293b" : "#64748b",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: hasUnread ? 500 : 400,
              }}
            >
              {thread.lastMessage.hasAttachments && "📎 "}
              {thread.lastMessage.body || "(첨부 파일)"}
            </div>
          ) : (
            <div style={{ fontSize: "0.875rem", color: "#94a3b8", fontStyle: "italic" }}>
              아직 메시지가 없습니다
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{formatTime(thread.updatedAt)}</span>

          {hasUnread && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "20px",
                height: "20px",
                padding: "0 6px",
                backgroundColor: "#ef4444",
                color: "white",
                fontSize: "0.75rem",
                fontWeight: 600,
                borderRadius: "9999px",
              }}
            >
              {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export function ThreadListPage() {
  const { data, isLoading, error } = useThreads({ page: 1, size: 20 })
  const threads = data?.items ?? []

  if (isLoading) {
    return (
      <section>
        <h1>메시지</h1>
        <p>로딩 중...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section>
        <h1>메시지</h1>
        <p style={{ color: "#dc2626" }}>메시지 목록을 불러오지 못했습니다.</p>
      </section>
    )
  }

  return (
    <section>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0 }}>메시지</h1>
        <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
          의뢰와 관련된 대화를 확인하고 관리합니다
        </p>
      </div>

      {threads.length === 0 ? (
        <div
          style={{
            padding: "3rem 2rem",
            textAlign: "center",
            backgroundColor: "#f8fafc",
            borderRadius: "0.75rem",
            border: "1px dashed #cbd5e1",
          }}
        >
          <p style={{ color: "#64748b", margin: 0 }}>아직 대화가 없습니다.</p>
          <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginTop: "0.5rem" }}>
            견적을 제출하거나 의뢰에 대해 문의하면 여기에 대화가 표시됩니다.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {threads.map((thread) => (
            <ThreadListItem key={thread.threadId} thread={thread} />
          ))}
        </div>
      )}
    </section>
  )
}
