import { useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import type { RequestQuoteSummary } from "@fsm/types"
import { useRequestQuotes } from "../hooks/useRequestQuotes"
import { useSelectQuote } from "../hooks/useSelectQuote"
import { useDeclineQuote } from "../hooks/useDeclineQuote"
import { QuoteDialog } from "../components/QuoteDialog"

const quoteStateBadgeClass: Record<string, string> = {
  selected: "badge badge-green",
  declined: "badge badge-red",
  withdrawn: "badge badge-gray",
  submitted: "badge badge-blue",
}

const quoteStateLabel: Record<string, string> = {
  submitted: "대기",
  selected: "선택됨",
  declined: "거절됨",
  withdrawn: "철회됨",
}

function QuoteStateBadge({ state }: { state: RequestQuoteSummary["state"] }) {
  return <span className={quoteStateBadgeClass[state] ?? "badge badge-gray"}>{quoteStateLabel[state] ?? state}</span>
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


  const updateFilter = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(next).forEach(([key, value]) => {
      if (!value) params.delete(key)
      else params.set(key, value)
    })
    setSearchParams(params)
  }

  if (isLoading) {
    return <div className="page"><h1>견적 비교</h1><p className="text-muted">로딩 중...</p></div>
  }

  if (error) {
    return <div className="page"><h1>견적 비교</h1><p className="text-danger">견적 목록을 불러오지 못했습니다.</p></div>
  }

  return (
    <div className="page">
      <Link to={`/requests/${requestId}`} className="btn btn-ghost btn-sm">← 의뢰 상세로 돌아가기</Link>

      <div className="page-header">
        <div className="page-header-text">
          <h1>견적 비교</h1>
          {quotes.length > 0 && <p className="text-muted">받은 견적 {quotes.length}건</p>}
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="empty-state">
          <p>아직 받은 견적이 없습니다.</p>
        </div>
      ) : (
      <>
      {/* Warning banner */}
      <div className="alert-warning">
        <span>⚠</span>
        <span>공급자 선택 후에는 다른 견적이 자동 거절됩니다. 신중하게 선택해주세요.</span>
      </div>

      {/* Table */}
      <div className="surface p-0 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>공급자</th>
              <th>제출일</th>
              <th>단가</th>
              <th>MOQ</th>
              <th>리드타임</th>
              <th>샘플비</th>
              <th>상태</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => (
              <tr key={quote.quoteId} className={quote.state === "selected" ? "row-selected" : ""}>
                <td className="font-semibold" data-label="공급자">{quote.companyName}</td>
                <td className="text-muted" data-label="제출일">{new Date(quote.submittedAt).toLocaleDateString("ko-KR")}</td>
                <td className="font-semibold" data-label="단가">{quote.unitPriceEstimate}</td>
                <td data-label="MOQ">{quote.moq}</td>
                <td data-label="리드타임">{Math.ceil(quote.leadTime / 7)}주</td>
                <td data-label="샘플비">{quote.sampleCost ? quote.sampleCost : "무료"}</td>
                <td data-label="상태"><QuoteStateBadge state={quote.state} /></td>
                <td data-label="">
                  <div className="flex gap-6">
                    {quote.state === "submitted" && (
                      <>
                        <button className="btn btn-sm btn-primary" onClick={() => handleSelectClick(quote)} disabled={selectMutation.isPending}>선택</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeclineClick(quote)}>거절</button>
                      </>
                    )}
                    <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/threads/${quote.threadId}`)}>메시지</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta != null && meta.totalPages >= 1 && (
        <div className="pagination">
          <button disabled={!meta.hasPrev} onClick={() => updateFilter({ page: String(Math.max(1, page - 1)) })}>‹</button>
          {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={p === page ? "active" : ""} onClick={() => updateFilter({ page: String(p) })}>{p}</button>
          ))}
          <button disabled={!meta.hasNext} onClick={() => updateFilter({ page: String(page + 1) })}>›</button>
        </div>
      )}
      </>
      )}

      {/* Quote detail dialog */}
      {selectedQuote && (
        <QuoteDialog
          title="견적 상세"
          onClose={closeDetailDialog}
          footer={(
            <>
              {selectedQuote.state === "submitted" && (
                <>
                  <button className="btn btn-sm btn-primary" onClick={() => handleSelectClick(selectedQuote)} disabled={selectMutation.isPending}>이 견적 선택</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeclineClick(selectedQuote)}>거절</button>
                </>
              )}
              <button className="btn btn-sm btn-secondary" onClick={closeDetailDialog}>닫기</button>
            </>
          )}
        >
          <div className="flex flex-col gap-8">
            <p className="font-semibold">{selectedQuote.companyName}</p>
            <p>단가 {selectedQuote.unitPriceEstimate} / MOQ {selectedQuote.moq} / 납기 {selectedQuote.leadTime}</p>
            {selectedQuote.sampleCost && (
              <p>샘플 비용: {selectedQuote.sampleCost}</p>
            )}
            <p className="text-muted text-sm">제출일: {new Date(selectedQuote.submittedAt).toLocaleString("ko-KR")}</p>
          </div>
        </QuoteDialog>
      )}

      {actionError && (
        <div className="surface">
          <p className="text-danger">{actionError}</p>
        </div>
      )}

      {/* Decline dialog */}
      {declineTarget && (
        <QuoteDialog
          title="견적 거절"
          tone="danger"
          onClose={closeDeclineDialog}
          footer={(
            <>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => declineMutation.mutate(
                  { quoteId: declineTarget.quoteId, reason: declineReason },
                  { onSuccess: closeDeclineDialog },
                )}
                disabled={declineMutation.isPending}
              >
                거절 확정
              </button>
              <button className="btn btn-sm btn-secondary" onClick={closeDeclineDialog}>취소</button>
            </>
          )}
        >
          <p className="text-danger mb-8">
            {declineTarget.companyName}의 견적을 거절합니다. 필요하면 사유를 남길 수 있습니다.
          </p>
          <textarea className="textarea w-full" value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} rows={4} placeholder="거절 사유를 입력하세요 (선택)" />
        </QuoteDialog>
      )}

      {/* Select confirm dialog */}
      {selectConfirmTarget && (
        <QuoteDialog
          title="견적 선택 확인"
          tone="success"
          onClose={closeSelectDialog}
          footer={(
            <>
              <button className="btn btn-sm btn-primary" onClick={handleConfirmSelect} disabled={selectMutation.isPending}>
                {selectMutation.isPending ? "처리 중..." : "선택 확정"}
              </button>
              <button className="btn btn-sm btn-secondary" onClick={closeSelectDialog} disabled={selectMutation.isPending}>취소</button>
            </>
          )}
        >
          <div className="flex flex-col gap-8">
            <p className="text-success font-semibold">
              {selectConfirmTarget.companyName}의 견적을 선택하시겠습니까?
            </p>
            <div className="surface flex flex-col gap-6">
              <p>단가: {selectConfirmTarget.unitPriceEstimate}</p>
              <p>MOQ: {selectConfirmTarget.moq}</p>
              <p>납기: {selectConfirmTarget.leadTime}</p>
            </div>
            <p className="text-danger text-sm font-medium">
              견적을 선택하면 의뢰가 마감되고 다른 견적은 자동으로 거절 처리됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
        </QuoteDialog>
      )}
    </div>
  )
}
