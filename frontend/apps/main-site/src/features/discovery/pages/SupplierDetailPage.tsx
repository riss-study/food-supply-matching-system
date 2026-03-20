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

  return (
    <section>
      <h1>{data.companyName}</h1>
      <p>대표자: {data.representativeName}</p>
      <p>지역: {data.region}</p>
      <p>카테고리: {data.categories.join(", ")}</p>
      <p>월 생산량: {data.monthlyCapacity.toLocaleString()}</p>
      <p>MOQ: {data.moq.toLocaleString()}</p>
      <p>OEM: {data.oemAvailable ? "가능" : "불가"} / ODM: {data.odmAvailable ? "가능" : "불가"}</p>
      <p>{data.introduction}</p>

      <h2>인증서</h2>
      <ul>
        {data.certifications.map((cert) => <li key={`${cert.type}-${cert.number}`}>{cert.type} / {cert.number ?? "번호 없음"}</li>)}
      </ul>

      <h2>포트폴리오</h2>
      <ul>
        {data.portfolioImages.map((image) => <li key={image.imageId}><a href={image.url}>{image.imageId}</a></li>)}
      </ul>

      {canRequest ? (
        <Link to="/requests/new">의뢰하기</Link>
      ) : (
        <p>{me ? "사업자 승인 후 의뢰할 수 있습니다." : "로그인 후 이용할 수 있습니다."}</p>
      )}
    </section>
  )
}
