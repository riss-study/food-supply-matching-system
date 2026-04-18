import { useParams } from "react-router-dom"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useReviewDetail } from "../hooks/useReviewDetail"
import { useApproveReview, useHoldReview, useRejectReview } from "../hooks/useReviewActions"
import { StateBadge } from "../components/StateBadge"
import { adminApiClient } from "../../auth/lib/api-client"
import type { AdminReviewHistoryItem } from "@fsm/types"

function HistoryItem({ item }: { item: AdminReviewHistoryItem }) {
  const { t } = useTranslation("reviews")
  const actionLabel = t(`actionType.${item.actionType}`, { defaultValue: item.actionType })
  return (
    <div className="timeline-item">
      <div className="timeline-item-header">
        <span className="timeline-item-action">{actionLabel}</span>
        <span className="timeline-item-date">
          {new Date(item.createdAt).toLocaleString("ko-KR")}
        </span>
      </div>
      <div className="timeline-item-actor">
        {t("detail.actor", { actor: item.actorUserId })}
      </div>
      {item.noteInternal && (
        <div className="timeline-item-note">
          <span className="timeline-item-label">{t("detail.noteInternalLabel")}</span> {item.noteInternal}
        </div>
      )}
      {item.notePublic && (
        <div className="timeline-item-note">
          <span className="timeline-item-label">{t("detail.notePublicLabel")}</span> {item.notePublic}
        </div>
      )}
      {item.reasonCode && (
        <div className="timeline-item-note">
          <span className="timeline-item-label">{t("detail.reasonCodeLabel")}</span> {item.reasonCode}
        </div>
      )}
    </div>
  )
}

export function ReviewDetailPage() {
  const { t } = useTranslation("reviews")
  const { reviewId = "" } = useParams()
  const { data, isLoading } = useReviewDetail(reviewId)
  const approveMutation = useApproveReview(reviewId)
  const holdMutation = useHoldReview(reviewId)
  const rejectMutation = useRejectReview(reviewId)
  const [noteInternal, setNoteInternal] = useState("")
  const [notePublic, setNotePublic] = useState("")
  const [reasonCode, setReasonCode] = useState("")

  if (isLoading || !data) {
    return <div className="page"><h1>{t("detailTitle")}</h1><p>{t("common:loading")}</p></div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t("detailTitle")}</h1>
      </div>

      <div className="two-col-sidebar-r">
        <div>
          <div className="surface">
            <div className="surface-section">
              <h2 className="section-title mb-16">{data.companyName}</h2>
              <div className="surface-meta">
                <StateBadge state={data.state} />
              </div>
            </div>
            <dl className="detail-grid">
              <dt>{t("detail.region")}</dt>
              <dd>{data.region}</dd>
              <dt>{t("detail.representative")}</dt>
              <dd>{data.representativeName}</dd>
              <dt>{t("detail.categories")}</dt>
              <dd>{data.categories.join(", ")}</dd>
              <dt>{t("detail.submittedAt")}</dt>
              <dd>{new Date(data.submittedAt).toLocaleString("ko-KR")}</dd>
              {data.reviewedAt && (
                <>
                  <dt>{t("detail.reviewedAt")}</dt>
                  <dd>{new Date(data.reviewedAt).toLocaleString("ko-KR")}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="surface">
            <h2 className="section-title mb-16">{t("detail.submittedDocuments")}</h2>
            <ul className="file-list">
              {data.files.map((file) => (
                <li key={file.fileId} className="file-list-item">
                  <span className="file-list-name">{file.fileName} ({file.status})</span>
                  {file.downloadUrl ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={async () => {
                        if (!file.downloadUrl) return
                        const res = await adminApiClient.get(file.downloadUrl, { responseType: "blob" })
                        const url = URL.createObjectURL(res.data)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = file.fileName
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                    >
                      {t("common:download")}
                    </button>
                  ) : (
                    <span className="file-list-unavailable">{t("common:downloadUnavailable")}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          {data.reviewHistory.length > 0 && (
            <div className="surface">
              <h2 className="section-title mb-16">{t("detail.historyTitle", { count: data.reviewHistory.length })}</h2>
              <div className="timeline">
                {data.reviewHistory.map((item, index) => (
                  <HistoryItem key={index} item={item} />
                ))}
              </div>
            </div>
          )}

          <div className="surface">
            <h2 className="section-title mb-16">{t("detail.decisionTitle")}</h2>
            <div className="form-stack">
              <div className="input-field">
                <label>{t("detail.noteInternal")}</label>
                <textarea
                  className="textarea"
                  value={noteInternal}
                  onChange={(e) => setNoteInternal(e.target.value)}
                  placeholder={t("detail.noteInternal")}
                  rows={3}
                />
              </div>
              <div className="input-field">
                <label>{t("detail.notePublic")}</label>
                <textarea
                  className="textarea"
                  value={notePublic}
                  onChange={(e) => setNotePublic(e.target.value)}
                  placeholder={t("detail.notePublic")}
                  rows={3}
                />
              </div>
              <div className="input-field">
                <label>{t("detail.reasonCodeOptional")}</label>
                <input
                  className="input"
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  placeholder={t("detail.reasonCodeOptional")}
                />
              </div>
              <div className="btn-group">
                <button
                  className="btn btn-primary"
                  onClick={() => approveMutation.mutate({ noteInternal, notePublic })}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? t("common:processing") : t("detail.approve")}
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => holdMutation.mutate({ noteInternal, notePublic })}
                  disabled={holdMutation.isPending}
                >
                  {holdMutation.isPending ? t("common:processing") : t("detail.hold")}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => rejectMutation.mutate({ noteInternal, notePublic, reasonCode })}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? t("common:processing") : t("detail.reject")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
