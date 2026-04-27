import { useEffect, useRef, useState, useCallback } from "react"
import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useThreadDetail } from "../hooks/useThreadDetail"
import { useThreadStream } from "../hooks/useThreadStream"
import { useNotificationStore } from "../../notifications/store/notification-store"
import { useSendMessage } from "../hooks/useSendMessage"
import { useMarkThreadRead } from "../hooks/useMarkThreadRead"
import { useUploadAttachment } from "../hooks/useUploadAttachment"
import { useRequestContactShare } from "../hooks/useRequestContactShare"
import { useApproveContactShare } from "../hooks/useApproveContactShare"
import { useRevokeContactShare } from "../hooks/useRevokeContactShare"
import { MessageBubble } from "../components/MessageBubble"
import { FileUpload, UploadingFileList } from "../components/FileUpload"
import { useAuthStore } from "../../auth/store/auth-store"
import type { ContactShareState, ThreadAttachment } from "@fsm/types"

interface UploadingFile {
  file: File
  id: string
  progress: number
  attachmentId?: string
}

export function ThreadDetailPage() {
  const { t } = useTranslation("threads")
  const { threadId = "" } = useParams<{ threadId: string }>()
  const currentUser = useAuthStore((state) => state.user)
  const { data: thread, isLoading, error, addMessageToCache } = useThreadDetail(threadId)
  // SSE 실시간 메시지 수신. dedup / updatedAt 갱신은 addMessageToCache 가 처리.
  useThreadStream(threadId, addMessageToCache)
  const sendMessageMutation = useSendMessage(threadId)
  const markReadMutation = useMarkThreadRead()
  const uploadAttachmentMutation = useUploadAttachment(threadId)
  const requestContactShareMutation = useRequestContactShare(threadId)
  const approveContactShareMutation = useApproveContactShare(threadId)
  const revokeContactShareMutation = useRevokeContactShare(threadId)

  const [messageText, setMessageText] = useState("")
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [pendingAttachments, setPendingAttachments] = useState<ThreadAttachment[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [contactShareError, setContactShareError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMarkedThreadIdRef = useRef<string | null>(null)

  const scrollToBottom = useCallback(() => {
    const target = messagesEndRef.current
    if (target && typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [thread?.messages, scrollToBottom])

  const clearUnreadNotification = useNotificationStore((s) => s.clearUnread)
  useEffect(() => {
    if (lastMarkedThreadIdRef.current !== threadId) {
      lastMarkedThreadIdRef.current = null
    }

    if (threadId && thread && lastMarkedThreadIdRef.current !== threadId) {
      lastMarkedThreadIdRef.current = threadId
      markReadMutation.mutate(threadId)
      // 글로벌 알림 store 의 unread 카운트도 reset (사이드바 뱃지)
      clearUnreadNotification(threadId)
    }
  }, [threadId, thread, markReadMutation, clearUnreadNotification])

  const handleSendMessage = useCallback(() => {
    if (sendMessageMutation.isPending) return

    const trimmedText = messageText.trim()
    const hasAttachments = pendingAttachments.length > 0

    if (!trimmedText && !hasAttachments) return

    setSendError(null)

    sendMessageMutation.mutate(
      {
        body: trimmedText || null,
        attachmentIds: hasAttachments ? pendingAttachments.map((a) => a.attachmentId) : null,
      },
      {
        onSuccess: () => {
          setMessageText("")
          setPendingAttachments([])
          scrollToBottom()
        },
        onError: () => {
          setSendError(t("detail.sendError"))
        },
      },
    )
  }, [messageText, pendingAttachments, sendMessageMutation, scrollToBottom, t])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }
    },
    [handleSendMessage],
  )

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const newUploadingFiles: UploadingFile[] = files.map((file, index) => ({
        file,
        id: `${Date.now()}-${index}`,
        progress: 0,
      }))

      setUploadingFiles((prev) => [...prev, ...newUploadingFiles])

      for (const uploadingFile of newUploadingFiles) {
        uploadAttachmentMutation.mutate(
          {
            file: uploadingFile.file,
            onProgress: (progress) => {
              setUploadingFiles((prev) =>
                prev.map((f) => (f.id === uploadingFile.id ? { ...f, progress } : f)),
              )
            },
          },
          {
            onSuccess: (data) => {
              setPendingAttachments((prev) => [...prev, data])
              setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadingFile.id))
            },
            onError: () => {
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadingFile.id ? { ...f, progress: -1 } : f,
                ),
              )
            },
          },
        )
      }
    },
    [uploadAttachmentMutation],
  )

  const removePendingAttachment = useCallback((attachmentId: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.attachmentId !== attachmentId))
  }, [])

  const removeUploadingFile = useCallback((id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  if (isLoading) {
    return (
      <div className="page">
        <h1>{t("detail.title")}</h1>
        <p className="text-muted">{t("detail.loading")}</p>
      </div>
    )
  }

  if (error || !thread) {
    return (
      <div className="page">
        <h1>{t("detail.title")}</h1>
        <p className="text-danger">{t("detail.loadError")}</p>
        <Link to="/threads" className="btn btn-ghost btn-sm">{t("detail.backToList")}</Link>
      </div>
    )
  }

  const canSend =
    !sendMessageMutation.isPending &&
    (messageText.trim() || pendingAttachments.length > 0) &&
    uploadingFiles.length === 0
  const orderedMessages = [...thread.messages].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  )
  const currentRole = currentUser?.role === "supplier" ? "supplier" : "requester"
  const isRequester = currentRole === "requester"
  const requestedByMe = thread.contactShareRequestedByRole === currentRole
  const canRequestContactShare = thread.contactShareState === "not_requested" || thread.contactShareState === "revoked"
  const canApproveContactShare =
    (thread.contactShareState === "requested" || thread.contactShareState === "one_side_approved") &&
    ((isRequester && !thread.requesterApproved) || (!isRequester && !thread.supplierApproved))
  const canRevokeContactShare =
    (thread.contactShareState === "requested" || thread.contactShareState === "one_side_approved") && requestedByMe
  const isContactActionPending =
    requestContactShareMutation.isPending || approveContactShareMutation.isPending || revokeContactShareMutation.isPending

  const contactShareLabel = (state: ContactShareState) => {
    switch (state) {
      case "requested":
        if (requestedByMe) return t("detail.contactShare.requestedByMe")
        if (canApproveContactShare) return t("detail.contactShare.requestedApprove")
        return t("detail.contactShare.requestedProgress")
      case "one_side_approved":
        if (canApproveContactShare) return t("detail.contactShare.oneSideNeedMine")
        if ((isRequester && thread.requesterApproved) || (!isRequester && thread.supplierApproved)) {
          return t("detail.contactShare.oneSideWaitOther")
        }
        return t("detail.contactShare.oneSideWaitOtherOnly")
      case "mutually_approved":
        return t("detail.contactShare.mutuallyApproved")
      case "revoked":
        return t("detail.contactShare.revoked")
      default:
        return t("detail.contactShare.default")
    }
  }

  const handleRequestContactShare = () => {
    if (!window.confirm(t("detail.requestContactShareConfirm"))) return
    setContactShareError(null)
    requestContactShareMutation.mutate(undefined, {
      onError: () => setContactShareError(t("detail.requestContactShareError")),
    })
  }

  const handleApproveContactShare = () => {
    setContactShareError(null)
    approveContactShareMutation.mutate(undefined, {
      onError: () => setContactShareError(t("detail.approveContactShareError")),
    })
  }

  const handleRevokeContactShare = () => {
    if (!window.confirm(t("detail.revokeContactShareConfirm"))) return
    setContactShareError(null)
    revokeContactShareMutation.mutate(undefined, {
      onError: () => setContactShareError(t("detail.revokeContactShareError")),
    })
  }

  const otherRoleLabel = thread.otherParty.role === "supplier" ? t("detail.roleSupplier") : t("detail.roleRequester")

  return (
    <div className="thread-layout">
      {/* Sub-header */}
      <div className="thread-subheader">
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
        <div className="flex flex-col gap-2">
          <span className="text-base font-semibold">{thread.otherParty.displayName} {t("detail.counterpartSuffix", { role: otherRoleLabel })}</span>
          <span className="text-sm text-accent">{thread.requestTitle}</span>
        </div>
        <div className="flex-1" />
        {canRequestContactShare && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleRequestContactShare} disabled={isContactActionPending}>
            {t("detail.requestContactShare")}
          </button>
        )}
        {canApproveContactShare && (
          <button type="button" className="btn btn-primary btn-sm" onClick={handleApproveContactShare} disabled={isContactActionPending}>
            {t("detail.approveContactShare")}
          </button>
        )}
        {canRevokeContactShare && (
          <button type="button" className="btn btn-danger btn-sm" onClick={handleRevokeContactShare} disabled={isContactActionPending}>
            {t("detail.revokeContactShare")}
          </button>
        )}
      </div>

      {/* Contact share info banner */}
      {(thread.contactShareState !== "not_requested" || thread.sharedContact) && (
        <div className="flex items-center gap-10" style={{ padding: '10px 40px', background: 'var(--info-soft)', fontSize: 13 }}>
          <span>ℹ️</span>
          <span className="text-muted">{contactShareLabel(thread.contactShareState)}</span>
        </div>
      )}

      {thread.sharedContact && (
        <div className="flex gap-16" style={{ padding: '12px 40px', background: 'var(--accent-soft)', fontSize: 13 }}>
          <div className="flex flex-col gap-2">
            <span className="font-semibold">{t("detail.sharedRequester")}</span>
            <span>{thread.sharedContact.requester.name} · {thread.sharedContact.requester.phone || t("detail.noPhone")} · {thread.sharedContact.requester.email || t("detail.noEmail")}</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-semibold">{t("detail.sharedSupplier")}</span>
            <span>{thread.sharedContact.supplier.name} · {thread.sharedContact.supplier.phone || t("detail.noPhone")} · {thread.sharedContact.supplier.email || t("detail.noEmail")}</span>
          </div>
        </div>
      )}

      {contactShareError && (
        <div style={{ padding: '8px 40px', background: 'var(--danger-soft)' }}>
          <p className="text-danger text-sm">{contactShareError}</p>
        </div>
      )}

      {/* Message area */}
      <div className="thread-messages">
        {thread.messages.length === 0 ? (
          <div className="empty-state">
            <p>{t("detail.emptyMessagesTitle")}</p>
            <p className="text-sm">{t("detail.emptyMessagesDescription")}</p>
          </div>
        ) : (
          orderedMessages.map((message) => (
            <MessageBubble key={message.messageId} message={message} onImagePreview={setPreviewImage} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Send error */}
      {sendError && (
        <div style={{ padding: '8px 40px' }}>
          <p className="text-danger text-sm">{sendError}</p>
        </div>
      )}

      {/* Pending attachments */}
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-8" style={{ padding: '8px 40px', background: 'var(--accent-soft)' }}>
          {pendingAttachments.map((attachment) => (
            <div key={attachment.attachmentId} className="flex items-center gap-8 p-8 bg-paper rounded text-sm">
              <span>📎 {attachment.fileName}</span>
              <button className="btn btn-ghost btn-sm" aria-label={t("upload.removeAria")} onClick={() => removePendingAttachment(attachment.attachmentId)}>×</button>
            </div>
          ))}
        </div>
      )}

      <UploadingFileList files={uploadingFiles} onRemove={removeUploadingFile} />

      {/* Compact input bar */}
      <div className="thread-input-bar">
        <FileUpload onFilesSelected={handleFilesSelected} disabled={uploadingFiles.length > 0} />
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("detail.messagePlaceholder")}
        />
        <button
          type="button"
          className={`btn ${canSend ? "btn-primary" : "btn-secondary"}`}
          onClick={handleSendMessage}
          disabled={!canSend}
          style={{ whiteSpace: 'nowrap' }}
        >
          {sendMessageMutation.isPending ? t("detail.sendingButton") : t("detail.sendButton")}
        </button>
      </div>

      {/* Image preview overlay */}
      {previewImage && (
        <div className="image-overlay" onClick={() => setPreviewImage(null)}>
          <img
            src={previewImage}
            alt="Preview"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPreviewImage(null)}
          >
            {t("detail.closePreview")}
          </button>
        </div>
      )}
    </div>
  )
}
