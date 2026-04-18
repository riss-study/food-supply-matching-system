import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useThreads } from "../hooks/useThreads"
import type { ThreadSummary } from "@fsm/types"

function ThreadListItem({ thread }: { thread: ThreadSummary }) {
  const { t } = useTranslation("threads")
  const hasUnread = thread.unreadCount > 0

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
    } else if (diffDays < 7) {
      return t("list.daysAgo", { days: diffDays })
    } else {
      return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
    }
  }

  return (
    <Link to={`/threads/${thread.threadId}`} className={`thread-list-item ${hasUnread ? "is-active" : ""}`}>
      <div className="thread-list-avatar" style={{ background: hasUnread ? 'var(--accent)' : 'var(--muted)' }} />
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center gap-8">
          <span className="font-medium">{thread.otherParty.displayName}</span>
          <span className="text-muted text-sm">{t("list.requestPrefix", { title: thread.requestTitle })}</span>
        </div>
        {thread.lastMessage ? (
          <div className={`text-sm truncate ${hasUnread ? "font-medium" : "text-muted"}`}>
            {thread.lastMessage.hasAttachments && "📎 "}
            {thread.lastMessage.body || t("list.attachmentPlaceholder")}
          </div>
        ) : (
          <div className="text-sm text-muted">{t("list.noMessages")}</div>
        )}
      </div>
      <div className="flex flex-col items-end gap-8">
        <span className="text-sm text-muted">{formatTime(thread.updatedAt)}</span>
        {hasUnread && (
          <span className="badge badge-red">{thread.unreadCount > 99 ? "99+" : thread.unreadCount}</span>
        )}
      </div>
    </Link>
  )
}

export function ThreadListPage() {
  const { t } = useTranslation("threads")
  const { data, isLoading, error } = useThreads({ page: 1, size: 20 })
  const threads = data?.items ?? []

  if (isLoading) {
    return (
      <div className="page">
        <h1>{t("list.title")}</h1>
        <p className="text-muted">{t("list.loading")}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <h1>{t("list.title")}</h1>
        <p className="text-danger">{t("list.loadError")}</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="font-bold" style={{ fontSize: 22 }}>{t("list.title")}</h1>

      {threads.length === 0 ? (
        <div className="empty-state">
          <p>{t("list.emptyTitle")}</p>
          <p className="text-sm">{t("list.emptyDescription")}</p>
        </div>
      ) : (
        <div className="surface p-0 overflow-hidden">
          {threads.map((thread) => (
            <ThreadListItem key={thread.threadId} thread={thread} />
          ))}
        </div>
      )}
    </div>
  )
}
