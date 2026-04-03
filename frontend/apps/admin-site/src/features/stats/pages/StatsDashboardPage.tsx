import { useState } from "react"
import { useStatsSummary } from "../hooks/useStatsSummary"

export function StatsDashboardPage() {
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
        <h1>통계 대시보드</h1>
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

      {isLoading ? <p>로딩 중...</p> : null}

      {data && (
        <>
          <div className="kpi-row">
            <div className="surface surface-highlight kpi-card">
              <div className="kpi-label">전체 사용자</div>
              <div className="kpi-value">{data.users.total.toLocaleString()}</div>
            </div>
            <div className="surface surface-highlight kpi-card">
              <div className="kpi-label">의뢰자</div>
              <div className="kpi-value">{data.users.requesters.toLocaleString()}</div>
            </div>
            <div className="surface surface-highlight kpi-card">
              <div className="kpi-label">공급자</div>
              <div className="kpi-value">{data.users.suppliers.toLocaleString()}</div>
            </div>
            <div className="surface surface-highlight kpi-card">
              <div className="kpi-label">검수대기</div>
              <div className="kpi-value">{data.reviews.pending.toLocaleString()}</div>
            </div>
          </div>

          <div className="two-col-sidebar-r">
            <div className="surface">
              <h2 className="section-title mb-16">공급자 검증 상태 분포</h2>
              {(() => {
                const stats = data.suppliersByState
                const max = Math.max(
                  stats.approved, stats.submitted, stats.under_review,
                  stats.hold, stats.rejected, stats.suspended, stats.draft, 1
                )
                const bars = [
                  { label: "승인됨", value: stats.approved, cls: "bar--green" },
                  { label: "제출됨", value: stats.submitted, cls: "bar--blue" },
                  { label: "검토중", value: stats.under_review, cls: "bar--amber" },
                  { label: "보류", value: stats.hold, cls: "bar--orange" },
                  { label: "반려", value: stats.rejected, cls: "bar--red" },
                  { label: "중단", value: stats.suspended, cls: "bar--gray" },
                  { label: "작성중", value: stats.draft, cls: "bar--muted" },
                ]
                return (
                  <div className="bar-chart">
                    {bars.map((bar) => (
                      <div key={bar.label} className="bar-row">
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
              <h2 className="section-title mb-16">의뢰 현황</h2>
              <ul className="stat-list">
                <li className="stat-list-item">
                  <span className="stat-list-label">전체 의뢰</span>
                  <span className="stat-list-value">{data.requests.total.toLocaleString()}</span>
                </li>
                <li className="stat-list-item">
                  <span className="stat-list-label">진행중</span>
                  <span className="stat-list-value">{data.requests.open.toLocaleString()}</span>
                </li>
                <li className="stat-list-item">
                  <span className="stat-list-label">마감</span>
                  <span className="stat-list-value">{data.requests.closed.toLocaleString()}</span>
                </li>
                <li className="stat-list-item">
                  <span className="stat-list-label">취소</span>
                  <span className="stat-list-value">{data.requests.cancelled.toLocaleString()}</span>
                </li>
                <li className="stat-list-item">
                  <span className="stat-list-label">작성중</span>
                  <span className="stat-list-value">{data.requests.draft.toLocaleString()}</span>
                </li>
              </ul>

              <h2 className="section-title mb-16">검수 현황</h2>
              <ul className="stat-list">
                <li className="stat-list-item">
                  <span className="stat-list-label">평균 검수 일수</span>
                  <span className="stat-list-value">{data.reviews.avgReviewDays.toFixed(1)}일</span>
                </li>
                <li className="stat-list-item">
                  <span className="stat-list-label">전체 검수 완료</span>
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
