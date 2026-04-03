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
      <div className="page">
        <h1>의뢰 상세</h1>
        <p>로딩 중...</p>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="page">
        <h1>의뢰 상세</h1>
        <p className="text-danger">의뢰 정보를 불러올 수 없습니다.</p>
        <Link to="/supplier/requests" className="btn btn-ghost btn-sm">피드로 돌아가기</Link>
      </div>
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
    <div className="page">
      <Link to="/supplier/requests" className="text-muted text-sm">
        &larr; 피드로 돌아가기
      </Link>

      <div className="page-header">
        <div className="flex items-center gap-12">
          <h1>{request.title}</h1>
          <span className={request.mode === "public" ? "badge badge-blue" : "badge badge-red"}>
            {request.mode === "public" ? "공개 의뢰" : "지정 의뢰"}
          </span>
        </div>
        <div className="page-header-actions">
          {request.hasQuoted ? (
            <span className="badge badge-green">견적 제출 완료</span>
          ) : canQuote ? (
            <button className="btn btn-primary" onClick={handleQuoteClick}>
              견적 제출하기
            </button>
          ) : (
            <span className="badge badge-gray">
              {request.state === "closed" ? "마감된 의뢰입니다" : "견적 불가"}
            </span>
          )}
        </div>
      </div>

      {showQuoteConfirm && (
        <div className="surface surface-highlight">
          <h3 className="text-accent font-semibold mb-8">견적 제출</h3>
          <p className="text-sm mb-12">
            이 의뢰에 견적을 제출하시겠습니까? 견적을 제출하면 메시지 스레드가 자동으로 생성됩니다.
          </p>
          <div className="btn-group">
            <button className="btn btn-primary btn-sm" onClick={handleConfirmQuote}>
              견적 작성하러 가기
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowQuoteConfirm(false)}>
              취소
            </button>
          </div>
        </div>
      )}

      <div className="two-col-sidebar-r-lg">
        <div className="surface">
          <h2 className="section-title mb-16">의뢰 정보</h2>
          <dl className="detail-grid">
            <dt>카테고리</dt>
            <dd>{request.category}</dd>

            <dt>희망 수량</dt>
            <dd>{request.desiredVolume.toLocaleString()}개</dd>

            {request.targetPriceRange && (
              <>
                <dt>희망 단가</dt>
                <dd>
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
                <dt>필요 인증</dt>
                <dd>{request.certificationRequirement.join(", ")}</dd>
              </>
            )}

            {request.rawMaterialRule && (
              <>
                <dt>원재료 규칙</dt>
                <dd>
                  {request.rawMaterialRule === "requester_provided" ? "의뢰자 제공" : "공급자 제공"}
                </dd>
              </>
            )}

            {request.packagingRequirement && (
              <>
                <dt>포장/라벨링</dt>
                <dd>
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
                <dt>납기</dt>
                <dd>{new Date(request.deliveryRequirement).toLocaleDateString("ko-KR")}</dd>
              </>
            )}

            <dt>등록일</dt>
            <dd>{new Date(request.createdAt).toLocaleDateString("ko-KR")}</dd>
          </dl>
        </div>

        <div className="surface">
          <h2 className="section-title mb-16">의뢰자 정보</h2>
          <dl className="detail-grid">
            <dt>상호명</dt>
            <dd>{request.requesterBusinessName}</dd>

            <dt>담당자</dt>
            <dd className="text-muted">Task 08 이후 메시지 스레드에서 확인</dd>
          </dl>
        </div>
      </div>

      {request.notes && (
        <div className="surface">
          <h2 className="section-title mb-16">추가 요구사항</h2>
          <p className="pre-wrap">{request.notes}</p>
        </div>
      )}

      {request.mode === "targeted" && (
        <div className="surface surface-highlight">
          <h3 className="font-semibold mb-4">지정 의뢰</h3>
          <p className="text-sm text-muted">
            이 의뢰는 선택된 공급자에게만 노출되는 지정 의뢰입니다.
          </p>
        </div>
      )}
    </div>
  )
}
