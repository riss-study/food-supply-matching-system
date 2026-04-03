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
    <Link to={`/threads/${thread.threadId}`} className={`thread-list-item ${hasUnread ? "is-active" : ""}`}>
      <div className="thread-list-avatar" style={{ background: hasUnread ? 'var(--accent)' : 'var(--muted)' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="flex items-center gap-8">
          <span style={{ fontWeight: 500 }}>{thread.otherParty.displayName}</span>
          <span className="text-muted text-sm">의뢰: {thread.requestTitle}</span>
        </div>
        {thread.lastMessage ? (
          <div className={`text-sm truncate ${hasUnread ? "font-medium" : "text-muted"}`}>
            {thread.lastMessage.hasAttachments && "📎 "}
            {thread.lastMessage.body || "(첨부 파일)"}
          </div>
        ) : (
          <div className="text-sm text-muted">아직 메시지가 없습니다</div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        <span className="text-sm text-muted">{formatTime(thread.updatedAt)}</span>
        {hasUnread && (
          <span className="badge badge-red">{thread.unreadCount > 99 ? "99+" : thread.unreadCount}</span>
        )}
      </div>
    </Link>
  )
}

export function ThreadListPage() {
  const { data, isLoading, error } = useThreads({ page: 1, size: 20 })
  const threads = data?.items ?? []

  if (isLoading) {
    return (
      <div className="page">
        <h1>메시지</h1>
        <p className="text-muted">로딩 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <h1>메시지</h1>
        <p className="text-danger">메시지 목록을 불러오지 못했습니다.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>메시지</h1>

      {threads.length === 0 ? (
        <div className="empty-state">
          <p>아직 대화가 없습니다.</p>
          <p className="text-sm">견적을 제출하거나 의뢰에 대해 문의하면 여기에 대화가 표시됩니다.</p>
        </div>
      ) : (
        <div className="surface" style={{ padding: 0, overflow: 'hidden' }}>
          {threads.map((thread) => (
            <ThreadListItem key={thread.threadId} thread={thread} />
          ))}
        </div>
      )}
    </div>
  )
}
