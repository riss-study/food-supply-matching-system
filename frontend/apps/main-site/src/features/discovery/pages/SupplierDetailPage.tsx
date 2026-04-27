import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useMe } from "../../auth/hooks/useMe"
import { useSupplierDetail } from "../hooks/useSupplierDetail"
import { RatingStars, useSupplierReviews } from "../../reviews"

export function SupplierDetailPage() {
  const { t } = useTranslation("discovery")
  const { t: tReviews } = useTranslation("reviews")
  const { supplierId = "" } = useParams()
  const { data, isLoading } = useSupplierDetail(supplierId)
  const { data: me } = useMe()
  const reviewsQuery = useSupplierReviews(supplierId, 1, 20)

  if (isLoading || !data) {
    return <div className="page"><h1>{t("detail.title")}</h1><p className="text-muted">{t("common:loading")}</p></div>
  }

  const canRequest = me?.role === "requester" && me.businessApprovalState === "approved"

  const requestUrl = `/requests/new?targetSupplierId=${data.profileId}&targetSupplierName=${encodeURIComponent(data.companyName)}`

  return (
    <div className="page" style={{ gap: 0 }}>
      {/* Hero bar */}
      <div className="supplier-hero">
        <div className="flex items-center gap-12">
          <h1 className="font-bold" style={{ fontSize: 28 }}>{data.companyName}</h1>
          <span className="badge badge-green">{t("detail.certifiedBadge")}</span>
        </div>
        <div className="flex items-center gap-16 text-muted text-sm">
          <span>{data.region}</span>
          <span>·</span>
          <span>{data.categories.map((code) => t(`common:supplierCategory.${code}`, { defaultValue: code })).join(", ")}</span>
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
            <h2 className="section-title mb-12">{t("detail.manufacturingCapabilityTitle")}</h2>
            <div className="grid gap-16" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              <div><p className="text-muted text-sm">{t("detail.monthlyCapacityLabel")}</p><p className="font-bold">{data.monthlyCapacity}</p></div>
              <div><p className="text-muted text-sm">{t("detail.moqLabel")}</p><p className="font-bold">{data.moq}</p></div>
              <div><p className="text-muted text-sm">{t("detail.rawMaterialLabel")}</p><p className="font-bold">{data.rawMaterialSupport ? t("detail.rawMaterialYes") : t("detail.rawMaterialNo")}</p></div>
              <div><p className="text-muted text-sm">{t("detail.packagingLabel")}</p><p className="font-bold">{data.packagingLabelingSupport ? t("detail.packagingYes") : t("detail.packagingNo")}</p></div>
            </div>
          </section>

          {/* 인증 */}
          {data.certifications.length > 0 && (
            <section className="surface">
              <h2 className="section-title mb-12">{t("detail.certificationsTitle")}</h2>
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
              <h2 className="section-title mb-8">{t("detail.introductionTitle")}</h2>
              <p className="text-muted" >{data.introduction}</p>
            </section>
          )}

          {/* 설비 */}
          {data.equipmentSummary && (
            <section className="surface">
              <h2 className="section-title mb-8">{t("detail.equipmentTitle")}</h2>
              <p className="text-muted">{data.equipmentSummary}</p>
            </section>
          )}

          {/* 포트폴리오 */}
          {data.portfolioImages.length > 0 && (
            <section className="surface">
              <h2 className="section-title mb-12">{t("detail.portfolioTitle")}</h2>
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
                      alt={t("detail.portfolioAlt", { id: image.imageId })}
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* 리뷰 */}
          <section className="surface">
            <div className="flex items-center justify-between mb-12">
              <h2 className="section-title" style={{ margin: 0 }}>{tReviews("list.title")}</h2>
              <span className="text-muted text-sm">{tReviews("list.count", { count: data.ratingCount })}</span>
            </div>
            <div className="flex items-center gap-12 mb-16">
              <span className="font-bold" style={{ fontSize: 24 }}>{data.ratingAvg.toFixed(1)}</span>
              <RatingStars value={Math.round(data.ratingAvg)} readOnly size="md" />
            </div>
            {reviewsQuery.isError ? (
              <p className="text-danger text-sm">{tReviews("list.loadError")}</p>
            ) : reviewsQuery.isLoading ? (
              <p className="text-muted text-sm">{t("common:loading")}</p>
            ) : reviewsQuery.data && reviewsQuery.data.items.length > 0 ? (
              <ul className="flex flex-col gap-12" style={{ padding: 0, listStyle: "none", margin: 0 }}>
                {reviewsQuery.data.items.map((r) => (
                  <li key={r.reviewId} className="flex flex-col gap-4" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12 }}>
                    <div className="flex items-center justify-between gap-8">
                      <span className="font-semibold text-sm">{r.authorDisplayName}</span>
                      <div className="flex items-center gap-8">
                        <RatingStars value={r.rating} readOnly size="sm" />
                        <span className="text-muted text-xs">{new Date(r.createdAt).toLocaleDateString("ko-KR")}</span>
                      </div>
                    </div>
                    {r.text && <p className="text-muted text-sm" style={{ whiteSpace: "pre-wrap", margin: 0 }}>{r.text}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted text-sm">{tReviews("list.empty")}</p>
            )}
          </section>
        </div>

        {/* Right sidebar */}
        <aside className="flex flex-col gap-16">
          <div className="surface flex flex-col gap-12 text-center">
            <h3 className="font-semibold">{t("detail.requestTitle")}<br />{t("detail.requestTitleLine2")}</h3>
            <p className="text-sm text-muted">{t("detail.requestSubtitleLine1")}<br />{t("detail.requestSubtitleLine2")}</p>
            {canRequest ? (
              <>
                <Link to={requestUrl} className="btn btn-primary w-full">
                  {t("detail.requestCta")}
                </Link>
                <Link to={requestUrl} className="btn btn-secondary w-full">
                  {t("detail.messageCta")}
                </Link>
                <p className="text-muted text-sm" style={{ fontSize: 11 }}>{t("detail.messageHint")}</p>
              </>
            ) : (
              <p className="text-muted text-sm">
                {me ? t("detail.needApproval") : t("detail.needLogin")}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
