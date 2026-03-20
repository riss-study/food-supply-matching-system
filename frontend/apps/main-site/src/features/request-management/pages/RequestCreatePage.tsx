import { useState } from "react"
import { useNavigate } from "react-router-dom"
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
  const createMutation = useCreateRequest()

  const [mode, setMode] = useState<RequestMode>("public")
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
  const [targetSupplierIds, setTargetSupplierIds] = useState<string[]>([])
  const [supplierSearchKeyword, setSupplierSearchKeyword] = useState("")

  const { data: suppliersData } = useSupplierList({
    keyword: supplierSearchKeyword,
    page: 1,
    size: 20,
  })

  const toggleCertification = (code: string) => {
    setSelectedCertifications((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    )
  }

  const toggleTargetSupplier = (supplierId: string) => {
    setTargetSupplierIds((prev) =>
      prev.includes(supplierId) ? prev.filter((id) => id !== supplierId) : [...prev, supplierId],
    )
  }

  const isFormValid =
    title.length >= 5 &&
    title.length <= 200 &&
    category &&
    Number(desiredVolume) > 0 &&
    (mode === "public" || targetSupplierIds.length > 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    const requestData: CreateRequestRequest = {
      mode,
      title,
      category,
      desiredVolume: Number(desiredVolume),
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
    <section>
      <h1 style={{ marginBottom: "1.5rem" }}>새 의뢰 등록</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: "600px" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>의뢰 모드</label>
          <div style={{ display: "flex", gap: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="radio"
                name="mode"
                value="public"
                checked={mode === "public"}
                onChange={() => setMode("public")}
              />
              <span>공개 모드 (모든 공급자에게 노출)</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="radio"
                name="mode"
                value="targeted"
                checked={mode === "targeted"}
                onChange={() => setMode("targeted")}
              />
              <span>지정 모드 (선택한 공급자에게만 노출)</span>
            </label>
          </div>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
            의뢰 제목 <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="5-200자로 입력해주세요"
            minLength={5}
            maxLength={200}
            required
            style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
            카테고리 <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
          >
            <option value="">카테고리 선택</option>
            {categories.map((cat) => (
              <option key={cat.code} value={cat.code}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
            희망 수량 <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="number"
            value={desiredVolume}
            onChange={(e) => setDesiredVolume(e.target.value)}
            placeholder="희망 생산 수량을 입력해주세요"
            min={1}
            required
            style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>희망 단가 범위</label>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <input
              type="number"
              value={targetPriceMin}
              onChange={(e) => setTargetPriceMin(e.target.value)}
              placeholder="최소 단가"
              min={1}
              style={{ flex: 1, padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
            />
            <span>~</span>
            <input
              type="number"
              value={targetPriceMax}
              onChange={(e) => setTargetPriceMax(e.target.value)}
              placeholder="최대 단가"
              min={1}
              style={{ flex: 1, padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
            />
          </div>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>필요 인증</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {certifications.map((cert) => (
              <label
                key={cert.code}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "0.375rem 0.75rem",
                  borderRadius: "9999px",
                  backgroundColor: selectedCertifications.includes(cert.code) ? "#dbeafe" : "#f3f4f6",
                  color: selectedCertifications.includes(cert.code) ? "#1e40af" : "#4b5563",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedCertifications.includes(cert.code)}
                  onChange={() => toggleCertification(cert.code)}
                  style={{ display: "none" }}
                />
                {cert.label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>원재료 규칙</label>
          <select
            value={rawMaterialRule}
            onChange={(e) => setRawMaterialRule(e.target.value as typeof rawMaterialRule)}
            style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
          >
            <option value="">선택해주세요</option>
            <option value="requester_provided">의뢰자 제공</option>
            <option value="supplier_provided">공급자 제공</option>
          </select>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>포장/라벨링 요구사항</label>
          <select
            value={packagingRequirement}
            onChange={(e) => setPackagingRequirement(e.target.value as typeof packagingRequirement)}
            style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
          >
            <option value="">선택해주세요</option>
            <option value="private_label">프라이빗 라벨</option>
            <option value="bulk">벌크</option>
            <option value="none">없음</option>
          </select>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>납기 요구사항</label>
          <input
            type="date"
            value={deliveryRequirement}
            onChange={(e) => setDeliveryRequirement(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>추가 요구사항</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="추가 요구사항이 있으면 입력해주세요 (최대 2000자)"
            maxLength={2000}
            rows={4}
            style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", resize: "vertical" }}
          />
        </div>

        {mode === "targeted" && (
          <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "0.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 500 }}>
              지정 공급자 선택 <span style={{ color: "#ef4444" }}>*</span>
              <span style={{ fontWeight: "normal", color: "#6b7280", marginLeft: "0.5rem" }}>
                ({targetSupplierIds.length}개 선택됨)
              </span>
            </label>

            <input
              type="text"
              value={supplierSearchKeyword}
              onChange={(e) => setSupplierSearchKeyword(e.target.value)}
              placeholder="공급자 검색..."
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "0.375rem",
                border: "1px solid #d1d5db",
                marginBottom: "0.75rem",
              }}
            />

            <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {suppliersData?.items.length === 0 ? (
                <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>검색 결과가 없습니다.</p>
              ) : (
                suppliersData?.items.map((supplier) => (
                  <label
                    key={supplier.profileId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem",
                      borderRadius: "0.375rem",
                      backgroundColor: targetSupplierIds.includes(supplier.profileId) ? "#dbeafe" : "white",
                      border: `1px solid ${targetSupplierIds.includes(supplier.profileId) ? "#3b82f6" : "#e5e7eb"}`,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={targetSupplierIds.includes(supplier.profileId)}
                      onChange={() => toggleTargetSupplier(supplier.profileId)}
                    />
                    <div>
                      <div style={{ fontWeight: 500 }}>{supplier.companyName}</div>
                      <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                        {supplier.region} • {supplier.categories.join(", ")}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>

            {targetSupplierIds.length === 0 && (
              <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                지정 모드에서는 최소 1개 이상의 공급자를 선택해야 합니다.
              </p>
            )}
          </div>
        )}

        {createMutation.isError && (
          <div style={{ color: "#ef4444", marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#fee2e2", borderRadius: "0.375rem" }}>
            의뢰 등록에 실패했습니다. 다시 시도해주세요.
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
          <button
            type="submit"
            disabled={!isFormValid || createMutation.isPending}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: isFormValid ? "#3b82f6" : "#9ca3af",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: isFormValid ? "pointer" : "not-allowed",
              fontSize: "1rem",
            }}
          >
            {createMutation.isPending ? "등록 중..." : "의뢰 등록"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/requests")}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "transparent",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            취소
          </button>
        </div>
      </form>
    </section>
  )
}
