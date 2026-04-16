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

    // 페이지가 명시적으로 지정되지 않은 경우만 1페이지로 리셋
    if (!("page" in updates)) {
      newParams.page = "1"
    }
    setSearchParams(newParams)
  }

  return (
    <div className="supplier-search-layout">
      <div className="supplier-search-body">
        {/* LEFT: Filter sidebar */}
        <aside className="supplier-filter-panel">
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>필터</h2>

          <div className="input-field">
            <input
              className="input"
              value={keyword}
              onChange={(e) => updateSearchParams({ keyword: e.target.value })}
              placeholder="🔍 업체명 검색"
            />
          </div>

          <div className="input-field">
            <label>카테고리</label>
            <select
              className="select"
              value={category}
              onChange={(e) => updateSearchParams({ category: e.target.value })}
            >
              <option value="">전체</option>
              {categories?.map((item) => <option key={item.category} value={item.category}>{item.category}</option>)}
            </select>
          </div>

          <div className="input-field">
            <label>지역</label>
            <select
              className="select"
              value={region}
              onChange={(e) => updateSearchParams({ region: e.target.value })}
            >
              <option value="">전체</option>
              {regions?.map((item) => <option key={item.region} value={item.region}>{item.region}</option>)}
            </select>
          </div>

          <div className="input-field">
            <label>월 생산능력 (톤)</label>
            <input
              className="input"
              type="number"
              value={minCapacity}
              onChange={(e) => updateSearchParams({ minCapacity: e.target.value })}
              placeholder="최소값"
              min={0}
            />
          </div>

          <div className="input-field">
            <label>최소 주문량 (MOQ)</label>
            <input
              className="input"
              type="number"
              value={maxMoq}
              onChange={(e) => updateSearchParams({ maxMoq: e.target.value })}
              placeholder="최대값"
              min={0}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-8 block">제조 방식</label>
            <div className="flex gap-8">
              <button
                type="button"
                className={`chip ${oem ? "chip--active" : ""}`}
                onClick={() => updateSearchParams({ oem: oem ? undefined : "true" })}
              >
                OEM
              </button>
              <button
                type="button"
                className={`chip ${odm ? "chip--active" : ""}`}
                onClick={() => updateSearchParams({ odm: odm ? undefined : "true" })}
              >
                ODM
              </button>
            </div>
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={() => updateSearchParams({})}
          >
            필터 적용
          </button>
        </aside>

        {/* RIGHT: Results */}
        <div className="supplier-result-area">
          {data?.items.length ? (
            <>
            <div className="flex items-center gap-8">
              <h1 style={{ fontSize: 18, fontWeight: 700 }}>
                검색 결과
              </h1>
              <span className="text-muted" style={{ fontSize: 14 }}>· {data.meta.totalElements}개 업체</span>
            </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {data?.items.map((item) => (
              <Link to={`/suppliers/${item.profileId}`} className="supplier-card" key={item.profileId}>
                <div className="flex items-center gap-8">
                  <h2 className="font-bold text-base">{item.companyName}</h2>
                  <span className="badge badge-green">인증</span>
                </div>
                <p className="text-muted text-sm">
                  {item.region} · {item.categories.join(", ")}
                </p>
                <div className="flex gap-8 flex-wrap">
                  {item.oemAvailable && <span className="badge badge-blue">OEM</span>}
                  {item.odmAvailable && <span className="badge badge-blue">ODM</span>}
                </div>
                <p className="text-muted text-sm">
                  월 {item.monthlyCapacity} &nbsp;&nbsp; MOQ {item.moq}
                </p>
              </Link>
            ))}
          </div>

          {data.meta && data.meta.totalPages >= 1 && (
            <div className="pagination">
              <button
                disabled={!data.meta.hasPrev}
                onClick={() => updateSearchParams({ page: String(Math.max(1, page - 1)) })}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(data.meta.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={p === page ? "active" : ""}
                  onClick={() => updateSearchParams({ page: String(p) })}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={!data.meta.hasNext}
                onClick={() => updateSearchParams({ page: String(page + 1) })}
              >
                ›
              </button>
            </div>
          )}
          </>
          ) : (
            <div className="empty-state">
              <p>조건에 맞는 공급자가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

