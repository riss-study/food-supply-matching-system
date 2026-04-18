import { Link, useParams } from "react-router-dom"
import { useMe } from "../../auth/hooks/useMe"
import { useSupplierDetail } from "../hooks/useSupplierDetail"

export function SupplierDetailPage() {
  const { supplierId = "" } = useParams()
  const { data, isLoading } = useSupplierDetail(supplierId)
  const { data: me } = useMe()

  if (isLoading || !data) {
    return <div className="page"><h1>공급자 상세</h1><p className="text-muted">로딩 중...</p></div>
  }

  const canRequest = me?.role === "requester" && me.businessApprovalState === "approved"

  const requestUrl = `/requests/new?targetSupplierId=${data.profileId}&targetSupplierName=${encodeURIComponent(data.companyName)}`

  return (
    <div className="page" style={{ gap: 0 }}>
      {/* Hero bar */}
      <div className="supplier-hero">
        <div className="flex items-center gap-12">
          <h1 className="font-bold" style={{ fontSize: 28 }}>{data.companyName}</h1>
          <span className="badge badge-green">인증 완료</span>
        </div>
        <div className="flex items-center gap-16 text-muted text-sm">
          <span>{data.region}</span>
          <span>·</span>
          <span>{data.categories.join(", ")}</span>
          <span>·</span>
          <div className="flex gap-6">
            {data.oemAvailable && <span className="badge badge-blue">OEM</span>}
            {data.odmAvailable && <span className="badge badge-blue">ODM</span>}
          </div>
        </div>
      </div>

      <div className="two-col-sidebar-r" style={{ padding: '32px 80px 40px' }}>
        {/* Left main */}
        <div className="flex flex-col gap-20" >
          {/* 제조 역량 */}
          <section className="surface">
            <h2 className="section-title mb-12">제조 역량</h2>
            <div className="grid gap-16" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              <div><p className="text-muted text-sm">월 생산능력</p><p className="font-bold">{data.monthlyCapacity}</p></div>
              <div><p className="text-muted text-sm">최소 주문량</p><p className="font-bold">{data.moq}</p></div>
              <div><p className="text-muted text-sm">원료 조달</p><p className="font-bold">{data.rawMaterialSupport ? "자체 조달 가능" : "지원 불가"}</p></div>
              <div><p className="text-muted text-sm">포장 지원</p><p className="font-bold">{data.packagingLabelingSupport ? "지원 가능" : "지원 불가"}</p></div>
            </div>
          </section>

          {/* 인증 */}
          {data.certifications.length > 0 && (
            <section className="surface">
              <h2 className="section-title mb-12">인증 현황</h2>
              <div className="flex gap-8 flex-wrap">
                {data.certifications.map((cert) => (
                  <span
                    key={`${cert.type}-${cert.number ?? "none"}`}
                    className={`badge ${cert.valid ? "badge-green" : "badge-red"}`}
                  >
                    {cert.type} {cert.number ? `(${cert.number})` : ""} {cert.valid ? "✓" : "✗"}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 회사 소개 */}
          {data.introduction && (
            <section className="surface">
              <h2 className="section-title mb-8">회사 소개</h2>
              <p className="text-muted" >{data.introduction}</p>
            </section>
          )}

          {/* 설비 */}
          {data.equipmentSummary && (
            <section className="surface">
              <h2 className="section-title mb-8">보유 설비</h2>
              <p className="text-muted">{data.equipmentSummary}</p>
            </section>
          )}

          {/* 포트폴리오 */}
          {data.portfolioImages.length > 0 && (
            <section className="surface">
              <h2 className="section-title mb-12">포트폴리오</h2>
              <div className="card-grid">
                {data.portfolioImages.map((image) => (
                  <a
                    key={image.imageId}
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded"
                  >
                    <img
                      src={image.url}
                      alt={`포트폴리오 ${image.imageId}`}
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="flex flex-col gap-16">
          <div className="surface flex flex-col gap-12 text-center">
            <h3 className="font-semibold">이 공급자에게<br />의뢰하기</h3>
            <p className="text-sm text-muted">원하는 조건으로 제조 의뢰를<br />보내보세요.</p>
            {canRequest ? (
              <>
                <Link to={requestUrl} className="btn btn-primary w-full">
                  의뢰하기
                </Link>
                <Link to={requestUrl} className="btn btn-secondary w-full">
                  메시지 보내기
                </Link>
                <p className="text-muted text-sm" style={{ fontSize: 11 }}>의뢰 등록 후 메시지를 보낼 수 있습니다</p>
              </>
            ) : (
              <p className="text-muted text-sm">
                {me ? "사업자 승인 후 의뢰할 수 있습니다." : "로그인 후 이용할 수 있습니다."}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
