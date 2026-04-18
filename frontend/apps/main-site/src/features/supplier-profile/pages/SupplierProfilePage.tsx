import { useTranslation } from "react-i18next"
import { useCreateSupplierProfile } from "../hooks/useCreateSupplierProfile"
import { useLatestVerificationSubmission } from "../hooks/useLatestVerificationSubmission"
import { useSupplierProfile } from "../hooks/useSupplierProfile"
import { useUpdateSupplierProfile } from "../hooks/useUpdateSupplierProfile"
import { VerificationStatusCard } from "../components/VerificationStatusCard"
import { SupplierProfileForm } from "../components/SupplierProfileForm"
import { VerificationSubmissionSection } from "../components/VerificationSubmissionSection"

export function SupplierProfilePage() {
  const { t } = useTranslation("supplier-profile")
  const { data: profile, isLoading } = useSupplierProfile()
  const { data: latestSubmission } = useLatestVerificationSubmission()
  const createMutation = useCreateSupplierProfile()
  const updateMutation = useUpdateSupplierProfile()

  if (isLoading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>{t("page.title")}</h1>
        </div>
        <p>{t("page.loading")}</p>
      </div>
    )
  }

  const canEdit =
    !profile || ["draft", "hold", "rejected", "approved"].includes(profile.verificationState)
  const contactOnlyEdit = profile?.verificationState === "approved"

  return (
    <div className="page items-center">
      <div className="content-narrow-lg flex flex-col gap-24">
        <div className="page-header">
          <div className="page-header-text">
            <h1>{t("page.manageTitle")}</h1>
            <p>{t("page.manageDescription")}</p>
          </div>
        </div>

        <VerificationStatusCard
          submission={latestSubmission ?? null}
          profileId={profile?.profileId}
          verificationState={profile?.verificationState}
        />

        {canEdit ? (
          <SupplierProfileForm
            initialData={
              profile
                ? {
                    companyName: profile.companyName,
                    representativeName: profile.representativeName,
                    contactPhone: profile.contactPhone ?? undefined,
                    contactEmail: profile.contactEmail ?? undefined,
                    region: profile.region,
                    categories: profile.categories,
                    equipmentSummary: profile.equipmentSummary ?? undefined,
                    monthlyCapacity: profile.monthlyCapacity,
                    moq: profile.moq,
                    oemAvailable: profile.oemAvailable,
                    odmAvailable: profile.odmAvailable,
                    rawMaterialSupport: profile.rawMaterialSupport,
                    packagingLabelingSupport: profile.packagingLabelingSupport,
                    introduction: profile.introduction ?? undefined,
                  }
                : undefined
            }
            isPending={createMutation.isPending || updateMutation.isPending}
            contactOnly={contactOnlyEdit}
            existingPortfolioImages={(profile as any)?.portfolioImages ?? []}
            onSubmit={(request) => {
              if (profile) {
                updateMutation.mutate(
                  contactOnlyEdit
                    ? { contactPhone: request.contactPhone, contactEmail: request.contactEmail }
                    : request,
                )
              } else {
                createMutation.mutate(request)
              }
            }}
          />
        ) : (
          <p className="text-muted">{t("page.notEditable")}</p>
        )}

        <VerificationSubmissionSection profileId={profile?.profileId} />
      </div>
    </div>
  )
}
