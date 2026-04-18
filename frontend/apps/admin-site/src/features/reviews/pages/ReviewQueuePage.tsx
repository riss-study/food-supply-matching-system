import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useReviewQueue } from "../hooks/useReviewQueue"
import { StateBadge } from "../components/StateBadge"
import type { PaginationMeta } from "@fsm/types"

const tabs = [
  { value: "", labelKey: "tabs.all" },
  { value: "submitted", labelKey: "tabs.submitted" },
  { value: "under_review", labelKey: "tabs.under_review" },
  { value: "hold", labelKey: "tabs.hold" },
  { value: "approved", labelKey: "tabs.approved" },
  { value: "rejected", labelKey: "tabs.rejected" },
]

export function ReviewQueuePage() {
  const { t } = useTranslation("reviews")
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
        <h1>{t("queueTitle")}</h1>
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
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {isLoading ? <p className="text-muted text-center">{t("common:loading")}</p> : null}

      {!isLoading && data?.items.length === 0 ? (
        <div className="empty-state">
          <p>{t("empty")}</p>
        </div>
      ) : data?.items.length ? (
        <div className="surface p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("columns.companyName")}</th>
                <th>{t("columns.state")}</th>
                <th>{t("columns.submittedAt")}</th>
                <th>{t("columns.pendingDays")}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.reviewId} className="cursor-pointer" onClick={() => window.location.href = `/reviews/${item.reviewId}`}>
                  <td className="font-semibold" data-label={t("columns.companyName")}>{item.companyName}</td>
                  <td data-label={t("columns.stateShort")}>
                    <StateBadge state={item.state} />
                  </td>
                  <td className="text-muted" data-label={t("columns.submittedAt")}>{new Date(item.submittedAt).toLocaleDateString("ko-KR")}</td>
                  <td data-label={t("columns.pendingDays")} className="font-semibold" style={{ color: item.pendingDays > 7 ? "var(--danger)" : item.pendingDays > 3 ? "var(--warning)" : "var(--ink)" }}>
                    {item.pendingDays > 0 ? t("pendingDaysValue", { days: item.pendingDays }) : t("common:notAvailable")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {meta?.totalPages != null && meta.totalPages >= 1 && (
        <div className="pagination">
          <button disabled={!meta.hasPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
          {Array.from({ length: Math.min(meta.totalPages ?? 1, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button disabled={!meta.hasNext} onClick={() => setPage((p) => Math.min(meta.totalPages || p, p + 1))}>›</button>
        </div>
      )}
    </div>
  )
}
