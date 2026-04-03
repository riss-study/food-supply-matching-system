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
        gap: 12,
        padding: 12,
        backgroundColor: "var(--panel)",
        borderRadius: 8,
        border: "1px solid var(--line)",
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
            width: 48,
            height: 48,
            borderRadius: 6,
            overflow: "hidden",
            backgroundColor: "var(--line)",
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
            width: 48,
            height: 48,
            borderRadius: 6,
            backgroundColor: "var(--danger-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--danger)",
          }}
        >
          PDF
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={attachment.fileName}
        >
          {attachment.fileName}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
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
            padding: "6px 12px",
            fontSize: 12,
            backgroundColor: "var(--paper)",
            border: "1px solid var(--line-strong)",
            borderRadius: 6,
            cursor: isDownloading || !attachmentRef ? "not-allowed" : "pointer",
            color: "var(--muted)",
          }}
        >
          {isDownloading ? "준비 중..." : "다운로드"}
        </button>
    </div>
  )
}
