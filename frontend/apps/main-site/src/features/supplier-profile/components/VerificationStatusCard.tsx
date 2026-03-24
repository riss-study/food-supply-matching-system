import { Link } from "react-router-dom"
import type { LatestVerificationSubmissionResponse, SupplierVerificationState } from "@fsm/types"

const stateLabels: Record<SupplierVerificationState, string> = {
  draft: "초안",
  submitted: "제출됨",
  under_review: "검토 중",
  hold: "보류",
  approved: "승인됨",
  rejected: "반려됨",
  suspended: "중단됨",
}

const stateColors: Record<SupplierVerificationState, string> = {
  draft: "#6b7280",
  submitted: "#f59e0b",
  under_review: "#3b82f6",
  hold: "#f97316",
  approved: "#10b981",
  rejected: "#ef4444",
  suspended: "#991b1b",
}

interface VerificationStatusCardProps {
  submission: LatestVerificationSubmissionResponse | null
  profileId?: string
  verificationState?: SupplierVerificationState
}

export function VerificationStatusCard({ submission, profileId, verificationState }: VerificationStatusCardProps) {
  const isApproved = verificationState === "approved"

  if (!submission) {
    return (
      <div style={{ padding: "1rem", border: "1px dashed #9ca3af", borderRadius: "0.5rem" }}>
        <strong>검수 제출 전</strong>
        <p style={{ margin: "0.5rem 0 0" }}>사업자등록증과 필요한 파일을 업로드해 검수를 시작하세요.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: `1px solid ${stateColors[submission.state]}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <strong>검수 상태</strong>
        <span style={{ color: stateColors[submission.state] }}>{stateLabels[submission.state]}</span>
      </div>
      <p style={{ margin: 0 }}>제출일: {new Date(submission.submittedAt).toLocaleDateString("ko-KR")}</p>
      {submission.reviewNotePublic ? <p style={{ marginTop: "0.5rem" }}>안내: {submission.reviewNotePublic}</p> : null}
      {submission.files.length > 0 ? (
        <ul style={{ marginTop: "0.75rem" }}>
          {submission.files.map((file) => (
            <li key={file.fileId}>{file.fileName} ({file.status})</li>
          ))}
        </ul>
      ) : null}

      {isApproved && profileId && (
        <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#f0fdf4", borderRadius: "0.5rem", border: "1px solid #bbf7d0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <p style={{ margin: "0 0 0.25rem 0", fontWeight: 500, color: "#166534" }}>
                승인 완료! 공개 프로필이 활성화되었습니다.
              </p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#15803d" }}>
                요청자들이 내 프로필을 검색하고 의뢰를 받을 수 있습니다.
              </p>
            </div>
            <Link
              to={`/suppliers/${profileId}`}
              style={{
                padding: "0.625rem 1.25rem",
                backgroundColor: "#16a34a",
                color: "white",
                textDecoration: "none",
                borderRadius: "0.5rem",
                fontWeight: 500,
                fontSize: "0.875rem",
                whiteSpace: "nowrap",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#15803d"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#16a34a"
              }}
            >
              내 공개 프로필 보기
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
