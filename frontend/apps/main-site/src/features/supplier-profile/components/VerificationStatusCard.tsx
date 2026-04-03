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

const stateBadgeClass: Record<SupplierVerificationState, string> = {
  draft: "badge badge-gray",
  submitted: "badge badge-amber",
  under_review: "badge badge-blue",
  hold: "badge badge-amber",
  approved: "badge badge-green",
  rejected: "badge badge-red",
  suspended: "badge badge-red",
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
      <div className="surface">
        <strong>검수 제출 전</strong>
        <p className="text-muted mt-8">사업자등록증과 필요한 파일을 업로드해 검수를 시작하세요.</p>
      </div>
    )
  }

  return (
    <div className="surface">
      <div className="flex items-center gap-12 mb-12">
        <strong>검수 상태</strong>
        <span className={stateBadgeClass[submission.state]}>{stateLabels[submission.state]}</span>
      </div>
      <p className="text-muted text-sm">제출일: {new Date(submission.submittedAt).toLocaleDateString("ko-KR")}</p>
      {submission.reviewNotePublic ? <p className="mt-8 text-sm">안내: {submission.reviewNotePublic}</p> : null}
      {submission.files.length > 0 ? (
        <ul className="file-list mt-12">
          {submission.files.map((file) => (
            <li key={file.fileId} className="file-list-item">{file.fileName} ({file.status})</li>
          ))}
        </ul>
      ) : null}

      {isApproved && profileId && (
        <div className="surface-highlight p-16 rounded mt-16">
          <div className="flex items-center gap-16 flex-wrap">
            <div className="flex-1">
              <p className="font-medium text-success">
                승인 완료! 공개 프로필이 활성화되었습니다.
              </p>
              <p className="text-sm text-muted mt-4">
                요청자들이 내 프로필을 검색하고 의뢰를 받을 수 있습니다.
              </p>
            </div>
            <Link to={`/suppliers/${profileId}`} className="btn btn-primary btn-sm">
              내 공개 프로필 보기
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
