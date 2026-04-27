import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { RequestState } from "@fsm/types"
import { useRequestList } from "../hooks/useRequestList"
import { AsyncBoundary } from "../../../shared/components/AsyncBoundary"

const stateBadgeClass: Record<RequestState, string> = {
  draft: "badge badge-gray",
  open: "badge badge-green",
  closed: "badge badge-blue",
  cancelled: "badge badge-red",
}

function StateBadge({ state }: { state: RequestState }) {
  const { t } = useTranslation("request-management")
  return <span className={stateBadgeClass[state]}>{t(`state.${state}`)}</span>
}

export function RequestListPage() {
  const { t } = useTranslation("request-management")
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const stateFilter = (searchParams.get("state") as RequestState | null) ?? ""
  const page = Number(searchParams.get("page") ?? "1")
  const { data, isLoading, error } = useRequestList({ state: stateFilter || undefined, page, size: 20 })

  const tabs: { value: string; label: string }[] = [
    { value: "", label: t("list.tabAll") },
    { value: "draft", label: t("stateTab.draft") },
    { value: "open", label: t("stateTab.open") },
    { value: "closed", label: t("stateTab.closed") },
    { value: "cancelled", label: t("stateTab.cancelled") },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-text">
          <h1>{t("list.title")}</h1>
        </div>
        <div className="page-header-actions">
          <Link to="/requests/new" className="btn btn-primary">
            {t("list.createButton")}
          </Link>
        </div>
      </div>

      <div className="tab-underline">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={stateFilter === tab.value ? "active" : ""}
            onClick={() => setSearchParams({ state: tab.value, page: "1" })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        data={data}
        loadingFallback={<p className="text-muted">{t("common:loading")}</p>}
        errorFallback={<p className="text-danger">{t("common:errorOccurred")}</p>}
        isEmpty={(d) => d.items.length === 0}
        emptyFallback={
          <div className="empty-state">
            <p>{t("list.emptyMessage")}</p>
            <Link to="/requests/new" className="btn btn-primary btn-sm">
              {t("list.emptyCta")}
            </Link>
          </div>
        }
      >
        {(data) => (
          <>
            <div className="surface p-0 overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("list.headers.title")}</th>
                    <th>{t("list.headers.category")}</th>
                    <th>{t("list.headers.mode")}</th>
                    <th>{t("list.headers.state")}</th>
                    <th>{t("list.headers.createdAt")}</th>
                    <th>{t("list.headers.quote")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((request) => (
                    <tr key={request.requestId} onClick={() => navigate(`/requests/${request.requestId}`)} className="cursor-pointer">
                      <td className="font-semibold" data-label={t("list.headers.title")}>{request.title}</td>
                      <td className="text-muted" data-label={t("list.headers.category")}>{t(`common:supplierCategory.${request.category}`, { defaultValue: request.category })}</td>
                      <td className="text-muted" data-label={t("list.headers.mode")}>
                        {request.mode === "public" ? t("list.modePublic") : t("list.modeTargeted")}
                      </td>
                      <td data-label={t("list.headers.state")}><StateBadge state={request.state} /></td>
                      <td className="text-muted text-sm" data-label={t("list.headers.createdAt")}>{new Date(request.createdAt).toLocaleDateString("ko-KR")}</td>
                      <td data-label={t("list.headers.quote")}>{request.quoteCount > 0 ? t("list.quoteCount", { count: request.quoteCount }) : t("list.quoteNone")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.meta?.totalPages != null && data.meta.totalPages >= 1 && (
              <div className="pagination">
                <button aria-label={t("common:previous")} disabled={!data.meta.hasPrev} onClick={() => setSearchParams({ state: stateFilter, page: String(Math.max(1, page - 1)) })}>‹</button>
                {Array.from({ length: Math.min(data.meta.totalPages ?? 1, 5) }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={p === page ? "active" : ""} onClick={() => setSearchParams({ state: stateFilter, page: String(p) })}>{p}</button>
                ))}
                <button aria-label={t("common:next")} disabled={!data.meta.hasNext} onClick={() => setSearchParams({ state: stateFilter, page: String(page + 1) })}>›</button>
              </div>
            )}
          </>
        )}
      </AsyncBoundary>
    </div>
  )
}
