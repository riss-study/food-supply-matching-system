import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useStatsSummary } from "../hooks/useStatsSummary"

export function StatsDashboardPage() {
  const { t } = useTranslation("stats")
  const today = new Date().toISOString().split("T")[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const [fromDate, setFromDate] = useState(thirtyDaysAgo)
  const [toDate, setToDate] = useState(today)

  const { data, isLoading } = useStatsSummary({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  })

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t("title")}</h1>
        <div className="page-header-actions">
          <div className="input-field input-field--inline">
            <input className="input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <span className="page-header-separator">~</span>
          <div className="input-field input-field--inline">
            <input className="input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
      </div>

      {isLoading ? <p>{t("common:loading")}</p> : null}

      {data && (
        <>
          <div className="kpi-row">
            <div className="surface surface-highlight kpi-card">
              <div className="kpi-label">{t("kpi.totalUsers")}</div>
              <div className="kpi-value">{data.users.total.toLocaleString()}</div>
            </div>
            <div className="surface surface-highlight kpi-card">
              <div className="kpi-label">{t("kpi.requesters")}</div>
              <div className="kpi-value">{data.users.requesters.toLocaleString()}</div>
            </div>
            <div className="surface surface-highlight kpi-card">
              <div className="kpi-label">{t("kpi.suppliers")}</div>
              <div className="kpi-value">{data.users.suppliers.toLocaleString()}</div>
            </div>
            <div className="surface surface-highlight kpi-card">
              <div className="kpi-label">{t("kpi.pendingReviews")}</div>
              <div className="kpi-value">{data.reviews.pending.toLocaleString()}</div>
            </div>
          </div>

          <div className="two-col-sidebar-r">
            <div className="surface">
              <h2 className="section-title mb-16">{t("supplierStateTitle")}</h2>
              {(() => {
                const stats = data.suppliersByState
                const max = Math.max(
                  stats.approved, stats.submitted, stats.under_review,
                  stats.hold, stats.rejected, stats.suspended, stats.draft, 1
                )
                const bars = [
                  { key: "approved", label: t("supplierState.approved"), value: stats.approved, cls: "bar--green" },
                  { key: "submitted", label: t("supplierState.submitted"), value: stats.submitted, cls: "bar--blue" },
                  { key: "under_review", label: t("supplierState.under_review"), value: stats.under_review, cls: "bar--amber" },
                  { key: "hold", label: t("supplierState.hold"), value: stats.hold, cls: "bar--orange" },
                  { key: "rejected", label: t("supplierState.rejected"), value: stats.rejected, cls: "bar--red" },
                  { key: "suspended", label: t("supplierState.suspended"), value: stats.suspended, cls: "bar--gray" },
                  { key: "draft", label: t("supplierState.draft"), value: stats.draft, cls: "bar--muted" },
                ]
                return (
                  <div className="bar-chart">
                    {bars.map((bar) => (
                      <div key={bar.key} className="bar-row">
                        <span className="bar-label">{bar.label}</span>
                        <div className="bar-track">
                          <div
                            className={`bar-fill ${bar.cls}`}
                            style={{ width: `${max > 0 ? (bar.value / max) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="bar-value">{bar.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            <div className="surface">
              <h2 className="section-title mb-16">{t("requestsTitle")}</h2>
              <ul className="stat-list">
                <li className="stat-list-item">
                  <span className="stat-list-label">{t("requests.total")}</span>
                  <span className="stat-list-value">{data.requests.total.toLocaleString()}</span>
                </li>
                <li className="stat-list-item">
                  <span className="stat-list-label">{t("requests.open")}</span>
                  <span className="stat-list-value">{data.requests.open.toLocaleString()}</span>
                </li>
                <li className="stat-list-item">
                  <span className="stat-list-label">{t("requests.closed")}</span>
                  <span className="stat-list-value">{data.requests.closed.toLocaleString()}</span>
                </li>
                <li className="stat-list-item">
                  <span className="stat-list-label">{t("requests.cancelled")}</span>
                  <span className="stat-list-value">{data.requests.cancelled.toLocaleString()}</span>
                </li>
                <li className="stat-list-item">
                  <span className="stat-list-label">{t("requests.draft")}</span>
                  <span className="stat-list-value">{data.requests.draft.toLocaleString()}</span>
                </li>
              </ul>

              <h2 className="section-title mb-16">{t("reviewsTitle")}</h2>
              <ul className="stat-list">
                <li className="stat-list-item">
                  <span className="stat-list-label">{t("reviews.avgReviewDays")}</span>
                  <span className="stat-list-value">{t("daysValue", { days: data.reviews.avgReviewDays.toFixed(1) })}</span>
                </li>
                <li className="stat-list-item">
                  <span className="stat-list-label">{t("reviews.totalReviewed")}</span>
                  <span className="stat-list-value">{data.reviews.totalReviewed.toLocaleString()}</span>
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
