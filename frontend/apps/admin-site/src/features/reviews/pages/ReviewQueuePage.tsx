import { Link } from "react-router-dom"
import { useState } from "react"
import { useReviewQueue } from "../hooks/useReviewQueue"
import { StateBadge } from "../components/StateBadge"
import type { PaginationMeta } from "@fsm/types"

export function ReviewQueuePage() {
  const [state, setState] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [sort, setSort] = useState("")
  const [order, setOrder] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)

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
    <section>
      <h1>검수 큐</h1>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <label>
          상태 필터
          <select value={state} onChange={(e) => { setState(e.target.value); setPage(1) }}>
            <option value="">전체</option>
            <option value="submitted">제출됨</option>
            <option value="under_review">검토중</option>
            <option value="hold">보류</option>
            <option value="approved">승인됨</option>
            <option value="rejected">반려</option>
          </select>
        </label>

        <label>
          제출일부터
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
          />
        </label>

        <label>
          제출일까지
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1) }}
          />
        </label>

        <label>
          정렬
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="">기본 (제출일)</option>
            <option value="submittedAt">제출일</option>
            <option value="pendingDays">대기일수</option>
            <option value="state">상태</option>
            <option value="companyName">회사명</option>
          </select>
        </label>

        <label>
          순서
          <select value={order} onChange={(e) => setOrder(e.target.value as "asc" | "desc")}>
            <option value="desc">내림차순</option>
            <option value="asc">오름차순</option>
          </select>
        </label>

        <label>
          페이지당
          <select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(1) }}>
            <option value={10}>10개</option>
            <option value={20}>20개</option>
            <option value={50}>50개</option>
          </select>
        </label>
      </div>

      {isLoading ? <p>로딩 중...</p> : null}

      <table style={{ width: "100%", marginTop: "1rem", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            <th style={{ textAlign: "left", padding: "0.75rem" }}>회사명</th>
            <th style={{ textAlign: "left", padding: "0.75rem" }}>상태</th>
            <th style={{ textAlign: "left", padding: "0.75rem" }}>제출일</th>
            <th style={{ textAlign: "left", padding: "0.75rem" }}>대기일수</th>
            <th style={{ textAlign: "left", padding: "0.75rem" }}>상세</th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((item) => (
            <tr key={item.reviewId} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "0.75rem" }}>{item.companyName}</td>
              <td style={{ padding: "0.75rem" }}>
                <StateBadge state={item.state} />
              </td>
              <td style={{ padding: "0.75rem" }}>{new Date(item.submittedAt).toLocaleDateString("ko-KR")}</td>
              <td style={{ padding: "0.75rem" }}>{item.pendingDays}일</td>
              <td style={{ padding: "0.75rem" }}>
                <Link to={`/reviews/${item.reviewId}`}>보기</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {meta && meta.totalPages && meta.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
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
