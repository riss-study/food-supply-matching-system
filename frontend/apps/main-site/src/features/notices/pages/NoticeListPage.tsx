import { Link } from "react-router-dom"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { usePublicNotices } from "../hooks/usePublicNotices"
import type { PaginationMeta } from "@fsm/types"

export function NoticeListPage() {
  const { t } = useTranslation("notices")
  const [page, setPage] = useState(1)
  const size = 20

  const { data, isLoading, error } = usePublicNotices({
    page,
    size,
  })

  const meta = data?.meta as PaginationMeta | undefined

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-text">
          <h1>{t("list.title")}</h1>
          <p>{t("list.description")}</p>
        </div>
      </div>

      {isLoading ? <p>{t("common:loading")}</p> : null}

      {error ? <p className="text-danger">{t("list.loadError")}</p> : null}

      {!isLoading && !error && data?.items.length === 0 && (
        <div className="empty-state">
          <p>{t("list.emptyMessage")}</p>
        </div>
      )}

      {data?.items.length ? (
      <div className="surface p-0 overflow-hidden">
        {data.items.map((item) => (
          <div key={item.noticeId} className="notice-list-item">
            <Link to={`/notices/${item.noticeId}`} className="notice-list-title">
              {item.title}
            </Link>
            <p className="text-sm text-muted mb-4">{item.excerpt}</p>
            <span className="text-sm text-muted">
              {new Date(item.publishedAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        ))}
      </div>
      ) : null}

      {meta?.totalPages != null && meta.totalPages >= 1 && (
        <div className="pagination">
          <button aria-label={t("common:previous")} disabled={!meta.hasPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
          {Array.from({ length: Math.min(meta.totalPages ?? 1, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button aria-label={t("common:next")} disabled={!meta.hasNext} onClick={() => setPage((p) => Math.min(meta.totalPages || p, p + 1))}>›</button>
        </div>
      )}
    </div>
  )
}
