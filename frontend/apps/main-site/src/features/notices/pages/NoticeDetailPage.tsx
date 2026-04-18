import { useParams, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getApiBaseUrl } from "@fsm/utils"
import { usePublicNoticeDetail } from "../hooks/usePublicNoticeDetail"

export function NoticeDetailPage() {
  const { t } = useTranslation("notices")
  const { noticeId } = useParams<{ noticeId: string }>()
  const { data, isLoading, error } = usePublicNoticeDetail(noticeId || "")

  if (isLoading) {
    return (
      <div className="page">
        <Link to="/notices" className="text-accent text-sm">
          &larr; {t("common:backToList")}
        </Link>
        <p>{t("common:loading")}</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="page">
        <Link to="/notices" className="text-accent text-sm">
          &larr; {t("common:backToList")}
        </Link>
        <p className="text-danger">{t("detail.loadError")}</p>
      </div>
    )
  }

  return (
    <div className="page">
      <Link to="/notices" className="text-accent text-sm">
        &larr; {t("common:backToList")}
      </Link>

      <header className="border-b mb-20 pb-16">
        <h1 className="text-2xl font-bold mb-8">{data.title}</h1>
        <div className="flex gap-16 text-sm text-muted">
          <span>
            {t("detail.publishedPrefix")}{" "}
            {new Date(data.publishedAt).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span>{t("detail.viewCount", { value: data.viewCount.toLocaleString() })}</span>
        </div>
      </header>

      <article className="surface pre-wrap">{data.body}</article>

      {data.attachments.length > 0 && (
        <div className="surface bg-panel">
          <h3 className="section-title mb-12">{t("detail.attachmentsTitle")}</h3>
          {data.attachments.map((attachment) => (
            <div key={attachment.attachmentId} className="flex items-center gap-8 border-b p-8">
              <a
                href={`${getApiBaseUrl()}${attachment.url}`}
                download={attachment.fileName}
                className="text-accent"
              >
                {attachment.fileName}
              </a>
              <span className="text-sm text-muted">
                ({(attachment.fileSize / 1024).toFixed(1)} KB)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
