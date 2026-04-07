import { useState, useEffect, useRef } from "react"
import type { CreateNoticeRequest, NoticeDetail, NoticeAttachment, UpdateNoticeRequest } from "@fsm/types"

interface NoticeCreateEditModalProps {
  isOpen: boolean
  notice?: NoticeDetail | null
  onClose: () => void
  onSubmit: (data: CreateNoticeRequest | UpdateNoticeRequest, newFiles?: File[], removedAttachmentIds?: string[]) => void
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
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditMode = !!notice
  const isDraft = notice?.state === "draft"
  const isPublished = notice?.state === "published"

  const existingAttachments: NoticeAttachment[] = (notice?.attachments ?? []).filter(
    (a) => !removedAttachmentIds.includes(a.attachmentId),
  )

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
    setNewFiles([])
    setRemovedAttachmentIds([])
  }, [notice, isOpen])

  if (!isOpen) return null

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const selected = Array.from(files)
      setNewFiles((prev) => [...prev, ...selected])
    }
    // Reset input so the same file can be selected again if removed
    // Use setTimeout to avoid clearing files reference during the same event
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }, 0)
  }

  const handleRemoveNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingAttachment = (attachmentId: string) => {
    setRemovedAttachmentIds((prev) => [...prev, attachmentId])
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const files = newFiles.length > 0 ? newFiles : undefined
    const removed = removedAttachmentIds.length > 0 ? removedAttachmentIds : undefined
    if (isEditMode) {
      onSubmit({ title, body }, files, removed)
    } else {
      onSubmit({ title, body, publishImmediately }, files, removed)
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
    backgroundColor: "var(--paper)",
    padding: 32,
    borderRadius: 12,
    width: "90%",
    maxWidth: 800,
    maxHeight: "90vh",
    overflow: "auto",
  }

  const formGroupStyle: React.CSSProperties = {
    marginBottom: 16,
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 8,
    fontWeight: 600,
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid var(--line)",
    borderRadius: 10,
    fontSize: 14,
    background: "var(--white)",
  }

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: 200,
    resize: "vertical",
  }

  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    marginTop: 24,
  }

  const buttonStyle: React.CSSProperties = {
    padding: "8px 16px",
    borderRadius: 10,
    border: "1px solid var(--line-strong)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
  }

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "var(--accent)",
    color: "var(--white)",
    borderColor: "var(--accent)",
  }

  const dangerButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "var(--danger)",
    color: "var(--white)",
    borderColor: "var(--danger)",
  }

  const successButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "var(--success)",
    color: "var(--white)",
    borderColor: "var(--success)",
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
            <small style={{ color: "var(--muted)" }}>5-200자 이내</small>
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
            <small style={{ color: "var(--muted)" }}>10-5000자 이내</small>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>첨부파일</label>

            {existingAttachments.length > 0 && (
              <ul className="file-list">
                {existingAttachments.map((attachment) => (
                  <li key={attachment.attachmentId} className="file-list-item">
                    <a href={`${import.meta.env.VITE_ADMIN_API_BASE_URL ?? "http://localhost:8081"}${attachment.url}`} target="_blank" rel="noopener noreferrer">
                      {attachment.fileName}
                    </a>
                    <span className="file-size">({formatFileSize(attachment.fileSize)})</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleRemoveExistingAttachment(attachment.attachmentId)}
                      disabled={isSubmitting}
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {newFiles.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: "var(--success)", fontWeight: 500, marginBottom: 8 }}>새 파일 ({newFiles.length}개)</p>
                <ul className="file-list" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "0 12px" }}>
                  {newFiles.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="file-list-item">
                      <span>{file.name} ({formatFileSize(file.size)})</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleRemoveNewFile(index)}
                        disabled={isSubmitting}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFilesSelected}
              disabled={isSubmitting}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              파일 선택
            </button>
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

            {isEditMode && (isDraft || notice?.state === "archived") && onPublish && (
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
