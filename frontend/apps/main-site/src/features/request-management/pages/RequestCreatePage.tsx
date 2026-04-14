import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import type { CreateRequestRequest, RequestMode } from "@fsm/types"
import { useCreateRequest } from "../hooks/useCreateRequest"
import { useSupplierList } from "../../discovery/hooks/useSupplierList"

const categories = [
  { code: "snack", label: "스낵/간식" },
  { code: "beverage", label: "음료" },
  { code: "sauce", label: "소스/조미료" },
  { code: "bakery", label: "베이커리" },
  { code: "dairy", label: "유제품" },
  { code: "health", label: "건강식품" },
  { code: "frozen", label: "냉동식품" },
  { code: "other", label: "기타" },
]

const certifications = [
  { code: "HACCP", label: "HACCP" },
  { code: "ISO22000", label: "ISO 22000" },
  { code: "FSSC22000", label: "FSSC 22000" },
  { code: "ORGANIC", label: "유기농" },
  { code: "HALAL", label: "할랄" },
  { code: "KOSHER", label: "코셔" },
]

export function RequestCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createMutation = useCreateRequest()

  const targetSupplierIdFromUrl = searchParams.get("targetSupplierId")
  const targetSupplierNameFromUrl = searchParams.get("targetSupplierName")
  const hasPrefilledSupplier = Boolean(targetSupplierIdFromUrl && targetSupplierNameFromUrl)

  const [mode, setMode] = useState<RequestMode>(hasPrefilledSupplier ? "targeted" : "public")
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [desiredVolume, setDesiredVolume] = useState("")
  const [targetPriceMin, setTargetPriceMin] = useState("")
  const [targetPriceMax, setTargetPriceMax] = useState("")
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([])
  const [rawMaterialRule, setRawMaterialRule] = useState<"requester_provided" | "supplier_provided" | "">("")
  const [packagingRequirement, setPackagingRequirement] = useState<"private_label" | "bulk" | "none" | "">("")
  const [deliveryRequirement, setDeliveryRequirement] = useState("")
  const [notes, setNotes] = useState("")
  const [targetSupplierIds, setTargetSupplierIds] = useState<string[]>(
    targetSupplierIdFromUrl ? [targetSupplierIdFromUrl] : []
  )
  const [supplierSearchKeyword, setSupplierSearchKeyword] = useState("")
  const [prefilledSupplierCleared, setPrefilledSupplierCleared] = useState(false)

  const { data: suppliersData } = useSupplierList({
    keyword: supplierSearchKeyword,
    page: 1,
    size: 20,
  })


  const toggleTargetSupplier = (supplierId: string) => {
    setTargetSupplierIds((prev) =>
      prev.includes(supplierId) ? prev.filter((id) => id !== supplierId) : [...prev, supplierId],
    )
  }

  const isFormValid =
    title.length >= 5 &&
    title.length <= 200 &&
    category &&
    desiredVolume.trim().length > 0 &&
    (mode === "public" || targetSupplierIds.length > 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    const requestData: CreateRequestRequest = {
      mode,
      title,
      category,
      desiredVolume: desiredVolume.trim(),
      ...(targetPriceMin || targetPriceMax
        ? {
            targetPriceRange: {
              ...(targetPriceMin ? { min: Number(targetPriceMin) } : {}),
              ...(targetPriceMax ? { max: Number(targetPriceMax) } : {}),
            },
          }
        : {}),
      ...(selectedCertifications.length > 0 ? { certificationRequirement: selectedCertifications } : {}),
      ...(rawMaterialRule ? { rawMaterialRule } : {}),
      ...(packagingRequirement ? { packagingRequirement } : {}),
      ...(deliveryRequirement ? { deliveryRequirement } : {}),
      ...(notes ? { notes } : {}),
      ...(mode === "targeted" ? { targetSupplierIds } : {}),
    }

    createMutation.mutate(requestData, {
      onSuccess: () => {
        navigate("/requests")
      },
    })
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-text">
          <h1>새 의뢰 작성</h1>
          <p>제조 의뢰 정보를 입력하세요. 공급자가 견적을 보내드립니다.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-20">
        {/* 기본 정보 */}
        <section className="surface flex flex-col gap-16">
          <h2 className="section-title">기본 정보</h2>

          <div className="form-row">
            <div className="input-field">
              <label>의뢰 제목</label>
              <input
                className="input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="의뢰 제목을 입력하세요"
                minLength={5}
                maxLength={200}
                required
              />
            </div>
            <div className="input-field">
              <label>카테고리</label>
              <select
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">카테고리 선택</option>
                {categories.map((cat) => (
                  <option key={cat.code} value={cat.code}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="input-field">
              <label>의뢰 방식</label>
              <select
                className="select"
                value={mode}
                onChange={(e) => setMode(e.target.value as RequestMode)}
              >
                <option value="public">공개</option>
                <option value="targeted">지정</option>
              </select>
            </div>
            <div className="input-field">
              <label>희망 수량</label>
              <input
                className="input"
                type="text"
                value={desiredVolume}
                onChange={(e) => setDesiredVolume(e.target.value)}
                placeholder="예: 10,000개, 50톤, 1,000박스"
                required
              />
            </div>
          </div>
        </section>

        {/* 제조 조건 */}
        <section className="surface flex flex-col gap-16">
          <h2 className="section-title">제조 조건</h2>

          <div className="form-row">
            <div className="input-field">
              <label>목표 단가 범위</label>
              <input
                className="input"
                type="text"
                value={targetPriceMin && targetPriceMax ? `${targetPriceMin} ~ ${targetPriceMax}` : targetPriceMin || targetPriceMax || ""}
                onChange={(e) => {
                  const parts = e.target.value.split("~").map((s) => s.trim())
                  setTargetPriceMin(parts[0] || "")
                  setTargetPriceMax(parts[1] || "")
                }}
                placeholder="예: 5,000 ~ 8,000원/kg"
              />
            </div>
            <div className="input-field">
              <label>인증 요구사항</label>
              <select
                className="select"
                value={selectedCertifications[0] ?? ""}
                onChange={(e) => setSelectedCertifications(e.target.value ? [e.target.value] : [])}
              >
                <option value="">HACCP, ISO 등</option>
                {certifications.map((cert) => (
                  <option key={cert.code} value={cert.code}>{cert.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="input-field">
              <label>원료 규정</label>
              <select
                className="select"
                value={rawMaterialRule}
                onChange={(e) => setRawMaterialRule(e.target.value as typeof rawMaterialRule)}
              >
                <option value="">선택하세요</option>
                <option value="requester_provided">의뢰자 제공</option>
                <option value="supplier_provided">공급자 제공</option>
              </select>
            </div>
            <div className="input-field">
              <label>포장 요구사항</label>
              <select
                className="select"
                value={packagingRequirement}
                onChange={(e) => setPackagingRequirement(e.target.value as typeof packagingRequirement)}
              >
                <option value="">선택하세요</option>
                <option value="private_label">프라이빗 라벨</option>
                <option value="bulk">벌크</option>
                <option value="none">없음</option>
              </select>
            </div>
          </div>

          <div className="input-field">
            <label>납품 요구사항</label>
            <input
              className="input"
              type="text"
              value={deliveryRequirement}
              onChange={(e) => setDeliveryRequirement(e.target.value)}
              placeholder="희망 납품일, 조건 등"
            />
          </div>

          <div className="input-field">
            <label>추가 요청사항</label>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="공급자에게 전달할 추가 메모나 요청사항을 작성하세요."
              maxLength={2000}
              rows={4}
            />
          </div>
        </section>

        {/* Targeted supplier selection */}
        {mode === "targeted" && (
          <section className="surface flex flex-col gap-12">
            <h2 className="section-title">
              지정 공급자 선택 <span className="text-danger">*</span>
              <span className="text-muted font-medium text-sm"> ({targetSupplierIds.length}개 선택됨)</span>
            </h2>

            {hasPrefilledSupplier && targetSupplierIdFromUrl && targetSupplierIds.includes(targetSupplierIdFromUrl) && !prefilledSupplierCleared && (
              <div className="flex items-center justify-between gap-8 p-12 bg-accent-soft rounded">
                <div className="flex items-center gap-8">
                  <span className="text-success">✓</span>
                  <span className="font-semibold">{targetSupplierNameFromUrl}</span>
                  <span className="text-sm text-muted">(선택됨)</span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setPrefilledSupplierCleared(true)
                    toggleTargetSupplier(targetSupplierIdFromUrl)
                  }}
                >
                  제거
                </button>
              </div>
            )}

            <div className="input-field">
              <input
                className="input"
                type="text"
                value={supplierSearchKeyword}
                onChange={(e) => setSupplierSearchKeyword(e.target.value)}
                placeholder="공급자 검색..."
              />
            </div>

            <div className="flex flex-col gap-8 overflow-auto">
              {suppliersData?.items.length === 0 ? (
                <p className="text-muted text-sm">검색 결과가 없습니다.</p>
              ) : (
                suppliersData?.items.map((supplier) => (
                  <label
                    key={supplier.profileId}
                    className={`flex items-center gap-12 p-12 rounded border cursor-pointer ${
                      targetSupplierIds.includes(supplier.profileId) ? "bg-accent-soft" : "bg-paper"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={targetSupplierIds.includes(supplier.profileId)}
                      onChange={() => toggleTargetSupplier(supplier.profileId)}
                    />
                    <div>
                      <div className="font-medium">{supplier.companyName}</div>
                      <div className="text-sm text-muted">{supplier.region} · {supplier.categories.join(", ")}</div>
                    </div>
                  </label>
                ))
              )}
            </div>

            {targetSupplierIds.length === 0 && (
              <p className="text-danger text-sm">지정 모드에서는 최소 1개 이상의 공급자를 선택해야 합니다.</p>
            )}
          </section>
        )}

        {createMutation.isError && (
          <div className="surface">
            <p className="text-danger">의뢰 등록에 실패했습니다. 다시 시도해주세요.</p>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex gap-12">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/requests")}
          >
            취소
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isFormValid || createMutation.isPending}
          >
            {createMutation.isPending ? "등록 중..." : "의뢰 등록"}
          </button>
          {!isFormValid && (
            <p className="text-danger text-sm">
              {title.length < 5 ? "제목을 5자 이상 입력하세요. " : ""}
              {!category ? "카테고리를 선택하세요. " : ""}
              {desiredVolume.trim().length === 0 ? "희망 수량을 입력하세요. " : ""}
              {mode === "targeted" && targetSupplierIds.length === 0 ? "지정 공급자를 선택하세요." : ""}
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
