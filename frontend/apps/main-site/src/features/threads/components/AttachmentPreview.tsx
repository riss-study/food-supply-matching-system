import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { ThreadAttachment } from "@fsm/types"
import { downloadAttachment, formatFileSize, isPreviewableImage } from "../api/thread-api"

interface AttachmentPreviewProps {
  attachment: ThreadAttachment
  onPreview?: (url: string) => void
}

export function AttachmentPreview({ attachment, onPreview }: AttachmentPreviewProps) {
  const { t } = useTranslation("threads")
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
      className="flex items-center gap-12 p-12"
      style={{
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
            className="w-full h-full"
            style={{
              objectFit: "cover",
            }}
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-center text-sm font-semibold"
          style={{
            width: 48,
            height: 48,
            borderRadius: 6,
            backgroundColor: "var(--danger-soft)",
            flexShrink: 0,
            color: "var(--danger)",
          }}
        >
          PDF
        </div>
      )}

      <div className="flex-1" style={{ minWidth: 0 }}>
        <div
          className="text-base font-medium"
          style={{
            color: "var(--ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={attachment.fileName}
        >
          {attachment.fileName}
        </div>
        <div className="text-sm text-muted mt-4">
          {formatFileSize(attachment.fileSize)}
        </div>
      </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            void handleDownload()
          }}
          disabled={isDownloading || !attachmentRef}
          className="text-sm text-muted"
          style={{
            padding: "6px 12px",
            backgroundColor: "var(--paper)",
            border: "1px solid var(--line-strong)",
            borderRadius: 6,
            cursor: isDownloading || !attachmentRef ? "not-allowed" : "pointer",
          }}
        >
          {isDownloading ? t("attachment.downloading") : t("attachment.download")}
        </button>
    </div>
  )
}
