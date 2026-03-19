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

export function VerificationStatusCard({ submission }: { submission: LatestVerificationSubmissionResponse | null }) {
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
    </div>
  )
}
