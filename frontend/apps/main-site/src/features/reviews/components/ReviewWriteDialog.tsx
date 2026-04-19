import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useCreateReview } from "../hooks/useCreateReview"
import { RatingStars } from "./RatingStars"

interface ReviewWriteDialogProps {
  requestId: string
  supplierId: string
  supplierCompanyName?: string
  onClose: () => void
  onSuccess?: () => void
}

const MAX_TEXT = 500

export function ReviewWriteDialog({ requestId, supplierId, supplierCompanyName, onClose, onSuccess }: ReviewWriteDialogProps) {
  const { t } = useTranslation("reviews")
  const [rating, setRating] = useState(0)
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const createMutation = useCreateReview()

  const submit = () => {
    if (rating < 1) {
      setError(t("write.errorRatingRequired"))
      return
    }
    setError(null)
    createMutation.mutate(
      { requestId, supplierId, rating, text: text.trim() || null },
      {
        onSuccess: () => {
          onSuccess?.()
          onClose()
        },
        onError: (err: unknown) => {
          const axiosErr = err as { response?: { data?: { code?: number; message?: string } } }
          const code = axiosErr.response?.data?.code
          if (code === 4222) setError(t("write.errorProfanity"))
          else if (code === 4094) setError(t("write.errorDuplicate"))
          else if (code === 4036) setError(t("write.errorNotEligible"))
          else setError(t("write.errorGeneric"))
        },
      },
    )
  }

  const isSubmitting = createMutation.isPending

  const footer: ReactNode = (
    <>
      <button type="button" className="btn btn-sm btn-primary" onClick={submit} disabled={isSubmitting || rating < 1}>
        {isSubmitting ? t("write.submitting") : t("write.submit")}
      </button>
      <button type="button" className="btn btn-sm btn-secondary" onClick={onClose} disabled={isSubmitting}>
        {t("common:cancel")}
      </button>
    </>
  )

  return (
    <div
      className="flex items-center justify-center p-24"
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.45)", zIndex: 1000 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("write.dialogTitle")}
        style={{
          width: "min(100%, 560px)",
          borderRadius: 16,
          border: "1px solid var(--line-strong)",
          backgroundColor: "var(--white)",
          boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
        }}
      >
        <div className="flex items-start justify-between gap-16" style={{ padding: "20px 20px 0" }}>
          <div>
            <h2 style={{ margin: 0 }}>{t("write.dialogTitle")}</h2>
            {supplierCompanyName && <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>{supplierCompanyName}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common:close")}
            style={{
              border: "1px solid var(--line-strong)",
              backgroundColor: "var(--paper)",
              borderRadius: "9999px",
              width: 32,
              height: 32,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <div className="mb-16">
            <label className="block mb-8 font-semibold">{t("write.ratingLabel")}</label>
            <RatingStars value={rating} onChange={setRating} size="lg" ariaLabel={t("write.ratingAria")} />
          </div>
          <div className="mb-8">
            <label className="block mb-8 font-semibold" htmlFor="review-text">{t("write.textLabel")}</label>
            <textarea
              id="review-text"
              className="textarea w-full"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
              placeholder={t("write.textPlaceholder")}
              maxLength={MAX_TEXT}
            />
            <div className="text-sm text-muted" style={{ textAlign: "right" }}>
              {text.length}/{MAX_TEXT}
            </div>
          </div>
          {error && <p className="text-danger text-sm" role="alert">{error}</p>}
        </div>
        <div className="flex gap-12 flex-wrap" style={{ padding: "0 20px 20px" }}>{footer}</div>
      </div>
    </div>
  )
}
