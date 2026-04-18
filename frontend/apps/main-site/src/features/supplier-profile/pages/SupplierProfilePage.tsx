import { useCreateSupplierProfile } from "../hooks/useCreateSupplierProfile"
import { useLatestVerificationSubmission } from "../hooks/useLatestVerificationSubmission"
import { useSupplierProfile } from "../hooks/useSupplierProfile"
import { useUpdateSupplierProfile } from "../hooks/useUpdateSupplierProfile"
import { VerificationStatusCard } from "../components/VerificationStatusCard"
import { SupplierProfileForm } from "../components/SupplierProfileForm"
import { VerificationSubmissionSection } from "../components/VerificationSubmissionSection"

export function SupplierProfilePage() {
  const { data: profile, isLoading } = useSupplierProfile()
  const { data: latestSubmission } = useLatestVerificationSubmission()
  const createMutation = useCreateSupplierProfile()
  const updateMutation = useUpdateSupplierProfile()

  if (isLoading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>공급자 프로필</h1>
        </div>
        <p>로딩 중...</p>
      </div>
    )
  }

  const canEdit =
    !profile || ["draft", "hold", "rejected", "approved"].includes(profile.verificationState)
  const contactOnlyEdit = profile?.verificationState === "approved"

  return (
    <div className="page" style={{ alignItems: "center" }}>
      <div className="content-narrow-lg" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div className="page-header">
          <div className="page-header-text">
            <h1>공급자 프로필 관리</h1>
            <p>회사 소개, 생산 역량, 공개 프로필 준비 상태, 검수 제출 흐름을 한 화면에서 관리합니다.</p>
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
          <p className="text-muted">현재 검수 상태에서는 프로필을 수정할 수 없습니다.</p>
        )}

        <VerificationSubmissionSection profileId={profile?.profileId} />
      </div>
    </div>
  )
}
