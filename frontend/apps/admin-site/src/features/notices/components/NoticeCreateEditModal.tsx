import { useState, useEffect } from "react"
import type { CreateNoticeRequest, NoticeDetail, UpdateNoticeRequest } from "@fsm/types"

interface NoticeCreateEditModalProps {
  isOpen: boolean
  notice?: NoticeDetail | null
  onClose: () => void
  onSubmit: (data: CreateNoticeRequest | UpdateNoticeRequest) => void
  onPublish?: () => void
  onArchive?: () => void
  isSubmitting?: boolean
}

export function NoticeCreateEditModal({
  isOpen,
  notice,
  onClose,
  onSubmit,
  onPublish,
  onArchive,
  isSubmitting,
}: NoticeCreateEditModalProps) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [publishImmediately, setPublishImmediately] = useState(false)

  const isEditMode = !!notice
  const isDraft = notice?.state === "draft"
  const isPublished = notice?.state === "published"

  useEffect(() => {
    if (notice) {
      setTitle(notice.title)
      setBody(notice.body)
      setPublishImmediately(false)
    } else {
      setTitle("")
      setBody("")
      setPublishImmediately(false)
    }
  }, [notice, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditMode) {
      onSubmit({ title, body })
    } else {
      onSubmit({ title, body, publishImmediately })
    }
  }

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  }

  const modalStyle: React.CSSProperties = {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "800px",
    maxHeight: "90vh",
    overflow: "auto",
  }

  const formGroupStyle: React.CSSProperties = {
    marginBottom: "1rem",
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: 600,
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "1rem",
  }

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: "200px",
    resize: "vertical",
  }

  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "flex-end",
    marginTop: "1.5rem",
  }

  const buttonStyle: React.CSSProperties = {
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    border: "1px solid #d1d5db",
    cursor: "pointer",
  }

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "#3b82f6",
    color: "white",
    borderColor: "#3b82f6",
  }

  const dangerButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "#ef4444",
    color: "white",
    borderColor: "#ef4444",
  }

  const successButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "#10b981",
    color: "white",
    borderColor: "#10b981",
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2>{isEditMode ? "공지 편집" : "새 공지 작성"}</h2>

        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              제목
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
                required
                minLength={5}
                maxLength={200}
                disabled={isSubmitting}
              />
            </label>
            <small style={{ color: "#6b7280" }}>5-200자 이내</small>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>
              내용
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={textareaStyle}
                required
                minLength={10}
                maxLength={5000}
                disabled={isSubmitting}
              />
            </label>
            <small style={{ color: "#6b7280" }}>10-5000자 이내</small>
          </div>

          {!isEditMode && (
            <div style={formGroupStyle}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={publishImmediately}
                  onChange={(e) => setPublishImmediately(e.target.checked)}
                  disabled={isSubmitting}
                />
                즉시 게시
              </label>
            </div>
          )}

          <div style={buttonGroupStyle}>
            <button type="button" onClick={onClose} style={buttonStyle} disabled={isSubmitting}>
              취소
            </button>

            {isEditMode && isDraft && onPublish && (
              <button
                type="button"
                onClick={onPublish}
                style={successButtonStyle}
                disabled={isSubmitting}
              >
                게시하기
              </button>
            )}

            {isEditMode && isPublished && onArchive && (
              <button
                type="button"
                onClick={onArchive}
                style={dangerButtonStyle}
                disabled={isSubmitting}
              >
                보관하기
              </button>
            )}

            <button type="submit" style={primaryButtonStyle} disabled={isSubmitting}>
              {isSubmitting ? "저장 중..." : isEditMode ? "저장" : "작성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
