import { useSearchParams, Link } from "react-router-dom"
import { useSupplierCategories, useSupplierRegions } from "../hooks/useDiscoveryLookups"
import { useSupplierList } from "../hooks/useSupplierList"

export function SupplierSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get("keyword") ?? ""
  const category = searchParams.get("category") ?? ""
  const region = searchParams.get("region") ?? ""
  const oem = searchParams.get("oem") === "true"
  const odm = searchParams.get("odm") === "true"
  const minCapacity = searchParams.get("minCapacity") ?? ""
  const maxMoq = searchParams.get("maxMoq") ?? ""
  const page = Number(searchParams.get("page") ?? "1")

  const { data } = useSupplierList({
    keyword,
    category,
    region,
    oem: oem || undefined,
    odm: odm || undefined,
    minCapacity: minCapacity ? Number(minCapacity) : undefined,
    maxMoq: maxMoq ? Number(maxMoq) : undefined,
    page,
    size: 20,
  })
  const { data: categories } = useSupplierCategories()
  const { data: regions } = useSupplierRegions()

  const updateSearchParams = (updates: Record<string, string | undefined>) => {
    const newParams: Record<string, string> = {}
    if (keyword && !("keyword" in updates)) newParams.keyword = keyword
    if (category && !("category" in updates)) newParams.category = category
    if (region && !("region" in updates)) newParams.region = region
    if (oem && !("oem" in updates)) newParams.oem = "true"
    if (odm && !("odm" in updates)) newParams.odm = "true"
    if (minCapacity && !("minCapacity" in updates)) newParams.minCapacity = minCapacity
    if (maxMoq && !("maxMoq" in updates)) newParams.maxMoq = maxMoq

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        newParams[key] = value
      }
    })

    newParams.page = "1"
    setSearchParams(newParams)
  }

  const handleReset = () => {
    setSearchParams({ page: "1" })
  }

  const hasActiveFilters = keyword || category || region || oem || odm || minCapacity || maxMoq

  return (
    <section>
      <h1>공급자 탐색</h1>
      <div style={{ display: "grid", gap: "0.75rem", maxWidth: "420px", marginBottom: "1rem" }}>
        <input
          value={keyword}
          onChange={(e) => updateSearchParams({ keyword: e.target.value })}
          placeholder="회사명 키워드"
          style={{ padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
        />
        <select
          value={category}
          onChange={(e) => updateSearchParams({ category: e.target.value })}
          style={{ padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
        >
          <option value="">전체 카테고리</option>
          {categories?.map((item) => <option key={item.category} value={item.category}>{item.category}</option>)}
        </select>
        <select
          value={region}
          onChange={(e) => updateSearchParams({ region: e.target.value })}
          style={{ padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
        >
          <option value="">전체 지역</option>
          {regions?.map((item) => <option key={item.region} value={item.region}>{item.region}</option>)}
        </select>

        <div style={{ display: "flex", gap: "1rem", padding: "0.5rem 0" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={oem}
              onChange={(e) => updateSearchParams({ oem: e.target.checked ? "true" : undefined })}
            />
            <span>OEM 가능</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={odm}
              onChange={(e) => updateSearchParams({ odm: e.target.checked ? "true" : undefined })}
            />
            <span>ODM 가능</span>
          </label>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.875rem", color: "#4b5563", whiteSpace: "nowrap" }}>월 생산량:</span>
          <input
            type="number"
            value={minCapacity}
            onChange={(e) => updateSearchParams({ minCapacity: e.target.value })}
            placeholder="최소"
            min={0}
            style={{ flex: 1, padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
          />
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.875rem", color: "#4b5563", whiteSpace: "nowrap" }}>최대 MOQ:</span>
          <input
            type="number"
            value={maxMoq}
            onChange={(e) => updateSearchParams({ maxMoq: e.target.value })}
            placeholder="최대 MOQ"
            min={0}
            style={{ flex: 1, padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleReset}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "transparent",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <span>×</span>
            필터 초기화
          </button>
        )}
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        {data?.items.map((item) => (
          <article
            key={item.profileId}
            style={{
              border: "1px solid #d6d3d1",
              padding: "1rem",
              borderRadius: "0.75rem",
              backgroundColor: "white",
              display: "flex",
              gap: "1rem",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "0.5rem",
                backgroundColor: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {item.logoUrl ? (
                <img
                  src={item.logoUrl}
                  alt={`${item.companyName} 로고`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: "1.5rem", color: "#9ca3af" }}>🏭</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.125rem" }}>{item.companyName}</h2>
              <p style={{ margin: "0 0 0.5rem 0", color: "#6b7280", fontSize: "0.875rem" }}>
                {item.region} • {item.categories.join(", ")}
              </p>
              <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem", color: "#4b5563", flexWrap: "wrap" }}>
                <span>월 생산량: {item.monthlyCapacity.toLocaleString()}</span>
                <span>MOQ: {item.moq.toLocaleString()}</span>
                <span>OEM: {item.oemAvailable ? "가능" : "불가"} / ODM: {item.odmAvailable ? "가능" : "불가"}</span>
              </div>
              <Link
                to={`/suppliers/${item.profileId}`}
                style={{
                  display: "inline-block",
                  marginTop: "0.75rem",
                  padding: "0.375rem 0.75rem",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                }}
              >
                상세 보기
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", alignItems: "center" }}>
        <button
          disabled={!data?.meta.hasPrev}
          onClick={() => updateSearchParams({ page: String(Math.max(1, page - 1)) })}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: data?.meta.hasPrev ? "white" : "#f3f4f6",
            color: data?.meta.hasPrev ? "#374151" : "#9ca3af",
            border: "1px solid #d1d5db",
            borderRadius: "0.375rem",
            cursor: data?.meta.hasPrev ? "pointer" : "not-allowed",
          }}
        >
          이전
        </button>
        <span>페이지 {data?.meta.page ?? 1} / {data?.meta.totalPages ?? 1}</span>
        <button
          disabled={!data?.meta.hasNext}
          onClick={() => updateSearchParams({ page: String(page + 1) })}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: data?.meta.hasNext ? "white" : "#f3f4f6",
            color: data?.meta.hasNext ? "#374151" : "#9ca3af",
            border: "1px solid #d1d5db",
            borderRadius: "0.375rem",
            cursor: data?.meta.hasNext ? "pointer" : "not-allowed",
          }}
        >
          다음
        </button>
      </div>
    </section>
  )
}
