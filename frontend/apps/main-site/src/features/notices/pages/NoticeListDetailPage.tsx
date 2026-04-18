import { useEffect, useState } from "react"
import { getApiBaseUrl } from "@fsm/utils"
import { usePublicNotices } from "../hooks/usePublicNotices"
import { usePublicNoticeDetail } from "../hooks/usePublicNoticeDetail"
import type { PaginationMeta } from "@fsm/types"

export function NoticeListDetailPage() {
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = usePublicNotices({ page, size: 20 })
  const { data: detail } = usePublicNoticeDetail(selectedNoticeId || "")
  const meta = data?.meta as PaginationMeta | undefined

  useEffect(() => {
    if (data?.items.length && !selectedNoticeId) {
      setSelectedNoticeId(data.items[0].noticeId)
    }
  }, [data, selectedNoticeId])

  return (
    <div className="page h-full" style={{ gap: 0 }}>
      <h1 className="text-2xl font-bold" style={{ letterSpacing: -0.5, paddingBottom: 24 }}>공지사항</h1>

      {isLoading && <p className="text-muted">로딩 중...</p>}
      {error && <p className="text-danger">공지사항을 불러오지 못했습니다.</p>}

      {!isLoading && !error && data?.items.length === 0 && (
        <div className="empty-state">
          <p>등록된 공지사항이 없습니다.</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="two-col-master-detail flex-1" style={{ minHeight: 0 }}>
          {/* Left: notice list */}
          <div className="flex flex-col gap-16 overflow-auto">
            {data.items.map((item) => {
              const isSelected = selectedNoticeId === item.noticeId
              return (
                <button
                  key={item.noticeId}
                  type="button"
                  onClick={() => setSelectedNoticeId(item.noticeId)}
                  className="flex flex-col gap-6 cursor-pointer"
                  style={{
                    padding: "16px 20px",
                    borderRadius: 16,
                    border: `1px solid ${isSelected ? "var(--accent)" : "var(--line)"}`,
                    background: isSelected ? "var(--accent-soft)" : "var(--paper)",
                    textAlign: "left",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  <span className="text-base" style={{ fontWeight: isSelected ? 600 : 500, color: "var(--ink)" }}>
                    {item.title}
                  </span>
                  <span className="text-sm text-muted">
                    {new Date(item.publishedAt).toLocaleDateString("ko-KR")}
                  </span>
                </button>
              )
            })}

            {meta && meta.totalPages >= 1 && (
              <div className="pagination mt-8">
                <button disabled={!meta.hasPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
                {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button disabled={!meta.hasNext} onClick={() => setPage((p) => Math.min(meta.totalPages || p, p + 1))}>›</button>
              </div>
            )}
          </div>

          {/* Right: notice detail */}
          <div
            className="surface overflow-auto flex flex-col gap-20"
          >
            {detail ? (
              <>
                <h2 className="font-bold" style={{ fontSize: 22, letterSpacing: -0.3, color: "var(--ink)" }}>
                  {detail.title}
                </h2>
                <div className="flex gap-16 text-muted" style={{ fontSize: 13 }}>
                  <span>
                    {new Date(detail.publishedAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span>조회수: {detail.viewCount?.toLocaleString()}</span>
                </div>
                <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: 0 }} />
                <article className="text-base" style={{ lineHeight: 1.7, color: "var(--ink)", whiteSpace: "pre-wrap" }}>
                  {detail.body}
                </article>

                {detail.attachments?.length > 0 && (
                  <div className="flex flex-col gap-8">
                    <h3 className="section-title">첨부 파일</h3>
                    {detail.attachments.map((attachment) => (
                      <div key={attachment.attachmentId} className="flex items-center gap-8 text-sm">
                        <a href={`${getApiBaseUrl()}${attachment.url}`} download={attachment.fileName} className="text-accent">
                          {attachment.fileName}
                        </a>
                        <span className="text-muted">({(attachment.fileSize / 1024).toFixed(1)} KB)</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted text-center" style={{ padding: 40 }}>
                공지사항을 선택하세요
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
