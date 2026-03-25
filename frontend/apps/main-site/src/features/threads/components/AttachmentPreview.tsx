import { useEffect, useMemo, useState } from "react"
import type { ThreadAttachment } from "@fsm/types"
import { downloadAttachment, formatFileSize, isPreviewableImage } from "../api/thread-api"

interface AttachmentPreviewProps {
  attachment: ThreadAttachment
  onPreview?: (url: string) => void
}

export function AttachmentPreview({ attachment, onPreview }: AttachmentPreviewProps) {
  const isImage = isPreviewableImage(attachment.contentType)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const attachmentRef = useMemo(() => {
    const match = attachment.url.match(/\/threads\/([^/]+)\/attachments\/([^/]+)/)
    if (!match) {
      return null
    }

    return {
      threadId: decodeURIComponent(match[1]),
      attachmentId: decodeURIComponent(match[2]),
    }
  }, [attachment.url])

  useEffect(() => {
    let revokedUrl: string | null = null

    if (!isImage || !attachmentRef) {
      setObjectUrl(null)
      return
    }

    let cancelled = false
    downloadAttachment(attachmentRef.threadId, attachmentRef.attachmentId)
      .then((blob) => {
        if (cancelled) {
          return
        }

        revokedUrl = URL.createObjectURL(blob)
        setObjectUrl(revokedUrl)
      })
      .catch(() => {
        if (!cancelled) {
          setObjectUrl(null)
        }
      })

    return () => {
      cancelled = true
      if (revokedUrl && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(revokedUrl)
      }
    }
  }, [attachmentRef, isImage])

  const handleClick = () => {
    if (isImage && onPreview && objectUrl) {
      onPreview(objectUrl)
    }
  }

  const handleDownload = async () => {
    if (!attachmentRef) {
      return
    }

    setIsDownloading(true)
    try {
      const blob = await downloadAttachment(attachmentRef.threadId, attachmentRef.attachmentId)
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = attachment.fileName
      link.click()
      if (typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(blobUrl)
      }
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem",
        backgroundColor: "#f8fafc",
        borderRadius: "0.5rem",
        border: "1px solid #e2e8f0",
        cursor: isImage ? "pointer" : "default",
      }}
      onClick={handleClick}
      role={isImage ? "button" : undefined}
      tabIndex={isImage ? 0 : undefined}
      onKeyDown={
        isImage
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleClick()
              }
            }
          : undefined
      }
    >
      {isImage ? (
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "0.375rem",
            overflow: "hidden",
            backgroundColor: "#e2e8f0",
            flexShrink: 0,
          }}
        >
          <img
            src={objectUrl ?? ""}
            alt={attachment.fileName}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "0.375rem",
            backgroundColor: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#dc2626",
          }}
        >
          PDF
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "#1e293b",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={attachment.fileName}
        >
          {attachment.fileName}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
          {formatFileSize(attachment.fileSize)}
        </div>
      </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            void handleDownload()
          }}
          disabled={isDownloading || !attachmentRef}
          style={{
            padding: "0.375rem 0.75rem",
            fontSize: "0.75rem",
            backgroundColor: "white",
            border: "1px solid #cbd5e1",
            borderRadius: "0.375rem",
            cursor: isDownloading || !attachmentRef ? "not-allowed" : "pointer",
            color: "#475569",
          }}
        >
          {isDownloading ? "준비 중..." : "다운로드"}
        </button>
    </div>
  )
}
