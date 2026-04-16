import { useRef, useState } from "react"
import type { CreateSupplierProfileRequest } from "@fsm/types"
import { useCreateSupplierProfile } from "../hooks/useCreateSupplierProfile"
import { useLatestVerificationSubmission } from "../hooks/useLatestVerificationSubmission"
import { useSubmitVerification } from "../hooks/useSubmitVerification"
import { useSupplierProfile } from "../hooks/useSupplierProfile"
import { useUpdateSupplierProfile } from "../hooks/useUpdateSupplierProfile"
import { useSupplierCategories, useSupplierRegions } from "../../discovery/hooks/useDiscoveryLookups"
import { VerificationStatusCard } from "../components/VerificationStatusCard"

interface PortfolioImage {
  url: string
  name: string
}

function SupplierProfileForm({
  initialData,
  onSubmit,
  isPending,
  contactOnly = false,
  existingPortfolioImages = [],
}: {
  initialData?: Partial<CreateSupplierProfileRequest>
  onSubmit: (request: CreateSupplierProfileRequest) => void
  isPending: boolean
  contactOnly?: boolean
  existingPortfolioImages?: PortfolioImage[]
}) {
  const { data: availableCategories = [], isLoading: categoriesLoading } = useSupplierCategories()
  const { data: availableRegions = [], isLoading: regionsLoading } = useSupplierRegions()

  const [companyName, setCompanyName] = useState(initialData?.companyName ?? "")
  const [representativeName, setRepresentativeName] = useState(initialData?.representativeName ?? "")
  const [contactPhone, setContactPhone] = useState(initialData?.contactPhone ?? "")
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail ?? "")
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

  // Portfolio image local state
  const [selectedPortfolioFiles, setSelectedPortfolioFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const portfolioInputRef = useRef<HTMLInputElement>(null)

  const handlePortfolioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setSelectedPortfolioFiles((prev) => [...prev, ...files])
    const newUrls = files.map((f) => URL.createObjectURL(f))
    setPreviewUrls((prev) => [...prev, ...newUrls])
    e.target.value = ""
  }

  const removeSelectedFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setSelectedPortfolioFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (contactOnly) {
      onSubmit({
        companyName: initialData?.companyName ?? "",
        representativeName: initialData?.representativeName ?? "",
        contactPhone: contactPhone || undefined,
        contactEmail: contactEmail || undefined,
        region: initialData?.region ?? "",
        categories: initialData?.categories ?? [],
        monthlyCapacity: initialData?.monthlyCapacity ?? 0,
        moq: initialData?.moq ?? 0,
        oemAvailable: initialData?.oemAvailable ?? false,
        odmAvailable: initialData?.odmAvailable ?? false,
        rawMaterialSupport: initialData?.rawMaterialSupport ?? false,
        packagingLabelingSupport: initialData?.packagingLabelingSupport ?? false,
        equipmentSummary: initialData?.equipmentSummary,
        introduction: initialData?.introduction,
      })
      return
    }

    onSubmit({
      companyName,
      representativeName,
      contactPhone: contactPhone || undefined,
      contactEmail: contactEmail || undefined,
      region,
      categories: selectedCategories,
      equipmentSummary: equipmentSummary || undefined,
      monthlyCapacity: monthlyCapacity.trim(),
      moq: moq.trim(),
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
    <form className="surface" onSubmit={handleSubmit}>
      <h2 className="section-title mb-16">기본 회사 정보</h2>
      <div className="form-stack">
        <div className="form-row">
          <div className="input-field">
            <label>회사명</label>
            <input className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="회사명 (2~100자)" required disabled={contactOnly} />
          </div>
          <div className="input-field">
            <label>대표자명</label>
            <input className="input" value={representativeName} onChange={(e) => setRepresentativeName(e.target.value)} placeholder="대표자명 (2~50자)" required disabled={contactOnly} />
          </div>
        </div>
        <div className="form-row">
          <div className="input-field">
            <label>연락처 전화번호</label>
            <input className="input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="연락처 전화번호" />
          </div>
          <div className="input-field">
            <label>연락처 이메일</label>
            <input className="input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="연락처 이메일" type="email" />
          </div>
        </div>

        <div className="input-field">
          <label>지역</label>
          <select className="select" value={region} onChange={(e) => setRegion(e.target.value)} required disabled={contactOnly}>
            <option value="">지역 선택</option>
            {availableRegions.map((r) => (
              <option key={r.region} value={r.region}>
                {r.region} ({r.supplierCount})
              </option>
            ))}
          </select>
        </div>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">카테고리 (복수 선택)</legend>
          <div className="chip-group">
            {availableCategories.map((c) => (
              <label
                key={c.category}
                className={`chip${selectedCategories.includes(c.category) ? " chip--active" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(c.category)}
                  onChange={() => toggleCategory(c.category)}
                  disabled={contactOnly}
                  className="sr-only"
                />
                <span>{c.category}</span>
                <span className="text-muted text-sm">({c.supplierCount})</span>
              </label>
            ))}
          </div>
          {selectedCategories.length === 0 && (
            <p className="text-danger text-sm mt-8">최소 하나의 카테고리를 선택해주세요.</p>
          )}
        </fieldset>
      </div>

      <h2 className="section-title mt-24">제조 역량</h2>
      <div className="form-stack">
        <div className="input-field">
          <label>설비 요약</label>
          <textarea className="textarea" value={equipmentSummary} onChange={(e) => setEquipmentSummary(e.target.value)} placeholder="보유 설비 요약 (최대 500자)" disabled={contactOnly} />
        </div>
        <div className="form-row">
          <div className="input-field">
            <label>월 생산량</label>
            <input className="input" type="text" value={monthlyCapacity} onChange={(e) => setMonthlyCapacity(e.target.value)} placeholder="예: 50,000개, 100톤" required disabled={contactOnly} />
          </div>
          <div className="input-field">
            <label>MOQ</label>
            <input className="input" type="text" value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="예: 1,000개, 500kg" required disabled={contactOnly} />
          </div>
        </div>

        <h2 className="section-title mt-16">인증서 관리</h2>
        <div className="check-group">
          <label className="checkbox"><input type="checkbox" checked={oemAvailable} onChange={(e) => setOemAvailable(e.target.checked)} disabled={contactOnly} /> OEM 가능</label>
          <label className="checkbox"><input type="checkbox" checked={odmAvailable} onChange={(e) => setOdmAvailable(e.target.checked)} disabled={contactOnly} /> ODM 가능</label>
          <label className="checkbox"><input type="checkbox" checked={rawMaterialSupport} onChange={(e) => setRawMaterialSupport(e.target.checked)} disabled={contactOnly} /> 원재료 지원</label>
          <label className="checkbox"><input type="checkbox" checked={packagingLabelingSupport} onChange={(e) => setPackagingLabelingSupport(e.target.checked)} disabled={contactOnly} /> 포장/라벨 지원</label>
        </div>
        <div className="input-field">
          <label>소개</label>
          <textarea className="textarea" value={introduction} onChange={(e) => setIntroduction(e.target.value)} placeholder="회사 소개 (최대 2,000자)" disabled={contactOnly} />
        </div>
        {/* 포트폴리오 이미지 */}
        <h2 className="section-title mt-16">포트폴리오 이미지</h2>
        <p className="text-muted text-sm">제품 사진, 공장 사진 등 포트폴리오 이미지를 등록하세요.</p>

        {(existingPortfolioImages.length > 0 || previewUrls.length > 0) && (
          <div className="portfolio-grid">
            {existingPortfolioImages.map((img) => (
              <div key={img.url} className="portfolio-thumb">
                <img src={img.url} alt={img.name} />
                <span className="portfolio-thumb-name">{img.name}</span>
              </div>
            ))}
            {previewUrls.map((url, idx) => (
              <div key={url} className="portfolio-thumb">
                <img src={url} alt={selectedPortfolioFiles[idx]?.name ?? "preview"} />
                <span className="portfolio-thumb-name">{selectedPortfolioFiles[idx]?.name}</span>
                <button type="button" className="portfolio-thumb-remove" onClick={() => removeSelectedFile(idx)} aria-label="삭제">&times;</button>
              </div>
            ))}
          </div>
        )}

        {existingPortfolioImages.length === 0 && previewUrls.length === 0 && (
          <p className="text-muted text-sm">등록된 포트폴리오 이미지가 없습니다.</p>
        )}

        <input
          ref={portfolioInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handlePortfolioSelect}
        />
        {/* TODO: API 연동 - 선택한 파일을 서버에 업로드하는 hook 연결 필요 */}
        <button type="button" className="btn btn-secondary" onClick={() => portfolioInputRef.current?.click()} disabled={contactOnly}>
          이미지 추가
        </button>

        <button className="btn btn-primary" type="submit" disabled={isPending || (!contactOnly && selectedCategories.length === 0)}>
          {isPending ? "처리 중..." : contactOnly ? "연락처 저장" : "저장하기"}
        </button>
      </div>
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
    return <div className="page"><div className="page-header"><h1>공급자 프로필</h1></div><p>로딩 중...</p></div>
  }

  const canEdit = !profile || ["draft", "hold", "rejected", "approved"].includes(profile.verificationState)
  const contactOnlyEdit = profile?.verificationState === "approved"

  return (
    <div className="page" style={{ alignItems: 'center' }}>
      <div className="content-narrow-lg" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

      <div className="surface">
        <h2 className="section-title mb-16">검수 서류 제출</h2>
        <div className="form-stack">
          <div className="input-field">
            <label>사업자등록증 (필수)</label>
            <input type="file" accept=".pdf,image/png,image/jpeg" onChange={(e) => setBusinessRegistrationDoc(e.target.files?.[0] ?? null)} />
          </div>
          <div className="input-field">
            <label>인증서 파일들</label>
            <input type="file" multiple accept=".pdf,image/png,image/jpeg" onChange={(e) => setCertificationFiles(Array.from(e.target.files ?? []))} />
          </div>
          <div className="input-field">
            <label>포트폴리오 이미지</label>
            <input type="file" multiple accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => setPortfolioFiles(Array.from(e.target.files ?? []))} />
          </div>
          <button
            className="btn btn-primary"
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
          {submitMutation.isError ? <p className="text-danger text-sm">검수 제출에 실패했습니다.</p> : null}
        </div>
      </div>
      </div>
    </div>
  )
}
