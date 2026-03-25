import { useState } from "react"
import { useNotices } from "../hooks/useNotices"
import { NoticeStateBadge } from "../components/NoticeStateBadge"
import type { PaginationMeta } from "@fsm/types"

interface NoticeListPageProps {
  onCreateClick?: () => void
  onEditClick?: (noticeId: string) => void
}

export function NoticeListPage({ onCreateClick, onEditClick }: NoticeListPageProps) {
  const [state, setState] = useState("")
  const [sort, setSort] = useState("")
  const [order, setOrder] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)

  const { data, isLoading } = useNotices({
    state: state || undefined,
    sort: sort || undefined,
    order,
    page,
    size,
  })

  const meta = data?.meta as PaginationMeta | undefined

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1>공지사항 관리</h1>
        <button onClick={onCreateClick} style={{ padding: "0.5rem 1rem" }}>
          새 공지 작성
        </button>
      </div>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <label>
          상태 필터
          <select value={state} onChange={(e) => { setState(e.target.value); setPage(1) }}>
            <option value="">전체</option>
            <option value="draft">작성중</option>
            <option value="published">게시됨</option>
            <option value="archived">보관됨</option>
          </select>
        </label>

        <label>
          정렬
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="">기본 (작성일)</option>
            <option value="createdAt">작성일</option>
            <option value="publishedAt">게시일</option>
            <option value="viewCount">조회수</option>
            <option value="title">제목</option>
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
            <th style={{ textAlign: "left", padding: "0.75rem" }}>제목</th>
            <th style={{ textAlign: "left", padding: "0.75rem" }}>상태</th>
            <th style={{ textAlign: "left", padding: "0.75rem" }}>작성자</th>
            <th style={{ textAlign: "left", padding: "0.75rem" }}>게시일</th>
            <th style={{ textAlign: "left", padding: "0.75rem" }}>조회수</th>
            <th style={{ textAlign: "left", padding: "0.75rem" }}>관리</th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((item) => (
            <tr key={item.noticeId} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "0.75rem" }}>{item.title}</td>
              <td style={{ padding: "0.75rem" }}>
                <NoticeStateBadge state={item.state} />
              </td>
              <td style={{ padding: "0.75rem" }}>{item.authorName || item.authorId}</td>
              <td style={{ padding: "0.75rem" }}>
                {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("ko-KR") : "-"}
              </td>
              <td style={{ padding: "0.75rem" }}>{item.viewCount.toLocaleString()}</td>
              <td style={{ padding: "0.75rem" }}>
                <button onClick={() => onEditClick?.(item.noticeId)} style={{ padding: "0.25rem 0.5rem" }}>
                  편집
                </button>
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
