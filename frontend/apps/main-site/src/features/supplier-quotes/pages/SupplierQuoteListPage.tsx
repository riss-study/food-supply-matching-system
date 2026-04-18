import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useSupplierQuotes } from "../hooks/useSupplierQuotes"
import { useUpdateQuote } from "../hooks/useUpdateQuote"
import { useWithdrawQuote } from "../hooks/useWithdrawQuote"
import type { SupplierQuoteSummary } from "@fsm/types"

export function SupplierQuoteListPage() {
  const { t } = useTranslation("supplier-quotes")
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<SupplierQuoteSummary | null>(null)
  const [unitPriceEstimate, setUnitPriceEstimate] = useState("")
  const [moq, setMoq] = useState("")
  const [leadTime, setLeadTime] = useState("")
  const [sampleCost, setSampleCost] = useState("")
  const [note, setNote] = useState("")
  const [editError, setEditError] = useState<string | null>(null)
  const { data, isLoading, error } = useSupplierQuotes({ page, size: 20 })
  const updateMutation = useUpdateQuote()
  const withdrawMutation = useWithdrawQuote()
  const openEdit = (quote: SupplierQuoteSummary) => {
    setEditing(quote)
    setEditError(null)
    setUnitPriceEstimate(quote.unitPriceEstimate)
    setMoq(quote.moq)
    setLeadTime(quote.leadTime)
    setSampleCost(quote.sampleCost ?? "")
    setNote("")
  }

  const handleSave = () => {
    if (!editing) return

    if (!unitPriceEstimate.trim() || !moq.trim() || !leadTime.trim()) {
      setEditError(t("list.requiredFieldsError"))
      return
    }

    setEditError(null)
    updateMutation.mutate(
      {
        quoteId: editing.quoteId,
        request: {
          unitPriceEstimate: unitPriceEstimate.trim(),
          moq: moq.trim(),
          leadTime: leadTime.trim(),
          sampleCost: sampleCost.trim() || undefined,
          note: note || undefined,
        },
      },
      { onSuccess: () => setEditing(null) },
    )
  }

  const [stateFilter, setStateFilter] = useState<string>("")

  const stateBadgeClass: Record<string, string> = {
    submitted: "badge badge-blue",
    selected: "badge badge-green",
    declined: "badge badge-red",
    withdrawn: "badge badge-gray",
  }

  const allItems = data?.items ?? []
  const filteredItems = stateFilter ? allItems.filter((item) => item.state === stateFilter) : allItems

  if (isLoading) return <div className="page"><div className="page-header"><h1>{t("list.title")}</h1></div><p>{t("list.loading")}</p></div>
  if (error) return <div className="page"><div className="page-header"><h1>{t("list.title")}</h1></div><p className="text-danger">{t("list.loadError")}</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-text">
          <h1>{t("list.title")}</h1>
        </div>
      </div>

      <div className="tab-underline">
        {[
          { value: "", label: t("list.tabAll") },
          { value: "submitted", label: t("state.submitted") },
          { value: "selected", label: t("state.selected") },
          { value: "declined", label: t("state.declined") },
          { value: "withdrawn", label: t("state.withdrawn") },
        ].map((tab) => (
          <button
            key={tab.value}
            className={stateFilter === tab.value ? "active" : ""}
            onClick={() => setStateFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <p>{t("list.emptyMessage")}</p>
        </div>
      ) : (
        <div className="surface p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("list.headers.request")}</th>
                <th>{t("list.headers.unitPrice")}</th>
                <th>{t("list.headers.moq")}</th>
                <th>{t("list.headers.leadTime")}</th>
                <th>{t("list.headers.state")}</th>
                <th>{t("list.headers.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((quote) => (
                <tr key={quote.quoteId}>
                  <td className="font-semibold" data-label={t("list.headers.request")}>{quote.requestTitle}</td>
                  <td data-label={t("list.headers.unitPrice")}>{quote.unitPriceEstimate}</td>
                  <td data-label={t("list.headers.moq")}>{quote.moq}</td>
                  <td data-label={t("list.headers.leadTime")}>{quote.leadTime}</td>
                  <td data-label={t("list.headers.state")}>
                    <span className={stateBadgeClass[quote.state] ?? "badge badge-gray"}>{t(`state.${quote.state}`, { defaultValue: quote.state })}</span>
                  </td>
                  <td data-label={t("list.headers.actions")}>
                    <div className="flex gap-6">
                      {quote.state === "selected" && (
                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/threads/${quote.threadId}`)}>{t("list.messageButton")}</button>
                      )}
                      {quote.state === "submitted" && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(quote)}>{t("list.editButton")}</button>
                          <button className="text-danger text-sm font-medium cursor-pointer" style={{ background: "none", border: "none" }} onClick={() => withdrawMutation.mutate(quote.quoteId)}>{t("list.withdrawButton")}</button>
                        </>
                      )}
                      {quote.state === "declined" && <span className="text-muted text-sm">{t("list.declinedDash")}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="surface surface-highlight">
          <h2 className="section-title mb-16">{t("list.editTitle")}</h2>
          <div className="form-stack">
            <div className="form-row">
              <div className="input-field">
                <label>{t("list.editUnitPriceLabel")}</label>
                <input className="input" type="text" value={unitPriceEstimate} onChange={(e) => setUnitPriceEstimate(e.target.value)} placeholder={t("list.editUnitPricePlaceholder")} />
              </div>
              <div className="input-field">
                <label>{t("list.editMoqLabel")}</label>
                <input className="input" type="text" value={moq} onChange={(e) => setMoq(e.target.value)} placeholder={t("list.editMoqPlaceholder")} />
              </div>
            </div>
            <div className="form-row">
              <div className="input-field">
                <label>{t("list.editLeadTimeLabel")}</label>
                <input className="input" type="text" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} placeholder={t("list.editLeadTimePlaceholder")} />
              </div>
              <div className="input-field">
                <label>{t("list.editSampleCostLabel")}</label>
                <input className="input" type="text" value={sampleCost} onChange={(e) => setSampleCost(e.target.value)} placeholder={t("list.editSampleCostPlaceholder")} />
              </div>
            </div>
            <div className="input-field">
              <label>{t("list.editNoteLabel")}</label>
              <textarea className="textarea" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("list.editNotePlaceholder")} />
            </div>
            {editError && <p className="text-danger text-sm">{editError}</p>}
            <div className="btn-group">
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={updateMutation.isPending}>
                {t("list.saveButton")}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(null); setEditError(null) }}>
                {t("list.cancelButton")}
              </button>
            </div>
          </div>
        </div>
      )}

      {data?.meta?.totalPages != null && data.meta.totalPages >= 1 && (
        <div className="pagination">
          <button disabled={!data.meta.hasPrev} onClick={() => setPage((current) => Math.max(1, current - 1))}>‹</button>
          {Array.from({ length: Math.min(data.meta.totalPages ?? 1, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button disabled={!data.meta.hasNext} onClick={() => setPage((current) => current + 1)}>›</button>
        </div>
      )}
    </div>
  )
}
