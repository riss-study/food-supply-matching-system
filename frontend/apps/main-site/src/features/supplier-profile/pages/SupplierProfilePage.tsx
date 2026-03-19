import { useState } from "react"
import type { CreateSupplierProfileRequest } from "@fsm/types"
import { useCreateSupplierProfile } from "../hooks/useCreateSupplierProfile"
import { useLatestVerificationSubmission } from "../hooks/useLatestVerificationSubmission"
import { useSubmitVerification } from "../hooks/useSubmitVerification"
import { useSupplierProfile } from "../hooks/useSupplierProfile"
import { useUpdateSupplierProfile } from "../hooks/useUpdateSupplierProfile"
import { VerificationStatusCard } from "../components/VerificationStatusCard"

function SupplierProfileForm({
  initialData,
  onSubmit,
  isPending,
}: {
  initialData?: Partial<CreateSupplierProfileRequest>
  onSubmit: (request: CreateSupplierProfileRequest) => void
  isPending: boolean
}) {
  const [companyName, setCompanyName] = useState(initialData?.companyName ?? "")
  const [representativeName, setRepresentativeName] = useState(initialData?.representativeName ?? "")
  const [region, setRegion] = useState(initialData?.region ?? "")
  const [categories, setCategories] = useState((initialData?.categories ?? ["snack"]).join(","))
  const [equipmentSummary, setEquipmentSummary] = useState(initialData?.equipmentSummary ?? "")
  const [monthlyCapacity, setMonthlyCapacity] = useState(initialData?.monthlyCapacity?.toString() ?? "50000")
  const [moq, setMoq] = useState(initialData?.moq?.toString() ?? "1000")
  const [oemAvailable, setOemAvailable] = useState(initialData?.oemAvailable ?? true)
  const [odmAvailable, setOdmAvailable] = useState(initialData?.odmAvailable ?? false)
  const [rawMaterialSupport, setRawMaterialSupport] = useState(initialData?.rawMaterialSupport ?? true)
  const [packagingLabelingSupport, setPackagingLabelingSupport] = useState(initialData?.packagingLabelingSupport ?? true)
  const [introduction, setIntroduction] = useState(initialData?.introduction ?? "")

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      companyName,
      representativeName,
      region,
      categories: categories.split(",").map((item) => item.trim()).filter(Boolean),
      equipmentSummary: equipmentSummary || undefined,
      monthlyCapacity: Number(monthlyCapacity),
      moq: Number(moq),
      oemAvailable,
      odmAvailable,
      rawMaterialSupport,
      packagingLabelingSupport,
      introduction: introduction || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: "480px" }}>
      <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="회사명" required />
      <input value={representativeName} onChange={(e) => setRepresentativeName(e.target.value)} placeholder="대표자명" required />
      <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="지역" required />
      <input value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="카테고리 (comma-separated)" required />
      <textarea value={equipmentSummary} onChange={(e) => setEquipmentSummary(e.target.value)} placeholder="설비 요약" />
      <input type="number" value={monthlyCapacity} onChange={(e) => setMonthlyCapacity(e.target.value)} placeholder="월 생산량" required />
      <input type="number" value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="MOQ" required />
      <label><input type="checkbox" checked={oemAvailable} onChange={(e) => setOemAvailable(e.target.checked)} /> OEM 가능</label>
      <label><input type="checkbox" checked={odmAvailable} onChange={(e) => setOdmAvailable(e.target.checked)} /> ODM 가능</label>
      <label><input type="checkbox" checked={rawMaterialSupport} onChange={(e) => setRawMaterialSupport(e.target.checked)} /> 원재료 지원</label>
      <label><input type="checkbox" checked={packagingLabelingSupport} onChange={(e) => setPackagingLabelingSupport(e.target.checked)} /> 포장/라벨 지원</label>
      <textarea value={introduction} onChange={(e) => setIntroduction(e.target.value)} placeholder="소개" />
      <button type="submit" disabled={isPending}>{isPending ? "처리 중..." : "저장하기"}</button>
    </form>
  )
}

export function SupplierProfilePage() {
  const { data: profile, isLoading } = useSupplierProfile()
  const { data: latestSubmission } = useLatestVerificationSubmission()
  const createMutation = useCreateSupplierProfile()
  const updateMutation = useUpdateSupplierProfile()
  const submitMutation = useSubmitVerification()
  const [businessRegistrationDoc, setBusinessRegistrationDoc] = useState<File | null>(null)
  const [certificationFiles, setCertificationFiles] = useState<File[]>([])
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([])

  if (isLoading) {
    return <section><h1>공급자 프로필</h1><p>로딩 중...</p></section>
  }

  const canEdit = !profile || ["draft", "hold", "rejected"].includes(profile.verificationState)

  return (
    <section>
      <h1>공급자 프로필 및 검수 제출</h1>
      <p>공급자 프로필을 등록하고 검수 서류를 제출해 승인 상태를 관리합니다.</p>

      <div style={{ margin: "1rem 0" }}>
        <VerificationStatusCard submission={latestSubmission ?? null} />
      </div>

      {canEdit ? (
        <SupplierProfileForm
          initialData={
            profile
              ? {
                  companyName: profile.companyName,
                  representativeName: profile.representativeName,
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
          onSubmit={(request) => {
            if (profile) {
              updateMutation.mutate(request)
            } else {
              createMutation.mutate(request)
            }
          }}
        />
      ) : (
        <p>현재 검수 상태에서는 프로필을 수정할 수 없습니다.</p>
      )}

      <section style={{ marginTop: "1.5rem" }}>
        <h2>검수 서류 제출</h2>
        <div style={{ display: "grid", gap: "0.75rem", maxWidth: "480px" }}>
          <label>
            사업자등록증 (필수)
            <input type="file" accept=".pdf,image/png,image/jpeg" onChange={(e) => setBusinessRegistrationDoc(e.target.files?.[0] ?? null)} />
          </label>
          <label>
            인증서 파일들
            <input type="file" multiple accept=".pdf,image/png,image/jpeg" onChange={(e) => setCertificationFiles(Array.from(e.target.files ?? []))} />
          </label>
          <label>
            포트폴리오 이미지
            <input type="file" multiple accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => setPortfolioFiles(Array.from(e.target.files ?? []))} />
          </label>
          <button
            disabled={!profile || !businessRegistrationDoc || submitMutation.isPending}
            onClick={() => {
              if (!businessRegistrationDoc) return
              submitMutation.mutate({
                businessRegistrationDoc,
                certifications: certificationFiles,
                portfolioImages: portfolioFiles,
              })
            }}
          >
            {submitMutation.isPending ? "제출 중..." : "검수 제출하기"}
          </button>
          {submitMutation.isError ? <p style={{ color: "#ef4444" }}>검수 제출에 실패했습니다.</p> : null}
        </div>
      </section>
    </section>
  )
}
