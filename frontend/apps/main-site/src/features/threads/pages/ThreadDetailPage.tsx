import { useEffect, useRef, useState, useCallback } from "react"
import { Link, useParams } from "react-router-dom"
import { useThreadDetail } from "../hooks/useThreadDetail"
import { useSendMessage } from "../hooks/useSendMessage"
import { useMarkThreadRead } from "../hooks/useMarkThreadRead"
import { useUploadAttachment } from "../hooks/useUploadAttachment"
import { MessageBubble } from "../components/MessageBubble"
import { FileUpload, UploadingFileList } from "../components/FileUpload"
import type { ThreadAttachment } from "@fsm/types"

interface UploadingFile {
  file: File
  id: string
  progress: number
  attachmentId?: string
}

export function ThreadDetailPage() {
  const { threadId = "" } = useParams<{ threadId: string }>()
  const { data: thread, isLoading, error } = useThreadDetail(threadId)
  const sendMessageMutation = useSendMessage(threadId)
  const markReadMutation = useMarkThreadRead()
  const uploadAttachmentMutation = useUploadAttachment(threadId)

  const [messageText, setMessageText] = useState("")
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [pendingAttachments, setPendingAttachments] = useState<ThreadAttachment[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
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
      <section>
        <h1>대화</h1>
        <p>로딩 중...</p>
      </section>
    )
  }

  if (error || !thread) {
    return (
      <section>
        <h1>대화</h1>
        <p style={{ color: "#dc2626" }}>대화 정보를 불러오지 못했습니다.</p>
        <Link to="/threads" style={{ color: "#2563eb" }}>
          메시지 목록으로 돌아가기
        </Link>
      </section>
    )
  }

  const canSend =
    !sendMessageMutation.isPending &&
    (messageText.trim() || pendingAttachments.length > 0) &&
    uploadingFiles.length === 0
  const orderedMessages = [...thread.messages].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  )

  return (
    <section style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)" }}>
      <div style={{ marginBottom: "1rem", flexShrink: 0 }}>
        <Link
          to="/threads"
          style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.875rem" }}
        >
          ← 메시지 목록으로 돌아가기
        </Link>
      </div>

      <div
        style={{
          padding: "1rem 1.25rem",
          backgroundColor: "white",
          borderRadius: "0.75rem",
          border: "1px solid #e2e8f0",
          marginBottom: "1rem",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <span
            style={{
              fontSize: "0.75rem",
              padding: "0.125rem 0.5rem",
              backgroundColor: thread.otherParty.role === "supplier" ? "#dbeafe" : "#fce7f3",
              color: thread.otherParty.role === "supplier" ? "#1e40af" : "#9d174d",
              borderRadius: "9999px",
              fontWeight: 600,
            }}
          >
            {thread.otherParty.role === "supplier" ? "공급자" : "의뢰자"}
          </span>
          <span style={{ fontWeight: 600, color: "#1e293b" }}>{thread.otherParty.displayName}</span>
        </div>
        <div style={{ fontSize: "0.875rem", color: "#64748b" }}>의뢰: {thread.requestTitle}</div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          backgroundColor: "#f8fafc",
          borderRadius: "0.75rem",
          border: "1px solid #e2e8f0",
          marginBottom: "1rem",
        }}
      >
        {thread.messages.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#94a3b8",
              textAlign: "center",
            }}
          >
            <p>
              아직 메시지가 없습니다.
              <br />
              첫 메시지를 보내보세요!
            </p>
          </div>
        ) : (
          orderedMessages.map((message) => (
            <MessageBubble key={message.messageId} message={message} onImagePreview={setPreviewImage} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {sendError && (
        <div
          style={{
            padding: "0.75rem",
            backgroundColor: "#fee2e2",
            borderRadius: "0.5rem",
            color: "#dc2626",
            marginBottom: "1rem",
            fontSize: "0.875rem",
          }}
        >
          {sendError}
        </div>
      )}

      {pendingAttachments.length > 0 && (
        <div
          style={{
            padding: "0.75rem",
            backgroundColor: "#f0fdf4",
            borderRadius: "0.5rem",
            border: "1px solid #bbf7d0",
            marginBottom: "1rem",
          }}
        >
          <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "#166534", marginBottom: "0.5rem" }}>
            첨부 예정 파일 ({pendingAttachments.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {pendingAttachments.map((attachment) => (
              <div
                key={attachment.attachmentId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "white",
                  borderRadius: "0.375rem",
                  fontSize: "0.75rem",
                }}
              >
                <span>📎 {attachment.fileName}</span>
                <button
                  onClick={() => removePendingAttachment(attachment.attachmentId)}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    padding: 0,
                    fontSize: "1rem",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <UploadingFileList files={uploadingFiles} onRemove={removeUploadingFile} />

      <div style={{ flexShrink: 0 }}>
        <FileUpload onFilesSelected={handleFilesSelected} disabled={uploadingFiles.length > 0} />

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
          <textarea
            ref={messageInputRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요... (Enter로 전송, Shift+Enter로 줄바꿈)"
            rows={3}
            style={{
              flex: 1,
              padding: "0.75rem",
              border: "1px solid #cbd5e1",
              borderRadius: "0.5rem",
              resize: "none",
              fontSize: "0.875rem",
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!canSend}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: canSend ? "#2563eb" : "#cbd5e1",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: canSend ? "pointer" : "not-allowed",
              fontWeight: 600,
              fontSize: "0.875rem",
              whiteSpace: "nowrap",
            }}
          >
            {sendMessageMutation.isPending ? "전송 중..." : "전송"}
          </button>
        </div>
      </div>

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            cursor: "pointer",
          }}
        >
          <img
            src={previewImage}
            alt="Preview"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
              borderRadius: "0.5rem",
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setPreviewImage(null)}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            닫기
          </button>
        </div>
      )}
    </section>
  )
}
