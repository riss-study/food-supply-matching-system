import { Link, useParams } from "react-router-dom"
import { useMe } from "../../auth/hooks/useMe"
import { useSupplierDetail } from "../hooks/useSupplierDetail"

export function SupplierDetailPage() {
  const { supplierId = "" } = useParams()
  const { data, isLoading } = useSupplierDetail(supplierId)
  const { data: me } = useMe()

  if (isLoading || !data) {
    return <section><h1>공급자 상세</h1><p>로딩 중...</p></section>
  }

  const canRequest = me?.role === "requester" && me.businessApprovalState === "approved"

  const requestUrl = `/requests/new?targetSupplierId=${data.profileId}&targetSupplierName=${encodeURIComponent(data.companyName)}`

  return (
    <section>
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "0.75rem",
            backgroundColor: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
          }}
        >
          {data.logoUrl ? (
            <img
              src={data.logoUrl}
              alt={`${data.companyName} 로고`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: "3rem", color: "#9ca3af" }}>🏭</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem" }}>{data.companyName}</h1>
          <p style={{ margin: "0 0 0.25rem 0", color: "#6b7280" }}>대표자: {data.representativeName}</p>
          <p style={{ margin: "0 0 0.25rem 0", color: "#6b7280" }}>지역: {data.region}</p>
          <p style={{ margin: 0, color: "#6b7280" }}>카테고리: {data.categories.join(", ")}</p>
        </div>
      </div>

      <div style={{ display: "grid", gap: "0.5rem", marginBottom: "2rem", padding: "1rem", backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e5e7eb" }}>
        <p style={{ margin: 0 }}><strong>월 생산량:</strong> {data.monthlyCapacity.toLocaleString()}</p>
        <p style={{ margin: 0 }}><strong>MOQ:</strong> {data.moq.toLocaleString()}</p>
        <p style={{ margin: 0 }}><strong>OEM:</strong> {data.oemAvailable ? "가능" : "불가"} / <strong>ODM:</strong> {data.odmAvailable ? "가능" : "불가"}</p>
        <p style={{ margin: 0 }}><strong>원재료 지원:</strong> {data.rawMaterialSupport ? "가능" : "불가"} / <strong>포장/라벨링 지원:</strong> {data.packagingLabelingSupport ? "가능" : "불가"}</p>
      </div>

      {data.introduction && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.125rem", marginBottom: "0.5rem" }}>회사 소개</h2>
          <p style={{ margin: 0, lineHeight: 1.6, color: "#4b5563", whiteSpace: "pre-wrap" }}>{data.introduction}</p>
        </div>
      )}

      {data.equipmentSummary && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.125rem", marginBottom: "0.5rem" }}>보유 설비</h2>
          <p style={{ margin: 0, lineHeight: 1.6, color: "#4b5563" }}>{data.equipmentSummary}</p>
        </div>
      )}

      {data.certifications.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.125rem", marginBottom: "0.5rem" }}>인증서</h2>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#4b5563" }}>
            {data.certifications.map((cert) => (
              <li key={`${cert.type}-${cert.number ?? "none"}`}>
                {cert.type} {cert.number ? `(${cert.number})` : ""} {cert.valid ? "✓" : "✗"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.portfolioImages.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>포트폴리오</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem" }}>
            {data.portfolioImages.map((image) => (
              <a
                key={image.imageId}
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  aspectRatio: "1",
                  borderRadius: "0.5rem",
                  overflow: "hidden",
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                }}
              >
                <img
                  src={image.url}
                  alt={`포트폴리오 ${image.imageId}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "1.5rem", backgroundColor: "#f0fdf4", borderRadius: "0.75rem", border: "1px solid #bbf7d0" }}>
        {canRequest ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <p style={{ margin: "0 0 0.25rem 0", fontWeight: 500, color: "#166534" }}>
                이 공급자에게 의뢰를 보내고 싶으신가요?
              </p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#15803d" }}>
                지정 모드로 의뢰를 생성하면 해당 공급자에게만 견적을 요청할 수 있습니다.
              </p>
            </div>
            <Link
              to={requestUrl}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#16a34a",
                color: "white",
                textDecoration: "none",
                borderRadius: "0.5rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              이 공급자에게 의뢰하기
            </Link>
          </div>
        ) : (
          <p style={{ margin: 0, color: "#166534" }}>
            {me ? "사업자 승인 후 의뢰할 수 있습니다." : "로그인 후 이용할 수 있습니다."}
          </p>
        )}
      </div>
    </section>
  )
}
