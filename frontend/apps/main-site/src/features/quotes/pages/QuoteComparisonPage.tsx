import { useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
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

function QuoteStateBadge({ state }: { state: RequestQuoteSummary["state"] }) {
  const { t } = useTranslation("quotes")
  return <span className={quoteStateBadgeClass[state] ?? "badge badge-gray"}>{t(`state.${state}`, { defaultValue: state })}</span>
}

type SortField = "submittedAt" | "unitPriceEstimate" | "moq" | "leadTime"

export function QuoteComparisonPage() {
  const { t } = useTranslation("quotes")
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
        setActionError(t("comparison.selectErrorMessage"))
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
    return <div className="page"><h1>{t("comparison.title")}</h1><p className="text-muted">{t("comparison.loading")}</p></div>
  }

  if (error) {
    return <div className="page"><h1>{t("comparison.title")}</h1><p className="text-danger">{t("comparison.loadError")}</p></div>
  }

  return (
    <div className="page">
      <Link to={`/requests/${requestId}`} className="btn btn-ghost btn-sm">{t("comparison.backToDetail")}</Link>

      <div className="page-header">
        <div className="page-header-text">
          <h1>{t("comparison.title")}</h1>
          {quotes.length > 0 && <p className="text-muted">{t("comparison.receivedCount", { count: quotes.length })}</p>}
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="empty-state">
          <p>{t("comparison.emptyMessage")}</p>
        </div>
      ) : (
      <>
      {/* Warning banner */}
      <div className="alert-warning">
        <span>⚠</span>
        <span>{t("comparison.warningBanner")}</span>
      </div>

      {/* Table */}
      <div className="surface p-0 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("comparison.headers.supplier")}</th>
              <th>{t("comparison.headers.submittedAt")}</th>
              <th>{t("comparison.headers.unitPrice")}</th>
              <th>{t("comparison.headers.moq")}</th>
              <th>{t("comparison.headers.leadTime")}</th>
              <th>{t("comparison.headers.sampleCost")}</th>
              <th>{t("comparison.headers.state")}</th>
              <th>{t("comparison.headers.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => (
              <tr key={quote.quoteId} className={quote.state === "selected" ? "row-selected" : ""}>
                <td className="font-semibold" data-label={t("comparison.headers.supplier")}>{quote.companyName}</td>
                <td className="text-muted" data-label={t("comparison.headers.submittedAt")}>{new Date(quote.submittedAt).toLocaleDateString("ko-KR")}</td>
                <td className="font-semibold" data-label={t("comparison.headers.unitPrice")}>{quote.unitPriceEstimate}</td>
                <td data-label={t("comparison.headers.moq")}>{quote.moq}</td>
                <td data-label={t("comparison.headers.leadTime")}>{t("comparison.leadTimeWeeks", { weeks: Math.ceil(Number(quote.leadTime) / 7) || 0 })}</td>
                <td data-label={t("comparison.headers.sampleCost")}>{quote.sampleCost ? quote.sampleCost : t("comparison.sampleFree")}</td>
                <td data-label={t("comparison.headers.state")}><QuoteStateBadge state={quote.state} /></td>
                <td data-label="">
                  <div className="flex gap-6">
                    {quote.state === "submitted" && (
                      <>
                        <button className="btn btn-sm btn-primary" onClick={() => handleSelectClick(quote)} disabled={selectMutation.isPending}>{t("comparison.selectButton")}</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeclineClick(quote)}>{t("comparison.declineButton")}</button>
                      </>
                    )}
                    <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/threads/${quote.threadId}`)}>{t("comparison.messageButton")}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta?.totalPages != null && meta.totalPages >= 1 && (
        <div className="pagination">
          <button aria-label={t("common:previous")} disabled={!meta.hasPrev} onClick={() => updateFilter({ page: String(Math.max(1, page - 1)) })}>‹</button>
          {Array.from({ length: Math.min(meta.totalPages ?? 1, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={p === page ? "active" : ""} onClick={() => updateFilter({ page: String(p) })}>{p}</button>
          ))}
          <button aria-label={t("common:next")} disabled={!meta.hasNext} onClick={() => updateFilter({ page: String(page + 1) })}>›</button>
        </div>
      )}
      </>
      )}

      {/* Quote detail dialog */}
      {selectedQuote && (
        <QuoteDialog
          title={t("comparison.detailDialogTitle")}
          onClose={closeDetailDialog}
          footer={(
            <>
              {selectedQuote.state === "submitted" && (
                <>
                  <button className="btn btn-sm btn-primary" onClick={() => handleSelectClick(selectedQuote)} disabled={selectMutation.isPending}>{t("comparison.detailSelectButton")}</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeclineClick(selectedQuote)}>{t("comparison.declineButton")}</button>
                </>
              )}
              <button className="btn btn-sm btn-secondary" onClick={closeDetailDialog}>{t("common:close")}</button>
            </>
          )}
        >
          <div className="flex flex-col gap-8">
            <p className="font-semibold">{selectedQuote.companyName}</p>
            <p>{t("comparison.detailSummary", { price: selectedQuote.unitPriceEstimate, moq: selectedQuote.moq, leadTime: selectedQuote.leadTime })}</p>
            {selectedQuote.sampleCost && (
              <p>{t("comparison.sampleCostLabel", { cost: selectedQuote.sampleCost })}</p>
            )}
            <p className="text-muted text-sm">{t("comparison.submittedAtLabel", { date: new Date(selectedQuote.submittedAt).toLocaleString("ko-KR") })}</p>
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
          title={t("comparison.declineDialogTitle")}
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
                {t("comparison.declineConfirmButton")}
              </button>
              <button className="btn btn-sm btn-secondary" onClick={closeDeclineDialog}>{t("common:cancel")}</button>
            </>
          )}
        >
          <p className="text-danger mb-8">
            {t("comparison.declineConfirmMessage", { companyName: declineTarget.companyName })}
          </p>
          <textarea className="textarea w-full" value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} rows={4} placeholder={t("comparison.declineReasonPlaceholder")} />
        </QuoteDialog>
      )}

      {/* Select confirm dialog */}
      {selectConfirmTarget && (
        <QuoteDialog
          title={t("comparison.selectConfirmTitle")}
          tone="success"
          onClose={closeSelectDialog}
          footer={(
            <>
              <button className="btn btn-sm btn-primary" onClick={handleConfirmSelect} disabled={selectMutation.isPending}>
                {selectMutation.isPending ? t("common:processing") : t("comparison.selectConfirmButton")}
              </button>
              <button className="btn btn-sm btn-secondary" onClick={closeSelectDialog} disabled={selectMutation.isPending}>{t("common:cancel")}</button>
            </>
          )}
        >
          <div className="flex flex-col gap-8">
            <p className="text-success font-semibold">
              {t("comparison.selectConfirmMessage", { companyName: selectConfirmTarget.companyName })}
            </p>
            <div className="surface flex flex-col gap-6">
              <p>{t("comparison.selectUnitPriceLabel", { value: selectConfirmTarget.unitPriceEstimate })}</p>
              <p>{t("comparison.selectMoqLabel", { value: selectConfirmTarget.moq })}</p>
              <p>{t("comparison.selectLeadTimeLabel", { value: selectConfirmTarget.leadTime })}</p>
            </div>
            <p className="text-danger text-sm font-medium">
              {t("comparison.selectConfirmWarning")}
            </p>
          </div>
        </QuoteDialog>
      )}
    </div>
  )
}
