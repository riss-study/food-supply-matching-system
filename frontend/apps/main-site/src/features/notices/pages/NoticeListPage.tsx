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

  const containerStyle: React.CSSProperties = {
    maxWidth: "800px",
    margin: "0 auto",
  }

  const noticeItemStyle: React.CSSProperties = {
    padding: "1.5rem",
    borderBottom: "1px solid #e5e7eb",
    transition: "background-color 0.2s",
  }

  const noticeTitleStyle: React.CSSProperties = {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "0.5rem",
    textDecoration: "none",
    display: "block",
  }

  const noticeExcerptStyle: React.CSSProperties = {
    fontSize: "0.875rem",
    color: "#6b7280",
    marginBottom: "0.5rem",
    lineHeight: 1.5,
  }

  const noticeDateStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    color: "#9ca3af",
  }

  return (
    <section style={containerStyle}>
      <h1>공지사항</h1>

      {isLoading ? <p>로딩 중...</p> : null}

      {error ? <p>공지사항을 불러오지 못했습니다.</p> : null}

      {!isLoading && !error && data?.items.length === 0 && (
        <p>등록된 공지사항이 없습니다.</p>
      )}

      <div>
        {data?.items.map((item) => (
          <div key={item.noticeId} style={noticeItemStyle}>
            <Link to={`/notices/${item.noticeId}`} style={noticeTitleStyle}>
              {item.title}
            </Link>
            <p style={noticeExcerptStyle}>{item.excerpt}</p>
            <span style={noticeDateStyle}>
              {new Date(item.publishedAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        ))}
      </div>

      {meta && meta.totalPages && meta.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "1.5rem",
            padding: "1rem",
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!meta.hasPrev}
            style={{ padding: "0.5rem 1rem" }}
          >
            이전
          </button>
          <span>
            {meta.page} / {meta.totalPages} 페이지 (총 {meta.totalElements}건)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages || p, p + 1))}
            disabled={!meta.hasNext}
            style={{ padding: "0.5rem 1rem" }}
          >
            다음
          </button>
        </div>
      )}
    </section>
  )
}
