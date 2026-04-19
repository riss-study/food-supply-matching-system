import { Link, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useSupplierRequestFeed } from "../hooks/useSupplierRequestFeed"
import { useSupplierCategories } from "../../discovery/hooks/useDiscoveryLookups"

export function SupplierRequestFeedPage() {
  const { t } = useTranslation("supplier-requests")
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get("category") ?? ""
  const page = Number(searchParams.get("page") ?? "1")
  const { data, isLoading } = useSupplierRequestFeed({ category: category || undefined, page, size: 20 })
  const { data: categories } = useSupplierCategories()

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-text">
          <h1>{t("feed.title")}</h1>
        </div>
        <p className="text-muted text-sm">{t("feed.description")}</p>
      </div>

      <div className="flex items-center gap-12 flex-wrap">
        <input
          className="input"
          style={{ maxWidth: 280 }}
          placeholder={t("feed.searchPlaceholder")}
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
          <option value="">{t("feed.categorySelect")}</option>
          {categories?.map((item) => (
            <option key={item.category} value={item.category}>
              {item.category}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p>{t("feed.loading")}</p>
      ) : data?.items.length === 0 ? (
        <div className="empty-state">
          <p>{t("feed.emptyMessage")}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-12">
            {data?.items.map((request) => (
              <article className="surface relative" key={request.requestId}>
                <span className={`badge ${request.mode === "public" ? "badge-gray" : "badge-amber"} absolute-badge`}>
                  {request.mode === "public" ? t("feed.modePublic") : t("feed.modeTargeted")}
                </span>

                <h2 className="section-title mb-8">{request.title}</h2>

                <p className="text-sm text-muted mb-8">
                  {t("feed.categoryPrefix", { category: request.category })} &nbsp;&nbsp; {t("feed.volumePrefix", { volume: request.desiredVolume })} &nbsp;&nbsp;
                  {request.targetPriceRange && (
                    <>
                      {t("feed.priceRangePrefix", { min: request.targetPriceRange.min?.toLocaleString() ?? "", max: request.targetPriceRange.max?.toLocaleString() ?? "" })}
                    </>
                  )}
                </p>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">
                    {t("feed.createdPrefix", { date: new Date(request.createdAt).toLocaleDateString("ko-KR") })}
                  </span>
                  <Link
                    to={`/supplier/requests/${request.requestId}`}
                    className="btn btn-primary btn-sm"
                  >
                    {t("feed.submitQuoteCta")}
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {(data?.meta?.totalPages ?? 0) >= 1 && (
            <div className="pagination">
              <button aria-label={t("common:previous")} disabled={!data?.meta.hasPrev} onClick={() => setSearchParams({ category, page: String(Math.max(1, page - 1)) })}>‹</button>
              {Array.from({ length: Math.min(data?.meta.totalPages ?? 1, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={p === page ? "active" : ""} onClick={() => setSearchParams({ category, page: String(p) })}>{p}</button>
              ))}
              <button aria-label={t("common:next")} disabled={!data?.meta.hasNext} onClick={() => setSearchParams({ category, page: String(page + 1) })}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
