import { Link, useNavigate, useSearchParams } from "react-router-dom"
import type { RequestState } from "@fsm/types"
import { useRequestList } from "../hooks/useRequestList"

const stateLabels: Record<RequestState, string> = {
  draft: "작성 중",
  open: "진행 중",
  closed: "마감",
  cancelled: "취소됨",
}

const stateBadgeClass: Record<RequestState, string> = {
  draft: "badge badge-gray",
  open: "badge badge-green",
  closed: "badge badge-blue",
  cancelled: "badge badge-red",
}

function StateBadge({ state }: { state: RequestState }) {
  return <span className={stateBadgeClass[state]}>{stateLabels[state]}</span>
}

export function RequestListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const stateFilter = (searchParams.get("state") as RequestState | null) ?? ""
  const page = Number(searchParams.get("page") ?? "1")
  const { data, isLoading } = useRequestList({ state: stateFilter || undefined, page, size: 20 })

  const tabs: { value: string; label: string }[] = [
    { value: "", label: "전체" },
    { value: "draft", label: "작성 중" },
    { value: "open", label: "진행 중" },
    { value: "closed", label: "마감" },
    { value: "cancelled", label: "취소" },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-text">
          <h1>내 의뢰 목록</h1>
        </div>
        <div className="page-header-actions">
          <Link to="/requests/new" className="btn btn-primary">
            + 새 의뢰
          </Link>
        </div>
      </div>

      <div className="tab-underline">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={stateFilter === tab.value ? "active" : ""}
            onClick={() => setSearchParams({ state: tab.value, page: "1" })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted">로딩 중...</p>
      ) : data?.items.length === 0 ? (
        <div className="empty-state">
          <p>등록된 의뢰가 없습니다.</p>
          <Link to="/requests/new" className="btn btn-primary btn-sm">
            첫 의뢰를 등록해 보세요
          </Link>
        </div>
      ) : (
        <>
          <div className="surface p-0 overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>카테고리</th>
                  <th>방식</th>
                  <th>상태</th>
                  <th>등록일</th>
                  <th>견적</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((request) => (
                  <tr key={request.requestId} onClick={() => navigate(`/requests/${request.requestId}`)} style={{ cursor: "pointer" }}>
                    <td className="font-semibold" data-label="제목">{request.title}</td>
                    <td className="text-muted" data-label="카테고리">{request.category}</td>
                    <td className="text-muted" data-label="방식">
                      {request.mode === "public" ? "공개" : "지정"}
                    </td>
                    <td data-label="상태"><StateBadge state={request.state} /></td>
                    <td className="text-muted text-sm" data-label="등록일">{new Date(request.createdAt).toLocaleDateString("ko-KR")}</td>
                    <td data-label="견적">{request.quoteCount > 0 ? `${request.quoteCount}건` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(data?.meta.totalPages ?? 0) >= 1 && (
            <div className="pagination">
              <button disabled={!data.meta.hasPrev} onClick={() => setSearchParams({ state: stateFilter, page: String(Math.max(1, page - 1)) })}>‹</button>
              {Array.from({ length: Math.min(data.meta.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={p === page ? "active" : ""} onClick={() => setSearchParams({ state: stateFilter, page: String(p) })}>{p}</button>
              ))}
              <button disabled={!data.meta.hasNext} onClick={() => setSearchParams({ state: stateFilter, page: String(page + 1) })}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
