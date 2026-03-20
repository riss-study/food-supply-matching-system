import { useSearchParams, Link } from "react-router-dom"
import { useSupplierCategories, useSupplierRegions } from "../hooks/useDiscoveryLookups"
import { useSupplierList } from "../hooks/useSupplierList"

export function SupplierSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get("keyword") ?? ""
  const category = searchParams.get("category") ?? ""
  const region = searchParams.get("region") ?? ""
  const page = Number(searchParams.get("page") ?? "1")
  const { data } = useSupplierList({ keyword, category, region, page, size: 20 })
  const { data: categories } = useSupplierCategories()
  const { data: regions } = useSupplierRegions()

  return (
    <section>
      <h1>공급자 탐색</h1>
      <div style={{ display: "grid", gap: "0.75rem", maxWidth: "420px", marginBottom: "1rem" }}>
        <input value={keyword} onChange={(e) => setSearchParams({ keyword: e.target.value, category, region, page: "1" })} placeholder="회사명 키워드" />
        <select value={category} onChange={(e) => setSearchParams({ keyword, category: e.target.value, region, page: "1" })}>
          <option value="">전체 카테고리</option>
          {categories?.map((item) => <option key={item.category} value={item.category}>{item.category}</option>)}
        </select>
        <select value={region} onChange={(e) => setSearchParams({ keyword, category, region: e.target.value, page: "1" })}>
          <option value="">전체 지역</option>
          {regions?.map((item) => <option key={item.region} value={item.region}>{item.region}</option>)}
        </select>
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        {data?.items.map((item) => (
          <article key={item.profileId} style={{ border: "1px solid #d6d3d1", padding: "1rem", borderRadius: "0.75rem" }}>
            <h2>{item.companyName}</h2>
            <p>{item.region}</p>
            <p>{item.categories.join(", ")}</p>
            <p>월 생산량: {item.monthlyCapacity.toLocaleString()}</p>
            <p>MOQ: {item.moq.toLocaleString()}</p>
            <p>OEM: {item.oemAvailable ? "가능" : "불가"} / ODM: {item.odmAvailable ? "가능" : "불가"}</p>
            <Link to={`/suppliers/${item.profileId}`}>상세 보기</Link>
          </article>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button disabled={!data?.meta.hasPrev} onClick={() => setSearchParams({ keyword, category, region, page: String(Math.max(1, page - 1)) })}>이전</button>
        <span>페이지 {data?.meta.page ?? 1} / {data?.meta.totalPages ?? 1}</span>
        <button disabled={!data?.meta.hasNext} onClick={() => setSearchParams({ keyword, category, region, page: String(page + 1) })}>다음</button>
      </div>
    </section>
  )
}
