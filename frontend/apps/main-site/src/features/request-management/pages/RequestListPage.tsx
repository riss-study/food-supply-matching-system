import { Link, useSearchParams } from "react-router-dom"
import type { RequestState } from "@fsm/types"
import { useRequestList } from "../hooks/useRequestList"

const stateLabels: Record<RequestState, string> = {
  draft: "작성 중",
  open: "진행 중",
  closed: "마감",
  cancelled: "취소됨",
}

const stateColors: Record<RequestState, string> = {
  draft: "#6b7280",
  open: "#10b981",
  closed: "#3b82f6",
  cancelled: "#ef4444",
}

function StateBadge({ state }: { state: RequestState }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.25rem 0.75rem",
        borderRadius: "9999px",
        fontSize: "0.875rem",
        fontWeight: 500,
        backgroundColor: stateColors[state] + "20",
        color: stateColors[state],
      }}
    >
      {stateLabels[state]}
    </span>
  )
}

export function RequestListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const stateFilter = (searchParams.get("state") as RequestState | null) ?? ""
  const page = Number(searchParams.get("page") ?? "1")
  const { data, isLoading } = useRequestList({ state: stateFilter || undefined, page, size: 20 })

  const tabs: { value: string; label: string }[] = [
    { value: "", label: "전체" },
    { value: "draft", label: "작성 중" },
    { value: "open", label: "진행 중" },
    { value: "closed", label: "마감" },
    { value: "cancelled", label: "취소됨" },
  ]

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1>내 의뢰 목록</h1>
        <Link
          to="/requests/new"
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#3b82f6",
            color: "white",
            borderRadius: "0.375rem",
            textDecoration: "none",
          }}
        >
          + 새 의뢰 등록
        </Link>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSearchParams({ state: tab.value, page: "1" })}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              border: "none",
              backgroundColor: stateFilter === tab.value ? "#1f2937" : "#f3f4f6",
              color: stateFilter === tab.value ? "white" : "#4b5563",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p>로딩 중...</p>
      ) : data?.items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#6b7280" }}>
          <p>등록된 의뢰가 없습니다.</p>
            <Link to="/requests/new" style={{ color: "#3b82f6", textDecoration: "underline" }}>
              첫 의뢰를 등록해 보세요
            </Link>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gap: "1rem" }}>
            {data?.items.map((request) => (
              <article
                key={request.requestId}
                style={{
                  border: "1px solid #e5e7eb",
                  padding: "1.25rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "white",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>{request.title}</h2>
                  <StateBadge state={request.state} />
                </div>

                <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem", fontSize: "0.875rem", color: "#6b7280" }}>
                  <span>카테고리: {request.category}</span>
                  <span>•</span>
                  <span>모드: {request.mode === "public" ? "공개" : "지정"}</span>
                  <span>•</span>
                  <span>받은 견적: {request.quoteCount}개</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                    생성일: {new Date(request.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                  <Link
                    to={`/requests/${request.requestId}`}
                    style={{
                      padding: "0.375rem 0.75rem",
                      backgroundColor: "#f3f4f6",
                      color: "#374151",
                      borderRadius: "0.375rem",
                      textDecoration: "none",
                      fontSize: "0.875rem",
                    }}
                  >
                    상세 보기
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "center" }}>
            <button
              disabled={!data?.meta.hasPrev}
              onClick={() => setSearchParams({ state: stateFilter, page: String(Math.max(1, page - 1)) })}
            >
              이전
            </button>
            <span>
              페이지 {data?.meta.page ?? 1} / {data?.meta.totalPages ?? 1}
            </span>
            <button
              disabled={!data?.meta.hasNext}
              onClick={() => setSearchParams({ state: stateFilter, page: String(page + 1) })}
            >
              다음
            </button>
          </div>
        </>
      )}
    </section>
  )
}
