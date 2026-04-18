import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { LatestVerificationSubmissionResponse, SupplierVerificationState } from "@fsm/types"

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
  const { t } = useTranslation("supplier-profile")
  const isApproved = verificationState === "approved"

  if (!submission) {
    return (
      <div className="surface">
        <strong>{t("statusCard.preSubmissionTitle")}</strong>
        <p className="text-muted mt-8">{t("statusCard.preSubmissionDesc")}</p>
      </div>
    )
  }

  return (
    <div className="surface">
      <div className="flex items-center gap-12 mb-12">
        <strong>{t("statusCard.statusTitle")}</strong>
        <span className={stateBadgeClass[submission.state]}>{t(`verificationState.${submission.state}`)}</span>
      </div>
      <p className="text-muted text-sm">{t("statusCard.submittedAtLabel", { date: new Date(submission.submittedAt).toLocaleDateString("ko-KR") })}</p>
      {submission.reviewNotePublic ? <p className="mt-8 text-sm">{t("statusCard.reviewNoteLabel", { note: submission.reviewNotePublic })}</p> : null}
      {submission.files.length > 0 ? (
        <ul className="file-list mt-12">
          {submission.files.map((file) => (
            <li key={file.fileId} className="file-list-item">{t("statusCard.fileLineItem", { fileName: file.fileName, status: file.status })}</li>
          ))}
        </ul>
      ) : null}

      {isApproved && profileId && (
        <div className="surface-highlight p-16 rounded mt-16">
          <div className="flex items-center gap-16 flex-wrap">
            <div className="flex-1">
              <p className="font-medium text-success">
                {t("statusCard.approvedMessage")}
              </p>
              <p className="text-sm text-muted mt-4">
                {t("statusCard.approvedDescription")}
              </p>
            </div>
            <Link to={`/suppliers/${profileId}`} className="btn btn-primary btn-sm">
              {t("statusCard.viewPublicProfile")}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
