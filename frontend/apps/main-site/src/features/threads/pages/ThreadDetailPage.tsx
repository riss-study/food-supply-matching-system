import { useEffect, useRef, useState, useCallback } from "react"
import { Link, useParams } from "react-router-dom"
import { useThreadDetail } from "../hooks/useThreadDetail"
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
  const { threadId = "" } = useParams<{ threadId: string }>()
  const currentUser = useAuthStore((state) => state.user)
  const { data: thread, isLoading, error } = useThreadDetail(threadId)
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

  useEffect(() => {
    if (lastMarkedThreadIdRef.current !== threadId) {
      lastMarkedThreadIdRef.current = null
    }

    if (threadId && thread && lastMarkedThreadIdRef.current !== threadId) {
      lastMarkedThreadIdRef.current = threadId
      markReadMutation.mutate(threadId)
    }
  }, [threadId, thread, markReadMutation])

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
          setSendError("메시지 전송에 실패했습니다. 다시 시도해주세요.")
        },
      },
    )
  }, [messageText, pendingAttachments, sendMessageMutation, scrollToBottom])

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
        <h1>대화</h1>
        <p className="text-muted">로딩 중...</p>
      </div>
    )
  }

  if (error || !thread) {
    return (
      <div className="page">
        <h1>대화</h1>
        <p className="text-danger">대화 정보를 불러오지 못했습니다.</p>
        <Link to="/threads" className="btn btn-ghost btn-sm">메시지 목록으로 돌아가기</Link>
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
        if (requestedByMe) return "연락처 공유 요청을 보냈습니다"
        if (canApproveContactShare) return "상대방이 연락처 공유를 요청했습니다. 승인하면 연락처 공개 절차가 시작됩니다"
        return "연락처 공유 요청이 진행 중입니다"
      case "one_side_approved":
        if (canApproveContactShare) return "상대방의 승인까지 완료되었습니다. 내 최종 승인이 필요합니다"
        if ((isRequester && thread.requesterApproved) || (!isRequester && thread.supplierApproved)) {
          return "내 승인이 완료되었습니다. 상대방의 최종 승인을 기다리는 중입니다"
        }
        return "상대방의 최종 승인을 기다리는 중입니다"
      case "mutually_approved":
        return "양측 승인이 완료되어 연락처가 공개되었습니다"
      case "revoked":
        return "이전 연락처 공유 요청이 철회되었습니다"
      default:
        return "연락처는 양측 승인 후에만 공개됩니다"
    }
  }

  const handleRequestContactShare = () => {
    if (!window.confirm("연락처 공유를 요청할까요? 상대방이 추가 승인해야 공개됩니다.")) return
    setContactShareError(null)
    requestContactShareMutation.mutate(undefined, {
      onError: () => setContactShareError("연락처 공유 요청에 실패했습니다."),
    })
  }

  const handleApproveContactShare = () => {
    setContactShareError(null)
    approveContactShareMutation.mutate(undefined, {
      onError: () => setContactShareError("연락처 공유 승인에 실패했습니다."),
    })
  }

  const handleRevokeContactShare = () => {
    if (!window.confirm("연락처 공유 요청을 철회할까요?")) return
    setContactShareError(null)
    revokeContactShareMutation.mutate(undefined, {
      onError: () => setContactShareError("연락처 공유 철회에 실패했습니다."),
    })
  }

  return (
    <div className="thread-layout">
      {/* Sub-header */}
      <div className="thread-subheader">
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
        <div className="flex flex-col gap-2">
          <span style={{ fontSize: 14, fontWeight: 600 }}>{thread.otherParty.displayName} ({thread.otherParty.role === "supplier" ? "공급자" : "의뢰자"})</span>
          <span style={{ fontSize: 12, color: 'var(--accent)' }}>{thread.requestTitle}</span>
        </div>
        <div style={{ flex: 1 }} />
        {canRequestContactShare && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleRequestContactShare} disabled={isContactActionPending}>
            연락처 공유 요청
          </button>
        )}
        {canApproveContactShare && (
          <button type="button" className="btn btn-primary btn-sm" onClick={handleApproveContactShare} disabled={isContactActionPending}>
            연락처 공유 승인
          </button>
        )}
        {canRevokeContactShare && (
          <button type="button" className="btn btn-danger btn-sm" onClick={handleRevokeContactShare} disabled={isContactActionPending}>
            요청 철회
          </button>
        )}
      </div>

      {/* Contact share info banner */}
      {(thread.contactShareState !== "not_requested" || thread.sharedContact) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 40px', background: 'var(--info-soft)', fontSize: 13 }}>
          <span>ℹ️</span>
          <span className="text-muted">{contactShareLabel(thread.contactShareState)}</span>
        </div>
      )}

      {thread.sharedContact && (
        <div style={{ display: 'flex', gap: 16, padding: '12px 40px', background: 'var(--accent-soft)', fontSize: 13 }}>
          <div className="flex flex-col gap-2">
            <span className="font-semibold">요청자</span>
            <span>{thread.sharedContact.requester.name} · {thread.sharedContact.requester.phone || "전화번호 미입력"} · {thread.sharedContact.requester.email || "이메일 미입력"}</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-semibold">공급자</span>
            <span>{thread.sharedContact.supplier.name} · {thread.sharedContact.supplier.phone || "전화번호 미입력"} · {thread.sharedContact.supplier.email || "이메일 미입력"}</span>
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
            <p>아직 메시지가 없습니다.</p>
            <p className="text-sm">첫 메시지를 보내보세요!</p>
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 40px', background: 'var(--accent-soft)' }}>
          {pendingAttachments.map((attachment) => (
            <div key={attachment.attachmentId} className="flex items-center gap-8 p-8 bg-paper rounded text-sm">
              <span>📎 {attachment.fileName}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => removePendingAttachment(attachment.attachmentId)}>×</button>
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
          placeholder="메시지를 입력하세요..."
        />
        <button
          type="button"
          className={`btn ${canSend ? "btn-primary" : "btn-secondary"}`}
          onClick={handleSendMessage}
          disabled={!canSend}
          style={{ whiteSpace: 'nowrap' }}
        >
          {sendMessageMutation.isPending ? "전송 중..." : "전송"}
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
            닫기
          </button>
        </div>
      )}
    </div>
  )
}
