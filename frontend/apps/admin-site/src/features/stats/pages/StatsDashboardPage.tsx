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

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "1.5rem",
  }

  const cardTitleStyle: React.CSSProperties = {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.025em",
    marginBottom: "0.5rem",
  }

  const cardValueStyle: React.CSSProperties = {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#111827",
  }

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
  }

  const sectionStyle: React.CSSProperties = {
    marginBottom: "2rem",
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "1rem",
  }

  const barStyle = (value: number, max: number, color: string): React.CSSProperties => ({
    height: "24px",
    backgroundColor: color,
    width: `${max > 0 ? (value / max) * 100 : 0}%`,
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    paddingLeft: "0.5rem",
    color: "white",
    fontSize: "0.75rem",
    fontWeight: 600,
    minWidth: value > 0 ? "40px" : "0",
  })

  const barRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    marginBottom: "0.5rem",
  }

  const barLabelStyle: React.CSSProperties = {
    width: "120px",
    fontSize: "0.875rem",
    color: "#374151",
  }

  const barContainerStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: "#e5e7eb",
    borderRadius: "4px",
    overflow: "hidden",
  }

  const barValueStyle: React.CSSProperties = {
    width: "60px",
    textAlign: "right",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#374151",
  }

  return (
    <section>
      <h1>통계 대시보드</h1>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <label>
          기간 시작
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label>
          기간 종료
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>
      </div>

      {isLoading ? <p>로딩 중...</p> : null}

      {data && (
        <>
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>사용자 통계</h2>
            <div style={gridStyle}>
              <div style={cardStyle}>
                <div style={cardTitleStyle}>전체 사용자</div>
                <div style={cardValueStyle}>{data.users.total.toLocaleString()}</div>
              </div>
              <div style={cardStyle}>
                <div style={cardTitleStyle}>의뢰자</div>
                <div style={cardValueStyle}>{data.users.requesters.toLocaleString()}</div>
              </div>
              <div style={cardStyle}>
                <div style={cardTitleStyle}>공급자</div>
                <div style={cardValueStyle}>{data.users.suppliers.toLocaleString()}</div>
              </div>
              <div style={cardStyle}>
                <div style={cardTitleStyle}>관리자</div>
                <div style={cardValueStyle}>{data.users.admins.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>공급자 상태별 현황</h2>
            <div style={cardStyle}>
              {(() => {
                const stats = data.suppliersByState
                const max = Math.max(
                  stats.approved,
                  stats.submitted,
                  stats.underReview,
                  stats.hold,
                  stats.rejected,
                  stats.suspended,
                  stats.draft,
                  1
                )
                return (
                  <>
                    <div style={barRowStyle}>
                      <span style={barLabelStyle}>승인됨</span>
                      <div style={barContainerStyle}>
                        <div style={barStyle(stats.approved, max, "#10b981")}>
                          {stats.approved > 0 && stats.approved}
                        </div>
                      </div>
                      <span style={barValueStyle}>{stats.approved.toLocaleString()}</span>
                    </div>
                    <div style={barRowStyle}>
                      <span style={barLabelStyle}>제출됨</span>
                      <div style={barContainerStyle}>
                        <div style={barStyle(stats.submitted, max, "#3b82f6")}>
                          {stats.submitted > 0 && stats.submitted}
                        </div>
                      </div>
                      <span style={barValueStyle}>{stats.submitted.toLocaleString()}</span>
                    </div>
                    <div style={barRowStyle}>
                      <span style={barLabelStyle}>검토중</span>
                      <div style={barContainerStyle}>
                        <div style={barStyle(stats.underReview, max, "#f59e0b")}>
                          {stats.underReview > 0 && stats.underReview}
                        </div>
                      </div>
                      <span style={barValueStyle}>{stats.underReview.toLocaleString()}</span>
                    </div>
                    <div style={barRowStyle}>
                      <span style={barLabelStyle}>보류</span>
                      <div style={barContainerStyle}>
                        <div style={barStyle(stats.hold, max, "#f97316")}>
                          {stats.hold > 0 && stats.hold}
                        </div>
                      </div>
                      <span style={barValueStyle}>{stats.hold.toLocaleString()}</span>
                    </div>
                    <div style={barRowStyle}>
                      <span style={barLabelStyle}>반려</span>
                      <div style={barContainerStyle}>
                        <div style={barStyle(stats.rejected, max, "#ef4444")}>
                          {stats.rejected > 0 && stats.rejected}
                        </div>
                      </div>
                      <span style={barValueStyle}>{stats.rejected.toLocaleString()}</span>
                    </div>
                    <div style={barRowStyle}>
                      <span style={barLabelStyle}>중단</span>
                      <div style={barContainerStyle}>
                        <div style={barStyle(stats.suspended, max, "#6b7280")}>
                          {stats.suspended > 0 && stats.suspended}
                        </div>
                      </div>
                      <span style={barValueStyle}>{stats.suspended.toLocaleString()}</span>
                    </div>
                    <div style={barRowStyle}>
                      <span style={barLabelStyle}>작성중</span>
                      <div style={barContainerStyle}>
                        <div style={barStyle(stats.draft, max, "#9ca3af")}>
                          {stats.draft > 0 && stats.draft}
                        </div>
                      </div>
                      <span style={barValueStyle}>{stats.draft.toLocaleString()}</span>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>검수 현황</h2>
            <div style={gridStyle}>
              <div style={cardStyle}>
                <div style={cardTitleStyle}>검수 대기</div>
                <div style={cardValueStyle}>{data.reviews.pending.toLocaleString()}</div>
              </div>
              <div style={cardStyle}>
                <div style={cardTitleStyle}>평균 검수 일수</div>
                <div style={cardValueStyle}>{data.reviews.avgReviewDays.toFixed(1)}일</div>
              </div>
              <div style={cardStyle}>
                <div style={cardTitleStyle}>전체 검수 완료</div>
                <div style={cardValueStyle}>{data.reviews.totalReviewed.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>의뢰 현황</h2>
            <div style={gridStyle}>
              <div style={cardStyle}>
                <div style={cardTitleStyle}>전체 의뢰</div>
                <div style={cardValueStyle}>{data.requests.total.toLocaleString()}</div>
              </div>
              <div style={cardStyle}>
                <div style={cardTitleStyle}>진행중</div>
                <div style={cardValueStyle}>{data.requests.open.toLocaleString()}</div>
              </div>
              <div style={cardStyle}>
                <div style={cardTitleStyle}>마감</div>
                <div style={cardValueStyle}>{data.requests.closed.toLocaleString()}</div>
              </div>
              <div style={cardStyle}>
                <div style={cardTitleStyle}>취소</div>
                <div style={cardValueStyle}>{data.requests.cancelled.toLocaleString()}</div>
              </div>
              <div style={cardStyle}>
                <div style={cardTitleStyle}>작성중</div>
                <div style={cardValueStyle}>{data.requests.draft.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
