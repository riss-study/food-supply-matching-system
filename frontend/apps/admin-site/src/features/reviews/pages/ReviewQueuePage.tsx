import { useState } from "react"
import { useReviewQueue } from "../hooks/useReviewQueue"
import { StateBadge } from "../components/StateBadge"
import type { PaginationMeta } from "@fsm/types"

const tabs = [
  { value: "", label: "전체" },
  { value: "submitted", label: "제출됨" },
  { value: "under_review", label: "검수중" },
  { value: "hold", label: "보완요청" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "반려" },
]

export function ReviewQueuePage() {
  const [state, setState] = useState("")
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0])
  const [sort] = useState("")
  const [order] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [size] = useState(20)

  const { data, isLoading } = useReviewQueue({
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
        <h1>업체 검수</h1>
        <div className="page-header-actions">
          <input className="input" type="date" value={fromDate} max={toDate || new Date().toISOString().split("T")[0]} onChange={(e) => { setFromDate(e.target.value); setPage(1) }} />
          <span className="text-muted">~</span>
          <input className="input" type="date" value={toDate} min={fromDate} max={new Date().toISOString().split("T")[0]} onChange={(e) => { setToDate(e.target.value); setPage(1) }} />
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
          <p>검수 대기 건이 없습니다.</p>
        </div>
      ) : data?.items.length ? (
        <div className="surface p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>회사명</th>
                <th>현재 상태</th>
                <th>제출일</th>
                <th>대기일수</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.reviewId} className="cursor-pointer" onClick={() => window.location.href = `/reviews/${item.reviewId}`}>
                  <td className="font-semibold" data-label="회사명">{item.companyName}</td>
                  <td data-label="상태">
                    <StateBadge state={item.state} />
                  </td>
                  <td className="text-muted" data-label="제출일">{new Date(item.submittedAt).toLocaleDateString("ko-KR")}</td>
                  <td data-label="대기일수" className="font-semibold" style={{ color: item.pendingDays > 7 ? "var(--danger)" : item.pendingDays > 3 ? "var(--warning)" : "var(--ink)" }}>
                    {item.pendingDays > 0 ? `${item.pendingDays}일` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {meta != null && meta.totalPages >= 1 && (
        <div className="pagination">
          <button disabled={!meta.hasPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
          {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button disabled={!meta.hasNext} onClick={() => setPage((p) => Math.min(meta.totalPages || p, p + 1))}>›</button>
        </div>
      )}
    </div>
  )
}
