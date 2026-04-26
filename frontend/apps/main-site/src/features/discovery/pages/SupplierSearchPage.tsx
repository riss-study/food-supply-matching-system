import { useSearchParams, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { SUPPLIER_CATEGORY_CODES } from "@fsm/config"
import { useSupplierCategories } from "../hooks/useDiscoveryLookups"
import { useSupplierList } from "../hooks/useSupplierList"

export function SupplierSearchPage() {
  const { t } = useTranslation("discovery")
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get("keyword") ?? ""
  const category = searchParams.get("category") ?? ""
  const oem = searchParams.get("oem") === "true"
  const odm = searchParams.get("odm") === "true"
  const maxMoq = searchParams.get("maxMoq") ?? ""
  const sort = searchParams.get("sort") ?? "updatedAt"
  const order = searchParams.get("order") ?? "desc"
  const page = Number(searchParams.get("page") ?? "1")

  const { data } = useSupplierList({
    keyword,
    category,
    oem: oem || undefined,
    odm: odm || undefined,
    maxMoq: maxMoq ? Number(maxMoq) : undefined,
    sort,
    order,
    page,
    size: 20,
  })
  const { data: categories } = useSupplierCategories()
  const categoryCounts = new Map((categories ?? []).map((item) => [item.category, item.supplierCount]))

  const updateSearchParams = (updates: Record<string, string | undefined>) => {
    const newParams: Record<string, string> = {}
    if (keyword && !("keyword" in updates)) newParams.keyword = keyword
    if (category && !("category" in updates)) newParams.category = category
    if (oem && !("oem" in updates)) newParams.oem = "true"
    if (odm && !("odm" in updates)) newParams.odm = "true"
    if (maxMoq && !("maxMoq" in updates)) newParams.maxMoq = maxMoq
    if (sort !== "updatedAt" && !("sort" in updates)) newParams.sort = sort
    if (order !== "desc" && !("order" in updates)) newParams.order = order

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        newParams[key] = value
      }
    })

    // 페이지가 명시적으로 지정되지 않은 경우만 1페이지로 리셋
    if (!("page" in updates)) {
      newParams.page = "1"
    }
    setSearchParams(newParams)
  }

  return (
    <div className="supplier-search-layout">
      <div className="supplier-search-body">
        {/* LEFT: Filter sidebar */}
        <aside className="supplier-filter-panel">
          <h2 className="text-lg font-bold">{t("search.filterTitle")}</h2>

          <div className="input-field">
            <input
              className="input"
              value={keyword}
              onChange={(e) => updateSearchParams({ keyword: e.target.value })}
              placeholder={t("search.keywordPlaceholder")}
            />
          </div>

          <div className="input-field">
            <label>{t("search.categoryLabel")}</label>
            <select
              className="select"
              value={category}
              onChange={(e) => updateSearchParams({ category: e.target.value })}
            >
              <option value="">{t("common:all")}</option>
              {SUPPLIER_CATEGORY_CODES.map((code) => {
                const count = categoryCounts.get(code) ?? 0
                const label = t(`common:supplierCategory.${code}`, { defaultValue: code })
                return (
                  <option key={code} value={code}>
                    {label} ({count})
                  </option>
                )
              })}
            </select>
          </div>

          <div className="input-field">
            <label>{t("search.moqLabel")}</label>
            <input
              className="input"
              type="number"
              value={maxMoq}
              onChange={(e) => updateSearchParams({ maxMoq: e.target.value })}
              placeholder={t("search.moqPlaceholder")}
              min={0}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-8 block">{t("search.manufacturingModeLabel")}</label>
            <div className="flex gap-8">
              <button
                type="button"
                className={`chip ${oem ? "chip--active" : ""}`}
                onClick={() => updateSearchParams({ oem: oem ? undefined : "true" })}
              >
                OEM
              </button>
              <button
                type="button"
                className={`chip ${odm ? "chip--active" : ""}`}
                onClick={() => updateSearchParams({ odm: odm ? undefined : "true" })}
              >
                ODM
              </button>
            </div>
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={() => updateSearchParams({})}
          >
            {t("search.applyFilter")}
          </button>
        </aside>

        {/* RIGHT: Results */}
        <div className="supplier-result-area">
          {data?.items.length ? (
            <>
            <div className="flex items-center gap-8" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
              <div className="flex items-center gap-8">
                <h1 className="font-bold" style={{ fontSize: 18 }}>
                  {t("search.resultTitle")}
                </h1>
                <span className="text-muted text-base">{t("search.resultCountSuffix", { count: data.meta.totalElements })}</span>
              </div>
              <div className="flex gap-8 items-center">
                <label className="text-sm text-muted" htmlFor="supplier-sort">{t("search.sortLabel")}</label>
                <select
                  id="supplier-sort"
                  className="select"
                  value={sort}
                  onChange={(e) => updateSearchParams({ sort: e.target.value })}
                >
                  <option value="updatedAt">{t("search.sortUpdatedAt")}</option>
                  <option value="companyName">{t("search.sortCompanyName")}</option>
                  <option value="moq">{t("search.sortMoq")}</option>
                </select>
                <select
                  className="select"
                  value={order}
                  onChange={(e) => updateSearchParams({ order: e.target.value })}
                  aria-label={t("search.sortLabel")}
                >
                  <option value="desc">{t("search.orderDesc")}</option>
                  <option value="asc">{t("search.orderAsc")}</option>
                </select>
              </div>
            </div>

          <div className="grid gap-16" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {data?.items.map((item) => (
              <Link to={`/suppliers/${item.profileId}`} className="supplier-card" key={item.profileId}>
                <div className="flex items-center gap-8">
                  <h2 className="font-bold text-base">{item.companyName}</h2>
                  <span className="badge badge-green">{t("search.certifiedBadge")}</span>
                </div>
                <p className="text-muted text-sm">
                  {item.region} · {item.categories.join(", ")}
                </p>
                <div className="flex gap-8 flex-wrap">
                  {item.oemAvailable && <span className="badge badge-blue">OEM</span>}
                  {item.odmAvailable && <span className="badge badge-blue">ODM</span>}
                </div>
                <p className="text-muted text-sm">
                  {t("search.capacityPrefix", { capacity: item.monthlyCapacity })} &nbsp;&nbsp; {t("search.moqPrefix", { moq: item.moq })}
                </p>
              </Link>
            ))}
          </div>

          {data.meta?.totalPages != null && data.meta.totalPages >= 1 && (
            <div className="pagination">
              <button
                disabled={!data.meta.hasPrev}
                onClick={() => updateSearchParams({ page: String(Math.max(1, page - 1)) })}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(data.meta.totalPages ?? 1, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={p === page ? "active" : ""}
                  onClick={() => updateSearchParams({ page: String(p) })}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={!data.meta.hasNext}
                onClick={() => updateSearchParams({ page: String(page + 1) })}
              >
                ›
              </button>
            </div>
          )}
          </>
          ) : (
            <div className="empty-state">
              <p>{t("search.emptyMessage")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

