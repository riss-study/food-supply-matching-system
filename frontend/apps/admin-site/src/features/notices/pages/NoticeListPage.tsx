import { useState } from "react"
import { useNotices } from "../hooks/useNotices"
import { NoticeStateBadge } from "../components/NoticeStateBadge"
import type { PaginationMeta } from "@fsm/types"

interface NoticeListPageProps {
  onCreateClick?: () => void
  onEditClick?: (noticeId: string) => void
}

const tabs = [
  { value: "", label: "전체" },
  { value: "draft", label: "작성중" },
  { value: "published", label: "게시됨" },
  { value: "archived", label: "보관됨" },
]

export function NoticeListPage({ onCreateClick, onEditClick }: NoticeListPageProps) {
  const [state, setState] = useState("")
  const [sort] = useState("")
  const [order] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [size] = useState(20)

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const today = new Date().toISOString().split("T")[0]
  const [fromDate, setFromDate] = useState(ninetyDaysAgo)
  const [toDate, setToDate] = useState(today)

  const maxFrom = toDate || today
  const minTo = fromDate || ninetyDaysAgo

  const { data, isLoading } = useNotices({
    state: state || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    sort: sort || undefined,
    order,
    page,
    size,
  })

  const meta = data?.meta as PaginationMeta | undefined

  return (
    <div className="page">
      <div className="page-header">
        <h1>공지사항 관리</h1>
        <div className="page-header-actions">
          <input className="input" type="date" value={fromDate} max={maxFrom} onChange={(e) => { setFromDate(e.target.value); setPage(1) }} />
          <span className="text-muted">~</span>
          <input className="input" type="date" value={toDate} min={minTo} max={today} onChange={(e) => { setToDate(e.target.value); setPage(1) }} />
          <button className="btn btn-primary" onClick={onCreateClick}>
            새 공지 작성
          </button>
        </div>
      </div>

      <div className="tab-underline">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={state === tab.value ? "active" : ""}
            onClick={() => { setState(tab.value); setPage(1) }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? <p className="text-muted text-center">로딩 중...</p> : null}

      {!isLoading && data?.items.length === 0 ? (
        <div className="empty-state">
          <p>공지사항이 없습니다.</p>
        </div>
      ) : data?.items.length ? (
        <div className="surface p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>제목</th>
                <th>상태</th>
                <th>작성일</th>
                <th>작성자</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.noticeId} style={{ cursor: "pointer" }} onClick={() => onEditClick?.(item.noticeId)}>
                  <td className="font-semibold" data-label="제목">{item.title}</td>
                  <td data-label="상태">
                    <NoticeStateBadge state={item.state} />
                  </td>
                  <td className="text-muted" data-label="작성일">
                    {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="text-muted" data-label="작성자">{item.authorName || item.authorId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {meta != null && meta.totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!meta.hasPrev}
          >
            이전
          </button>
          <span className="pagination-info">
            {meta.page} / {meta.totalPages} 페이지 (총 {meta.totalElements}건)
          </span>
          <button
            className="btn btn-ghost btn-sm"
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
