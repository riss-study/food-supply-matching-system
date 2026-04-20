import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { AdminSupplierReviewHiddenFilter, AdminSupplierReviewListItem } from "@fsm/types"
import { useSupplierReviews } from "../hooks/useSupplierReviews"
import { useHideSupplierReview, useUnhideSupplierReview } from "../hooks/useSupplierReviewModeration"

const HIDDEN_TABS: { value: AdminSupplierReviewHiddenFilter; labelKey: string }[] = [
  { value: "all", labelKey: "filter.hiddenAll" },
  { value: "false", labelKey: "filter.hiddenFalse" },
  { value: "true", labelKey: "filter.hiddenTrue" },
]

function StarsDisplay({ value }: { value: number }) {
  const filled = "★".repeat(Math.max(0, Math.min(5, value)))
  const empty = "☆".repeat(Math.max(0, 5 - value))
  return <span aria-label={`별점 ${value}점`} style={{ color: "var(--accent, #f59e0b)" }}>{filled}<span style={{ color: "var(--border)" }}>{empty}</span></span>
}

export function SupplierReviewListPage() {
  const { t } = useTranslation("supplier-reviews")
  const [hidden, setHidden] = useState<AdminSupplierReviewHiddenFilter>("all")
  const [supplierIdInput, setSupplierIdInput] = useState("")
  const [supplierId, setSupplierId] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isLoading, isError } = useSupplierReviews({ hidden, supplierId, page, size: 20 })
  const hideMutation = useHideSupplierReview()
  const unhideMutation = useUnhideSupplierReview()

  const items: AdminSupplierReviewListItem[] = data?.items ?? []
  const meta = data?.meta ?? {}

  const applySupplierFilter = () => {
    setSupplierId(supplierIdInput.trim() || undefined)
    setPage(1)
  }

  const resetSupplierFilter = () => {
    setSupplierIdInput("")
    setSupplierId(undefined)
    setPage(1)
  }

  const toggleHidden = (item: AdminSupplierReviewListItem) => {
    setActionError(null)
    const mutation = item.hidden ? unhideMutation : hideMutation
    mutation.mutate(item.reviewId, {
      onError: () => setActionError(item.hidden ? t("error.unhide") : t("error.hide")),
    })
  }

  const isMutating = hideMutation.isPending || unhideMutation.isPending

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{t("page.title")}</h1>
          <p className="text-muted">{t("page.description")}</p>
        </div>
        <div className="page-header-actions">
          <input
            type="text"
            className="input"
            value={supplierIdInput}
            onChange={(e) => setSupplierIdInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") applySupplierFilter() }}
            placeholder={t("filter.supplierIdPlaceholder")}
            aria-label={t("filter.supplierIdLabel")}
            style={{ minWidth: 200 }}
          />
          <button type="button" className="btn btn-sm btn-secondary" onClick={applySupplierFilter}>
            {t("common:apply")}
          </button>
          {supplierId && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={resetSupplierFilter}>
              {t("filter.reset")}
            </button>
          )}
        </div>
      </div>

      <div className="tab-underline">
        {HIDDEN_TABS.map((tab) => (
          <button
            key={tab.value}
            className={hidden === tab.value ? "active" : ""}
            onClick={() => { setHidden(tab.value); setPage(1) }}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {actionError && <p className="text-danger text-sm" role="alert">{actionError}</p>}

      {isLoading ? (
        <p className="text-muted text-center">{t("table.loading")}</p>
      ) : isError ? (
        <p className="text-danger text-center">{t("table.loadError")}</p>
      ) : items.length === 0 ? (
        <div className="empty-state"><p>{t("table.empty")}</p></div>
      ) : (
        <div className="surface p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("table.headers.rating")}</th>
                <th>{t("table.headers.text")}</th>
                <th>{t("table.headers.requester")}</th>
                <th>{t("table.headers.supplier")}</th>
                <th>{t("table.headers.createdAt")}</th>
                <th>{t("table.headers.state")}</th>
                <th>{t("table.headers.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.reviewId} style={r.hidden ? { opacity: 0.6 } : undefined}>
                  <td data-label={t("table.headers.rating")}><StarsDisplay value={r.rating} /></td>
                  <td data-label={t("table.headers.text")} style={{ maxWidth: 320, whiteSpace: "pre-wrap" }}>
                    {r.text ?? <span className="text-muted">—</span>}
                  </td>
                  <td data-label={t("table.headers.requester")}>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{r.requesterCompanyName ?? r.requesterUserId}</span>
                      <span className="text-muted text-xs">{r.requesterUserId}</span>
                    </div>
                  </td>
                  <td data-label={t("table.headers.supplier")}>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{r.supplierCompanyName}</span>
                      <span className="text-muted text-xs">{r.supplierProfileId}</span>
                    </div>
                  </td>
                  <td data-label={t("table.headers.createdAt")} className="text-muted text-sm">
                    {new Date(r.createdAt).toLocaleString("ko-KR")}
                  </td>
                  <td data-label={t("table.headers.state")}>
                    <span className={r.hidden ? "badge badge-gray" : "badge badge-green"}>
                      {r.hidden ? t("table.state.hidden") : t("table.state.visible")}
                    </span>
                  </td>
                  <td data-label={t("table.headers.actions")}>
                    <button
                      type="button"
                      className={`btn btn-sm ${r.hidden ? "btn-primary" : "btn-danger"}`}
                      onClick={() => toggleHidden(r)}
                      disabled={isMutating}
                    >
                      {isMutating ? t("table.action.pending") : (r.hidden ? t("table.action.unhide") : t("table.action.hide"))}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta.totalPages != null && meta.totalPages >= 1 && (
        <div className="pagination">
          <button aria-label={t("common:previous")} disabled={!meta.hasPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
          {Array.from({ length: Math.min(meta.totalPages ?? 1, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button aria-label={t("common:next")} disabled={!meta.hasNext} onClick={() => setPage((p) => Math.min(meta.totalPages || p, p + 1))}>›</button>
        </div>
      )}
    </div>
  )
}
