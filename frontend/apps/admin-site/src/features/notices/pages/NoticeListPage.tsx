import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNotices } from "../hooks/useNotices"
import { NoticeStateBadge } from "../components/NoticeStateBadge"
import type { PaginationMeta } from "@fsm/types"

interface NoticeListPageProps {
  onCreateClick?: () => void
  onEditClick?: (noticeId: string) => void
}

const tabs = [
  { value: "", labelKey: "tabs.all" },
  { value: "draft", labelKey: "tabs.draft" },
  { value: "published", labelKey: "tabs.published" },
  { value: "archived", labelKey: "tabs.archived" },
]

export function NoticeListPage({ onCreateClick, onEditClick }: NoticeListPageProps) {
  const { t } = useTranslation("notices")
  const [state, setState] = useState("")
  const [sort] = useState("")
  const [order] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [size] = useState(20)

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const today = new Date().toISOString().split("T")[0]
  const [fromDate, setFromDate] = useState(ninetyDaysAgo)
  const [toDate, setToDate] = useState(today)

  const maxFrom = toDate || today
  const minTo = fromDate || ninetyDaysAgo

  const { data, isLoading } = useNotices({
    state: state || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    sort: sort || undefined,
    order,
    page,
    size,
  })

  const meta = data?.meta as PaginationMeta | undefined

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t("listTitle")}</h1>
        <div className="page-header-actions">
          <input className="input" type="date" value={fromDate} max={maxFrom} onChange={(e) => { setFromDate(e.target.value); setPage(1) }} />
          <span className="text-muted">~</span>
          <input className="input" type="date" value={toDate} min={minTo} max={today} onChange={(e) => { setToDate(e.target.value); setPage(1) }} />
          <button className="btn btn-primary" onClick={onCreateClick}>
            {t("createButton")}
          </button>
        </div>
      </div>

      <div className="tab-underline">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={state === tab.value ? "active" : ""}
            onClick={() => { setState(tab.value); setPage(1) }}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {isLoading ? <p className="text-muted text-center">{t("common:loading")}</p> : null}

      {!isLoading && data?.items.length === 0 ? (
        <div className="empty-state">
          <p>{t("empty")}</p>
        </div>
      ) : data?.items.length ? (
        <div className="surface p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("columns.title")}</th>
                <th>{t("columns.state")}</th>
                <th>{t("columns.createdAt")}</th>
                <th>{t("columns.author")}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.noticeId} className="cursor-pointer" onClick={() => onEditClick?.(item.noticeId)}>
                  <td className="font-semibold" data-label={t("columns.title")}>{item.title}</td>
                  <td data-label={t("columns.state")}>
                    <NoticeStateBadge state={item.state} />
                  </td>
                  <td className="text-muted" data-label={t("columns.createdAt")}>
                    {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="text-muted" data-label={t("columns.author")}>{item.authorName || item.authorId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {meta != null && meta.totalPages >= 1 && (
        <div className="pagination">
          <button disabled={!meta.hasPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
          {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button disabled={!meta.hasNext} onClick={() => setPage((p) => Math.min(meta.totalPages || p, p + 1))}>›</button>
        </div>
      )}
    </div>
  )
}
