import { useState } from "react"
import type { CreateSupplierProfileRequest } from "@fsm/types"
import { useCreateSupplierProfile } from "../hooks/useCreateSupplierProfile"
import { useLatestVerificationSubmission } from "../hooks/useLatestVerificationSubmission"
import { useSubmitVerification } from "../hooks/useSubmitVerification"
import { useSupplierProfile } from "../hooks/useSupplierProfile"
import { useUpdateSupplierProfile } from "../hooks/useUpdateSupplierProfile"
import { useSupplierCategories, useSupplierRegions } from "../../discovery/hooks/useDiscoveryLookups"
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
  const { data: availableCategories = [], isLoading: categoriesLoading } = useSupplierCategories()
  const { data: availableRegions = [], isLoading: regionsLoading } = useSupplierRegions()

  const [companyName, setCompanyName] = useState(initialData?.companyName ?? "")
  const [representativeName, setRepresentativeName] = useState(initialData?.representativeName ?? "")
  const [region, setRegion] = useState(initialData?.region ?? "")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.categories ?? ["snack"])
  const [equipmentSummary, setEquipmentSummary] = useState(initialData?.equipmentSummary ?? "")
  const [monthlyCapacity, setMonthlyCapacity] = useState(initialData?.monthlyCapacity?.toString() ?? "50000")
  const [moq, setMoq] = useState(initialData?.moq?.toString() ?? "1000")
  const [oemAvailable, setOemAvailable] = useState(initialData?.oemAvailable ?? true)
  const [odmAvailable, setOdmAvailable] = useState(initialData?.odmAvailable ?? false)
  const [rawMaterialSupport, setRawMaterialSupport] = useState(initialData?.rawMaterialSupport ?? true)
  const [packagingLabelingSupport, setPackagingLabelingSupport] = useState(initialData?.packagingLabelingSupport ?? true)
  const [introduction, setIntroduction] = useState(initialData?.introduction ?? "")

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      companyName,
      representativeName,
      region,
      categories: selectedCategories,
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

  if (categoriesLoading || regionsLoading) {
    return <p>옵션 로딩 중...</p>
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: "480px" }}>
      <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="회사명" required />
      <input value={representativeName} onChange={(e) => setRepresentativeName(e.target.value)} placeholder="대표자명" required />

      <label>
        지역
        <select value={region} onChange={(e) => setRegion(e.target.value)} required style={{ display: "block", marginTop: "0.25rem", padding: "0.5rem", width: "100%" }}>
          <option value="">지역 선택</option>
          {availableRegions.map((r) => (
            <option key={r.region} value={r.region}>
              {r.region} ({r.supplierCount})
            </option>
          ))}
        </select>
      </label>

      <fieldset style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "0.75rem", margin: 0 }}>
        <legend style={{ fontSize: "0.875rem", color: "#6b7280", padding: "0 0.25rem" }}>카테고리 (복수 선택)</legend>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {availableCategories.map((c) => (
            <label
              key={c.category}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.375rem 0.75rem",
                borderRadius: "9999px",
                border: "1px solid",
                borderColor: selectedCategories.includes(c.category) ? "#3b82f6" : "#e5e7eb",
                backgroundColor: selectedCategories.includes(c.category) ? "#eff6ff" : "white",
                cursor: "pointer",
                fontSize: "0.875rem",
                transition: "all 0.15s ease",
              }}
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(c.category)}
                onChange={() => toggleCategory(c.category)}
                style={{ margin: 0 }}
              />
              <span>{c.category}</span>
              <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>({c.supplierCount})</span>
            </label>
          ))}
        </div>
        {selectedCategories.length === 0 && (
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "#ef4444" }}>최소 하나의 카테고리를 선택해주세요.</p>
        )}
      </fieldset>

      <textarea value={equipmentSummary} onChange={(e) => setEquipmentSummary(e.target.value)} placeholder="설비 요약" />
      <input type="number" value={monthlyCapacity} onChange={(e) => setMonthlyCapacity(e.target.value)} placeholder="월 생산량" required />
      <input type="number" value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="MOQ" required />
      <label><input type="checkbox" checked={oemAvailable} onChange={(e) => setOemAvailable(e.target.checked)} /> OEM 가능</label>
      <label><input type="checkbox" checked={odmAvailable} onChange={(e) => setOdmAvailable(e.target.checked)} /> ODM 가능</label>
      <label><input type="checkbox" checked={rawMaterialSupport} onChange={(e) => setRawMaterialSupport(e.target.checked)} /> 원재료 지원</label>
      <label><input type="checkbox" checked={packagingLabelingSupport} onChange={(e) => setPackagingLabelingSupport(e.target.checked)} /> 포장/라벨 지원</label>
      <textarea value={introduction} onChange={(e) => setIntroduction(e.target.value)} placeholder="소개" />
      <button type="submit" disabled={isPending || selectedCategories.length === 0}>{isPending ? "처리 중..." : "저장하기"}</button>
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
        <VerificationStatusCard
          submission={latestSubmission ?? null}
          profileId={profile?.profileId}
          verificationState={profile?.verificationState}
        />
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
