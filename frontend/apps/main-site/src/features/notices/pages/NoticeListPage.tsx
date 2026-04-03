import { Link } from "react-router-dom"
import { useState } from "react"
import { usePublicNotices } from "../hooks/usePublicNotices"
import type { PaginationMeta } from "@fsm/types"

export function NoticeListPage() {
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
          <h1>공지사항</h1>
          <p>서비스 운영 소식, 업데이트, 안내사항을 한 곳에서 확인할 수 있습니다.</p>
        </div>
      </div>

      {isLoading ? <p>로딩 중...</p> : null}

      {error ? <p className="text-danger">공지사항을 불러오지 못했습니다.</p> : null}

      {!isLoading && !error && data?.items.length === 0 && (
        <div className="empty-state">
          <p>등록된 공지사항이 없습니다.</p>
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

      {meta != null && meta.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!meta.hasPrev}
          >
            이전
          </button>
          <span>
            {meta.page} / {meta.totalPages} 페이지 (총 {meta.totalElements}건)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages || p, p + 1))}
            disabled={!meta.hasNext}
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}
