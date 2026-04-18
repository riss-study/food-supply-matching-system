import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { BusinessApprovalState } from "@fsm/types"
import { useBusinessProfile } from "../hooks/useBusinessProfile"
import { useSubmitBusinessProfile } from "../hooks/useSubmitBusinessProfile"
import { useUpdateBusinessProfile } from "../hooks/useUpdateBusinessProfile"

const statusBadgeClass: Record<BusinessApprovalState, string> = {
  not_submitted: "badge badge-gray",
  submitted: "badge badge-amber",
  approved: "badge badge-green",
  rejected: "badge badge-red",
}

function StatusBadge({ state }: { state: BusinessApprovalState }) {
  const { t } = useTranslation("business-profile")
  return (
    <span className={statusBadgeClass[state]}>
      {t(`statusLabels.${state}`)}
    </span>
  )
}

function BusinessProfileForm({
  initialData,
  onSubmit,
  isPending,
  submitLabel,
}: {
  initialData?: {
    businessName: string
    businessRegistrationNumber: string
    contactName: string
    contactPhone: string
    contactEmail: string
  }
  onSubmit: (data: {
    businessName: string
    businessRegistrationNumber: string
    contactName: string
    contactPhone: string
    contactEmail: string
    verificationScope: string
  }) => void
  isPending: boolean
  submitLabel: string
}) {
  const { t } = useTranslation("business-profile")
  const [businessName, setBusinessName] = useState(initialData?.businessName ?? "")
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState(
    initialData?.businessRegistrationNumber ?? "",
  )
  const [contactName, setContactName] = useState(initialData?.contactName ?? "")
  const [contactPhone, setContactPhone] = useState(initialData?.contactPhone ?? "")
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail ?? "")

  const isValidRegistrationNumber = (number: string) => {
    const regex = /^\d{3}-\d{2}-\d{5}$|^\d{10}$/
    return regex.test(number)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      businessName,
      businessRegistrationNumber,
      contactName,
      contactPhone,
      contactEmail,
      verificationScope: "domestic",
    })
  }

  const formatRegistrationNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 10)
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5)}`
  }

  const isFormValid =
    businessName.length >= 2 &&
    businessName.length <= 100 &&
    isValidRegistrationNumber(businessRegistrationNumber) &&
    contactName.length > 0 &&
    contactPhone.length > 0 &&
    contactEmail.length > 0

  return (
    <form className="surface" onSubmit={handleSubmit}>
      <div className="form-stack">
        <div className="input-field">
          <label>{t("form.businessNameLabel")}</label>
          <input
            className="input"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder={t("form.businessNamePlaceholder")}
            minLength={2}
            maxLength={100}
            required
          />
        </div>

        <div className="input-field">
          <label>{t("form.registrationNumberLabel")}</label>
          <input
            className="input"
            value={businessRegistrationNumber}
            onChange={(e) => setBusinessRegistrationNumber(formatRegistrationNumber(e.target.value))}
            placeholder={t("form.registrationNumberPlaceholder")}
            required
          />
          {!isValidRegistrationNumber(businessRegistrationNumber) && businessRegistrationNumber && (
            <span className="text-danger text-sm">{t("form.registrationNumberInvalid")}</span>
          )}
        </div>

        <div className="input-field">
          <label>{t("form.contactNameLabel")}</label>
          <input className="input" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
        </div>

        <div className="input-field">
          <label>{t("form.contactPhoneLabel")}</label>
          <input className="input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
        </div>

        <div className="input-field">
          <label>{t("form.contactEmailLabel")}</label>
          <input className="input" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
        </div>

        <button className="btn btn-primary" type="submit" disabled={!isFormValid || isPending}>
          {isPending ? t("common:processing") : submitLabel}
        </button>
      </div>
    </form>
  )
}

export function BusinessProfilePage() {
  const { t } = useTranslation("business-profile")
  const { data: profile, isLoading } = useBusinessProfile()
  const submitMutation = useSubmitBusinessProfile()
  const updateMutation = useUpdateBusinessProfile()
  const [isEditing, setIsEditing] = useState(false)

  if (isLoading) {
    return (
      <div className="page">
        <div className="page-header"><h1>{t("page.title")}</h1></div>
        <p>{t("common:loading")}</p>
      </div>
    )
  }

  if (!profile || profile.approvalState === "not_submitted") {
    return (
      <div className="page items-center">
        <div className="content-narrow">
        <div className="page-header">
          <div className="page-header-text">
            <h1>{t("page.registerTitle")}</h1>
            <p>{t("page.registerDesc")}</p>
          </div>
        </div>
        <BusinessProfileForm
          onSubmit={(data) => submitMutation.mutate(data)}
          isPending={submitMutation.isPending}
          submitLabel={t("page.submitButton")}
        />
        {submitMutation.isError && <p className="text-danger">{t("page.submitError")}</p>}
        </div>
      </div>
    )
  }

  const canEdit = profile.approvalState === "submitted" || profile.approvalState === "rejected"

  return (
    <div className="page items-center">
      <div className="content-narrow flex flex-col gap-24">
      <div className="page-header">
        <div className="page-header-text">
          <h1>{t("page.manageTitle")}</h1>
        </div>
      </div>

      <div className="surface">
        <div className="flex items-center gap-12 mb-16">
          <span className="text-muted">{t("page.approvalState")}</span>
          <StatusBadge state={profile.approvalState} />
        </div>

        {profile.approvalState === "submitted" && (
          <div className="surface-highlight p-16 rounded mb-16">
            <p>{t("page.submittedMessage")}</p>
          </div>
        )}

        {profile.approvalState === "approved" && (
          <div className="surface-highlight p-16 rounded mb-16">
            <p>{t("page.approvedMessage")}</p>
            <Link to="/requests/new" className="btn btn-primary btn-sm mt-8">
              {t("page.approvedCta")}
            </Link>
          </div>
        )}

        {profile.approvalState === "rejected" && (
          <div className="surface surface-highlight p-16 rounded mb-16">
            <p className="text-danger">{t("page.rejectedMessage")}</p>
            {profile.rejectionReason && (
              <p className="font-medium mt-4">{t("page.rejectionReasonPrefix", { reason: profile.rejectionReason })}</p>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="surface">
          <h2 className="section-title mb-16">{t("page.editTitle")}</h2>
          <BusinessProfileForm
            initialData={{
              businessName: profile.businessName,
              businessRegistrationNumber: profile.businessRegistrationNumber,
              contactName: profile.contactName,
              contactPhone: profile.contactPhone,
              contactEmail: profile.contactEmail,
            }}
            onSubmit={(data) => {
              updateMutation.mutate(data, {
                onSuccess: () => setIsEditing(false),
              })
            }}
            isPending={updateMutation.isPending}
            submitLabel={t("page.editSubmitButton")}
          />
          <button className="btn btn-ghost mt-8" onClick={() => setIsEditing(false)}>
            {t("common:cancel")}
          </button>
          {updateMutation.isError && <p className="text-danger mt-12">{t("page.updateError")}</p>}
        </div>
      ) : (
        <div className="surface">
          <h2 className="section-title mb-16">{t("page.editedInfoTitle")}</h2>
          <dl className="detail-grid">
            <dt>{t("page.dt.businessName")}</dt>
            <dd>{profile.businessName}</dd>
            <dt>{t("page.dt.registrationNumber")}</dt>
            <dd>{profile.businessRegistrationNumber}</dd>
            <dt>{t("page.dt.contactName")}</dt>
            <dd>{profile.contactName}</dd>
            <dt>{t("page.dt.contactPhone")}</dt>
            <dd>{profile.contactPhone}</dd>
            <dt>{t("page.dt.contactEmail")}</dt>
            <dd>{profile.contactEmail}</dd>
            <dt>{t("page.dt.submittedAt")}</dt>
            <dd>{profile.submittedAt ? new Date(profile.submittedAt).toLocaleDateString("ko-KR") : "-"}</dd>
            {profile.approvedAt && (
              <>
                <dt>{t("page.dt.approvedAt")}</dt>
                <dd>{new Date(profile.approvedAt).toLocaleDateString("ko-KR")}</dd>
              </>
            )}
          </dl>
          {canEdit && (
            <button className="btn btn-secondary mt-16" onClick={() => setIsEditing(true)}>
              {t("page.editButton")}
            </button>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
