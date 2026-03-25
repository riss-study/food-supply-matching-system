import type { ThreadMessage } from "@fsm/types"
import { AttachmentPreview } from "./AttachmentPreview"
import { useAuthStore } from "../../auth/store/auth-store"

interface MessageBubbleProps {
  message: ThreadMessage
  onImagePreview?: (url: string) => void
}

export function MessageBubble({ message, onImagePreview }: MessageBubbleProps) {
  const currentUser = useAuthStore((state) => state.user)
  const isMine = currentUser?.userId === message.senderUserId

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMine ? "flex-end" : "flex-start",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          display: "flex",
          flexDirection: isMine ? "row-reverse" : "row",
          alignItems: "flex-end",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: isMine ? "#2563eb" : "white",
            color: isMine ? "white" : "#1e293b",
            borderRadius: isMine ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            border: isMine ? "none" : "1px solid #e2e8f0",
          }}
        >
          {message.body && (
            <p
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: 1.5,
              }}
            >
              {message.body}
            </p>
          )}

          {message.attachments.length > 0 && (
            <div
              style={{
                marginTop: message.body ? "0.75rem" : 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {message.attachments.map((attachment) => (
                <AttachmentPreview
                  key={attachment.attachmentId}
                  attachment={attachment}
                  onPreview={onImagePreview}
                />
              ))}
            </div>
          )}
        </div>

        <span
          style={{
            fontSize: "0.7rem",
            color: "#94a3b8",
            whiteSpace: "nowrap",
          }}
        >
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  )
}
