import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useSupplierRequestDetail } from "../hooks/useSupplierRequestDetail"

export function SupplierRequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const { data: request, isLoading, error } = useSupplierRequestDetail(requestId ?? "")
  const [showQuoteConfirm, setShowQuoteConfirm] = useState(false)

  if (isLoading) {
    return (
      <section>
        <h1>의뢰 상세</h1>
        <p>로딩 중...</p>
      </section>
    )
  }

  if (error || !request) {
    return (
      <section>
        <h1>의뢰 상세</h1>
        <p style={{ color: "#ef4444" }}>의뢰 정보를 불러올 수 없습니다.</p>
        <Link to="/supplier/requests">피드로 돌아가기</Link>
      </section>
    )
  }

  const canQuote = !request.hasQuoted && request.state === "open"

  const handleQuoteClick = () => {
    setShowQuoteConfirm(true)
  }

  const handleConfirmQuote = () => {
    navigate(`/quotes/create?requestId=${request.requestId}`)
  }

  return (
    <section>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link to="/supplier/requests" style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.875rem" }}>
          ← 피드로 돌아가기
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>{request.title}</h1>
            <span
              style={{
                padding: "0.375rem 0.75rem",
                backgroundColor: request.mode === "public" ? "#dbeafe" : "#fce7f3",
                color: request.mode === "public" ? "#1e40af" : "#9d174d",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              {request.mode === "public" ? "공개 의뢰" : "지정 의뢰"}
            </span>
          </div>
          <div style={{ display: "flex", gap: "1rem", color: "#6b7280", fontSize: "0.875rem" }}>
            <span>카테고리: {request.category}</span>
            <span>•</span>
            <span>등록일: {new Date(request.createdAt).toLocaleDateString("ko-KR")}</span>
          </div>
        </div>

        {request.hasQuoted ? (
          <div
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#d1fae5",
              color: "#166534",
              borderRadius: "0.5rem",
              fontWeight: 600,
            }}
          >
            견적 제출 완료
          </div>
        ) : canQuote ? (
          <button
            onClick={handleQuoteClick}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            견적 제출하기
          </button>
        ) : (
          <div
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#f3f4f6",
              color: "#6b7280",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
            }}
          >
            {request.state === "closed" ? "마감된 의뢰입니다" : "견적 불가"}
          </div>
        )}
      </div>

      {showQuoteConfirm && (
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <h3 style={{ margin: "0 0 0.75rem", color: "#1e40af" }}>견적 제출</h3>
          <p style={{ margin: "0 0 1rem", color: "#1e40af" }}>
            이 의뢰에 견적을 제출하시겠습니까? 견적을 제출하면 메시지 스레드가 자동으로 생성됩니다.
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handleConfirmQuote}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              견적 작성하러 가기
            </button>
            <button
              onClick={() => setShowQuoteConfirm(false)}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "transparent",
                color: "#6b7280",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                cursor: "pointer",
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        }}
      >
        <div style={{ padding: "1.25rem", backgroundColor: "white", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 600 }}>의뢰 정보</h2>
          <dl style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.75rem 1rem", margin: 0 }}>
            <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>카테고리</dt>
            <dd style={{ margin: 0 }}>{request.category}</dd>

            <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>희망 수량</dt>
            <dd style={{ margin: 0 }}>{request.desiredVolume.toLocaleString()}개</dd>

            {request.targetPriceRange && (
              <>
                <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>희망 단가</dt>
                <dd style={{ margin: 0 }}>
                  {request.targetPriceRange.min && request.targetPriceRange.max
                    ? `${request.targetPriceRange.min.toLocaleString()}원 ~ ${request.targetPriceRange.max.toLocaleString()}원`
                    : request.targetPriceRange.min
                      ? `${request.targetPriceRange.min.toLocaleString()}원 이상`
                      : request.targetPriceRange.max
                        ? `${request.targetPriceRange.max.toLocaleString()}원 이하`
                        : "미지정"}
                </dd>
              </>
            )}

            {request.certificationRequirement && request.certificationRequirement.length > 0 && (
              <>
                <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>필요 인증</dt>
                <dd style={{ margin: 0 }}>{request.certificationRequirement.join(", ")}</dd>
              </>
            )}

            {request.rawMaterialRule && (
              <>
                <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>원재료 규칙</dt>
                <dd style={{ margin: 0 }}>
                  {request.rawMaterialRule === "requester_provided" ? "의뢰자 제공" : "공급자 제공"}
                </dd>
              </>
            )}

            {request.packagingRequirement && (
              <>
                <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>포장/라벨링</dt>
                <dd style={{ margin: 0 }}>
                  {request.packagingRequirement === "private_label"
                    ? "프라이빗 라벨"
                    : request.packagingRequirement === "bulk"
                      ? "벌크"
                      : "없음"}
                </dd>
              </>
            )}

            {request.deliveryRequirement && (
              <>
                <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>납기</dt>
                <dd style={{ margin: 0 }}>{new Date(request.deliveryRequirement).toLocaleDateString("ko-KR")}</dd>
              </>
            )}
          </dl>
        </div>

        <div style={{ padding: "1.25rem", backgroundColor: "white", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 600 }}>의뢰자 정보</h2>
          <dl style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "0.75rem 1rem", margin: 0 }}>
            <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>상호명</dt>
            <dd style={{ margin: 0 }}>{request.requesterBusinessName}</dd>

            <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>담당자</dt>
            <dd style={{ margin: 0 }}>Task 08 이후 메시지 스레드에서 확인</dd>
          </dl>
        </div>
      </div>

      {request.notes && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1.25rem",
            backgroundColor: "white",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.125rem", fontWeight: 600 }}>추가 요구사항</h2>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{request.notes}</p>
        </div>
      )}

      {request.mode === "targeted" && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1.25rem",
            backgroundColor: "#fdf2f8",
            borderRadius: "0.5rem",
            border: "1px solid #fbcfe8",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 600, color: "#9d174d" }}>지정 의뢰</h3>
          <p style={{ margin: 0, color: "#9d174d", fontSize: "0.875rem" }}>
            이 의뢰는 선택된 공급자에게만 노출되는 지정 의뢰입니다.
          </p>
        </div>
      )}
    </section>
  )
}
