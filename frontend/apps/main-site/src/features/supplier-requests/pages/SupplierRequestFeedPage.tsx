import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useSupplierRequestFeed } from "../hooks/useSupplierRequestFeed"
import { useSupplierCategories } from "../../discovery/hooks/useDiscoveryLookups"

export function SupplierRequestFeedPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get("category") ?? ""
  const page = Number(searchParams.get("page") ?? "1")
  const { data, isLoading } = useSupplierRequestFeed({ category: category || undefined, page, size: 20 })
  const { data: categories } = useSupplierCategories()
  const [activeTab, setActiveTab] = useState<"all" | "public" | "targeted">("all")

  const filteredItems =
    activeTab === "all" ? data?.items : data?.items.filter((item) => item.mode === activeTab)

  return (
    <section>
      <h1 style={{ marginBottom: "1.5rem" }}>의뢰 피드</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[
            { value: "all", label: "전체 의뢰" },
            { value: "public", label: "공개 의뢰" },
            { value: "targeted", label: "지정 의뢰" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as typeof activeTab)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: activeTab === tab.value ? "#1f2937" : "#f3f4f6",
                color: activeTab === tab.value ? "white" : "#4b5563",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          value={category}
          onChange={(e) => setSearchParams({ category: e.target.value, page: "1" })}
          style={{ padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", maxWidth: "200px" }}
        >
          <option value="">전체 카테고리</option>
          {categories?.map((item) => (
            <option key={item.category} value={item.category}>
              {item.category}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p>로딩 중...</p>
      ) : filteredItems?.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#6b7280" }}>
          <p>표시할 의뢰가 없습니다.</p>
          {activeTab === "targeted" && <p>지정된 의뢰가 있으면 여기에 표시됩니다.</p>}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gap: "1rem" }}>
            {filteredItems?.map((request) => (
              <article
                key={request.requestId}
                style={{
                  border: "1px solid #e5e7eb",
                  padding: "1.25rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "white",
                  position: "relative",
                }}
              >
                {request.hasQuoted && (
                  <span
                    style={{
                      position: "absolute",
                      top: "0.75rem",
                      right: "0.75rem",
                      padding: "0.25rem 0.5rem",
                      backgroundColor: "#10b981",
                      color: "white",
                      borderRadius: "0.25rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    견적 제출 완료
                  </span>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <span
                    style={{
                      padding: "0.25rem 0.5rem",
                      backgroundColor: request.mode === "public" ? "#dbeafe" : "#fce7f3",
                      color: request.mode === "public" ? "#1e40af" : "#9d174d",
                      borderRadius: "0.25rem",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  >
                    {request.mode === "public" ? "공개" : "지정"}
                  </span>
                  <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>{request.category}</span>
                </div>

                <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.125rem", fontWeight: 600 }}>{request.title}</h2>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "0.75rem", fontSize: "0.875rem", color: "#6b7280" }}>
                  <span>의뢰자: {request.requesterBusinessName}</span>
                  <span>•</span>
                  <span>희망 수량: {request.desiredVolume.toLocaleString()}개</span>
                  {request.targetPriceRange && (
                    <>
                      <span>•</span>
                      <span>
                        희망 단가: {" "}
                        {request.targetPriceRange.min && request.targetPriceRange.max
                          ? `${request.targetPriceRange.min.toLocaleString()}원 ~ ${request.targetPriceRange.max.toLocaleString()}원`
                          : request.targetPriceRange.min
                            ? `${request.targetPriceRange.min.toLocaleString()}원 이상`
                            : request.targetPriceRange.max
                              ? `${request.targetPriceRange.max.toLocaleString()}원 이하`
                              : "미지정"}
                      </span>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                    등록일: {new Date(request.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                  <Link
                    to={`/supplier/requests/${request.requestId}`}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: request.hasQuoted ? "#f3f4f6" : "#3b82f6",
                      color: request.hasQuoted ? "#374151" : "white",
                      borderRadius: "0.375rem",
                      textDecoration: "none",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    {request.hasQuoted ? "내 견적 보기" : "상세 보기"}
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "center" }}>
            <button
              disabled={!data?.meta.hasPrev}
              onClick={() => setSearchParams({ category, page: String(Math.max(1, page - 1)) })}
            >
              이전
            </button>
            <span>
              페이지 {data?.meta.page ?? 1} / {data?.meta.totalPages ?? 1}
            </span>
            <button
              disabled={!data?.meta.hasNext}
              onClick={() => setSearchParams({ category, page: String(page + 1) })}
            >
              다음
            </button>
          </div>
        </>
      )}
    </section>
  )
}
