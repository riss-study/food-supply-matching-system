import { useMemo, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import type { RequestQuoteSummary } from "@fsm/types"
import { useRequestQuotes } from "../hooks/useRequestQuotes"
import { useSelectQuote } from "../hooks/useSelectQuote"
import { useDeclineQuote } from "../hooks/useDeclineQuote"
import { QuoteDialog } from "../components/QuoteDialog"

type SortField = "submittedAt" | "unitPriceEstimate" | "moq" | "leadTime"

function QuoteStateBadge({ state }: { state: RequestQuoteSummary["state"] }) {
  const tone =
    state === "selected"
      ? { bg: "#dcfce7", fg: "#166534" }
      : state === "declined"
        ? { bg: "#fee2e2", fg: "#991b1b" }
        : state === "withdrawn"
          ? { bg: "#f3f4f6", fg: "#4b5563" }
          : { bg: "#dbeafe", fg: "#1d4ed8" }

  return (
    <span style={{ padding: "0.3rem 0.65rem", borderRadius: "9999px", backgroundColor: tone.bg, color: tone.fg, fontSize: "0.75rem", fontWeight: 700 }}>
      {state}
    </span>
  )
}

export function QuoteComparisonPage() {
  const { requestId = "" } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedQuote, setSelectedQuote] = useState<RequestQuoteSummary | null>(null)
  const [declineTarget, setDeclineTarget] = useState<RequestQuoteSummary | null>(null)
  const [declineReason, setDeclineReason] = useState("")
  const [selectConfirmTarget, setSelectConfirmTarget] = useState<RequestQuoteSummary | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const state = searchParams.get("state") ?? undefined
  const page = Number(searchParams.get("page") ?? "1")
  const size = 20
  const sort = (searchParams.get("sort") as SortField | null) ?? "submittedAt"
  const order = searchParams.get("order") ?? "desc"

  const { data, isLoading, error } = useRequestQuotes(requestId, { state, page, size, sort, order })
  const selectMutation = useSelectQuote(requestId)
  const declineMutation = useDeclineQuote(requestId)

  const closeDetailDialog = () => setSelectedQuote(null)

  const closeDeclineDialog = () => {
    setDeclineTarget(null)
    setDeclineReason("")
  }

  const closeSelectDialog = () => {
    setSelectConfirmTarget(null)
    setActionError(null)
  }

  const handleSelectClick = (quote: RequestQuoteSummary) => {
    setActionError(null)
    setSelectedQuote(null)
    setDeclineTarget(null)
    setSelectConfirmTarget(quote)
  }

  const handleDeclineClick = (quote: RequestQuoteSummary) => {
    setActionError(null)
    setSelectedQuote(null)
    setSelectConfirmTarget(null)
    setDeclineTarget(quote)
  }

  const handleConfirmSelect = () => {
    if (!selectConfirmTarget) return
    setActionError(null)
    selectMutation.mutate(selectConfirmTarget.quoteId, {
      onSuccess: () => {
        closeSelectDialog()
      },
      onError: () => {
        setActionError("견적 선택에 실패했습니다.")
      },
    })
  }

  const quotes = data?.items ?? []
  const meta = data?.meta

  const summary = useMemo(() => {
    return {
      submitted: quotes.filter((quote) => quote.state === "submitted").length,
      selected: quotes.filter((quote) => quote.state === "selected").length,
    }
  }, [quotes])

  const updateFilter = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(next).forEach(([key, value]) => {
      if (!value) params.delete(key)
      else params.set(key, value)
    })
    setSearchParams(params)
  }

  if (isLoading) {
    return <section><h1>견적 비교</h1><p>로딩 중...</p></section>
  }

  if (error) {
    return <section><h1>견적 비교</h1><p style={{ color: "#dc2626" }}>견적 목록을 불러오지 못했습니다.</p></section>
  }

  return (
    <section>
      <div style={{ marginBottom: "1rem" }}>
        <Link to={`/requests/${requestId}`} style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.875rem" }}>← 의뢰 상세로 돌아가기</Link>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>견적 비교</h1>
          <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>제출 {summary.submitted}건 / 선택 {summary.selected}건</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[undefined, "submitted", "selected", "declined", "withdrawn"].map((candidate) => (
            <button
              key={candidate ?? "all"}
              onClick={() => updateFilter({ state: candidate, page: "1" })}
              style={{
                padding: "0.45rem 0.8rem",
                borderRadius: "9999px",
                border: "1px solid #d1d5db",
                backgroundColor: state === candidate || (!state && !candidate) ? "#111827" : "white",
                color: state === candidate || (!state && !candidate) ? "white" : "#374151",
                cursor: "pointer",
              }}
            >
              {candidate ?? "all"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {(["submittedAt", "unitPriceEstimate", "moq", "leadTime"] as SortField[]).map((field) => (
          <button
            key={field}
            onClick={() => updateFilter({ sort: field, order: sort === field && order === "asc" ? "desc" : "asc" })}
            style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", backgroundColor: sort === field ? "#eff6ff" : "white", cursor: "pointer" }}
          >
            정렬: {field}
          </button>
        ))}
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: "0.75rem", backgroundColor: "white" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
          <thead style={{ backgroundColor: "#f8fafc" }}>
            <tr>
              {['공급자', '단가', 'MOQ', '납기', '샘플비', '상태', '행동'].map((label) => (
                <th key={label} style={{ textAlign: "left", padding: "0.9rem", fontSize: "0.875rem", color: "#475569" }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => (
              <tr key={quote.quoteId} style={{ borderTop: "1px solid #e5e7eb" }}>
                <td style={{ padding: "0.9rem" }}>
                  <div style={{ fontWeight: 600 }}>{quote.companyName}</div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{new Date(quote.submittedAt).toLocaleString("ko-KR")}</div>
                </td>
                <td style={{ padding: "0.9rem" }}>{quote.unitPriceEstimate.toLocaleString()}원</td>
                <td style={{ padding: "0.9rem" }}>{quote.moq.toLocaleString()}</td>
                <td style={{ padding: "0.9rem" }}>{quote.leadTime}일</td>
                <td style={{ padding: "0.9rem" }}>{quote.sampleCost ? `${quote.sampleCost.toLocaleString()}원` : "-"}</td>
                <td style={{ padding: "0.9rem" }}><QuoteStateBadge state={quote.state} /></td>
                <td style={{ padding: "0.9rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button onClick={() => setSelectedQuote(quote)} style={{ padding: "0.4rem 0.7rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", backgroundColor: "white", cursor: "pointer" }}>상세</button>
                    <button
                      onClick={() => navigate(`/threads/${quote.threadId}`)}
                      style={{ padding: "0.4rem 0.7rem", borderRadius: "0.5rem", border: "1px solid #3b82f6", backgroundColor: "#eff6ff", color: "#1d4ed8", cursor: "pointer" }}
                    >
                      메시지
                    </button>
                    {quote.state === "submitted" && (
                      <>
                        <button onClick={() => handleSelectClick(quote)} disabled={selectMutation.isPending} style={{ padding: "0.4rem 0.7rem", borderRadius: "0.5rem", border: "none", backgroundColor: "#166534", color: "white", cursor: "pointer" }}>선택</button>
                        <button onClick={() => handleDeclineClick(quote)} style={{ padding: "0.4rem 0.7rem", borderRadius: "0.5rem", border: "none", backgroundColor: "#b91c1c", color: "white", cursor: "pointer" }}>거절</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta?.totalPages && meta.totalPages > 1 && (
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
          <button onClick={() => updateFilter({ page: String(Math.max(1, page - 1)) })} disabled={!meta.hasPrev}>이전</button>
          <span>{page} / {meta.totalPages}</span>
          <button onClick={() => updateFilter({ page: String(page + 1) })} disabled={!meta.hasNext}>다음</button>
        </div>
      )}

      {selectedQuote && (
        <QuoteDialog
          title="견적 상세"
          onClose={closeDetailDialog}
          footer={(
            <>
              {selectedQuote.state === "submitted" && (
                <>
                  <button
                    onClick={() => handleSelectClick(selectedQuote)}
                    disabled={selectMutation.isPending}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "0.375rem",
                      border: "none",
                      backgroundColor: "#166534",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    이 견적 선택
                  </button>
                  <button
                    onClick={() => handleDeclineClick(selectedQuote)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "0.375rem",
                      border: "none",
                      backgroundColor: "#b91c1c",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    거절
                  </button>
                </>
              )}
              <button
                onClick={closeDetailDialog}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                닫기
              </button>
            </>
          )}
        >
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ marginBottom: "0.5rem" }}><strong>{selectedQuote.companyName}</strong></p>
            <p style={{ marginBottom: "0.5rem" }}>단가 {selectedQuote.unitPriceEstimate.toLocaleString()}원 / MOQ {selectedQuote.moq.toLocaleString()} / 납기 {selectedQuote.leadTime}일</p>
            {selectedQuote.sampleCost && (
              <p style={{ marginBottom: "0.5rem" }}>샘플 비용: {selectedQuote.sampleCost.toLocaleString()}원</p>
            )}
            <p style={{ marginBottom: "0.5rem", color: "#6b7280", fontSize: "0.875rem" }}>
              제출일: {new Date(selectedQuote.submittedAt).toLocaleString("ko-KR")}
            </p>
          </div>
        </QuoteDialog>
      )}

      {actionError && (
        <div style={{ marginTop: "1.5rem", padding: "0.75rem", borderRadius: "0.5rem", backgroundColor: "#fee2e2", color: "#dc2626" }}>
          {actionError}
        </div>
      )}

      {declineTarget && (
        <QuoteDialog
          title="견적 거절"
          tone="danger"
          onClose={closeDeclineDialog}
          footer={(
            <>
              <button
                onClick={() => declineMutation.mutate(
                  { quoteId: declineTarget.quoteId, reason: declineReason },
                  { onSuccess: closeDeclineDialog },
                )}
                disabled={declineMutation.isPending}
              >
                거절 확정
              </button>
              <button onClick={closeDeclineDialog}>취소</button>
            </>
          )}
        >
          <p style={{ marginTop: 0, color: "#991b1b" }}>
            {declineTarget.companyName}의 견적을 거절합니다. 필요하면 사유를 남길 수 있습니다.
          </p>
          <textarea value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} rows={4} style={{ width: "100%" }} placeholder="거절 사유를 입력하세요 (선택)" />
        </QuoteDialog>
      )}

      {selectConfirmTarget && (
        <QuoteDialog
          title="견적 선택 확인"
          tone="success"
          onClose={closeSelectDialog}
          footer={(
            <>
              <button
                onClick={handleConfirmSelect}
                disabled={selectMutation.isPending}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#166534",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                }}
              >
                {selectMutation.isPending ? "처리 중..." : "선택 확정"}
              </button>
              <button
                onClick={closeSelectDialog}
                disabled={selectMutation.isPending}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "transparent",
                  color: "#6b7280",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                }}
              >
                취소
              </button>
            </>
          )}
        >
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ marginBottom: "0.75rem", color: "#166534" }}>
              <strong>{selectConfirmTarget.companyName}</strong>의 견적을 선택하시겠습니까?
            </p>
            <div style={{ padding: "0.75rem", backgroundColor: "white", borderRadius: "0.5rem", marginBottom: "0.75rem" }}>
              <p style={{ margin: "0 0 0.5rem" }}>단가: {selectConfirmTarget.unitPriceEstimate.toLocaleString()}원</p>
              <p style={{ margin: "0 0 0.5rem" }}>MOQ: {selectConfirmTarget.moq.toLocaleString()}</p>
              <p style={{ margin: 0 }}>납기: {selectConfirmTarget.leadTime}일</p>
            </div>
            <p style={{ margin: 0, color: "#b91c1c", fontSize: "0.875rem", fontWeight: 500 }}>
              ⚠️ 견적을 선택하면 의뢰가 마감되고 다른 견적은 자동으로 거절 처리됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
        </QuoteDialog>
      )}
    </section>
  )
}
