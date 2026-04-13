import { Link, useSearchParams } from "react-router-dom"
import { useSupplierRequestFeed } from "../hooks/useSupplierRequestFeed"
import { useSupplierCategories } from "../../discovery/hooks/useDiscoveryLookups"

export function SupplierRequestFeedPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get("category") ?? ""
  const page = Number(searchParams.get("page") ?? "1")
  const { data, isLoading } = useSupplierRequestFeed({ category: category || undefined, page, size: 20 })
  const { data: categories } = useSupplierCategories()

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-text">
          <h1>의뢰 피드</h1>
        </div>
        <p className="text-muted text-sm">내 카테고리에 맞는 의뢰를 확인하세요</p>
      </div>

      <div className="flex items-center gap-12 flex-wrap">
        <input
          className="input"
          style={{ maxWidth: 280 }}
          placeholder="🔍 의뢰 검색..."
          value={searchParams.get("keyword") ?? ""}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams)
            if (e.target.value) params.set("keyword", e.target.value)
            else params.delete("keyword")
            params.set("page", "1")
            setSearchParams(params)
          }}
        />

        <select
          className="select"
          value={category}
          onChange={(e) => setSearchParams({ category: e.target.value, page: "1" })}
          style={{ maxWidth: 160 }}
        >
          <option value="">카테고리</option>
          {categories?.map((item) => (
            <option key={item.category} value={item.category}>
              {item.category}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p>로딩 중...</p>
      ) : data?.items.length === 0 ? (
        <div className="empty-state">
          <p>표시할 의뢰가 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-12">
            {data?.items.map((request) => (
              <article className="surface relative" key={request.requestId}>
                <span className={`badge ${request.mode === "public" ? "badge-gray" : "badge-amber"} absolute-badge`}>
                  {request.mode === "public" ? "공개" : "지정"}
                </span>

                <h2 className="section-title mb-8">{request.title}</h2>

                <p className="text-sm text-muted mb-8">
                  카테고리: {request.category} &nbsp;&nbsp; 수량: {request.desiredVolume} &nbsp;&nbsp;
                  {request.targetPriceRange && (
                    <>
                      희망 단가: {request.targetPriceRange.min?.toLocaleString() ?? ""}~{request.targetPriceRange.max?.toLocaleString() ?? ""}원
                    </>
                  )}
                </p>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">
                    등록일: {new Date(request.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                  <Link
                    to={`/supplier/requests/${request.requestId}`}
                    className="btn btn-primary btn-sm"
                  >
                    견적 제출하기
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {(data?.meta?.totalPages ?? 0) >= 1 && (
            <div className="pagination">
              <button disabled={!data?.meta.hasPrev} onClick={() => setSearchParams({ category, page: String(Math.max(1, page - 1)) })}>‹</button>
              {Array.from({ length: Math.min(data?.meta.totalPages ?? 1, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={p === page ? "active" : ""} onClick={() => setSearchParams({ category, page: String(p) })}>{p}</button>
              ))}
              <button disabled={!data?.meta.hasNext} onClick={() => setSearchParams({ category, page: String(page + 1) })}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
