import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useReviewEligibility } from "../hooks/useReviewEligibility"
import { ReviewWriteDialog } from "./ReviewWriteDialog"

interface ReviewActionButtonProps {
  requestId: string
  supplierId: string
  supplierCompanyName?: string
  className?: string
}

export function ReviewActionButton({ requestId, supplierId, supplierCompanyName, className }: ReviewActionButtonProps) {
  const { t } = useTranslation("reviews")
  const [open, setOpen] = useState(false)
  const eligibilityQuery = useReviewEligibility(requestId, supplierId)

  const eligibility = eligibilityQuery.data
  const isLoading = eligibilityQuery.isLoading
  const alreadyReviewed = eligibility?.reason === "already_reviewed"
  const canOpen = Boolean(eligibility?.eligible)

  const label = isLoading
    ? t("action.checking")
    : alreadyReviewed
      ? t("action.alreadyReviewed")
      : canOpen
        ? t("action.write")
        : t("action.ineligible")

  const disabled = isLoading || !canOpen

  return (
    <>
      <button
        type="button"
        className={className ?? "btn btn-sm btn-secondary"}
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={eligibility?.reason ? t(`reason.${eligibility.reason}`, { defaultValue: "" }) : undefined}
      >
        {label}
      </button>
      {open && canOpen && (
        <ReviewWriteDialog
          requestId={requestId}
          supplierId={supplierId}
          supplierCompanyName={supplierCompanyName}
          onClose={() => setOpen(false)}
          onSuccess={() => eligibilityQuery.refetch()}
        />
      )}
    </>
  )
}
