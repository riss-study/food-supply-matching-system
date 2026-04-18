import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSubmitVerification } from "../hooks/useSubmitVerification"

interface Props {
  profileId: string | undefined
}

export function VerificationSubmissionSection({ profileId }: Props) {
  const { t } = useTranslation("supplier-profile")
  const submitMutation = useSubmitVerification()
  const [businessRegistrationDoc, setBusinessRegistrationDoc] = useState<File | null>(null)
  const [certificationFiles, setCertificationFiles] = useState<File[]>([])
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([])

  const handleSubmit = () => {
    if (!businessRegistrationDoc) return
    submitMutation.mutate({
      businessRegistrationDoc,
      certifications: certificationFiles,
      portfolioImages: portfolioFiles,
    })
  }

  return (
    <div className="surface">
      <h2 className="section-title mb-16">{t("submission.title")}</h2>
      <div className="form-stack">
        <div className="input-field">
          <label>{t("submission.registrationDocLabel")}</label>
          <input
            type="file"
            accept=".pdf,image/png,image/jpeg"
            onChange={(e) => setBusinessRegistrationDoc(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="input-field">
          <label>{t("submission.certificationsLabel")}</label>
          <input
            type="file"
            multiple
            accept=".pdf,image/png,image/jpeg"
            onChange={(e) => setCertificationFiles(Array.from(e.target.files ?? []))}
          />
        </div>
        <div className="input-field">
          <label>{t("submission.portfolioLabel")}</label>
          <input
            type="file"
            multiple
            accept=".png,.jpg,.jpeg,.pdf"
            onChange={(e) => setPortfolioFiles(Array.from(e.target.files ?? []))}
          />
        </div>
        <button
          className="btn btn-primary"
          disabled={!profileId || !businessRegistrationDoc || submitMutation.isPending}
          onClick={handleSubmit}
        >
          {submitMutation.isPending ? t("submission.submittingButton") : t("submission.submitButton")}
        </button>
        {submitMutation.isError ? <p className="text-danger text-sm">{t("submission.submitError")}</p> : null}
      </div>
    </div>
  )
}
