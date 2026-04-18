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
    <div className="flex mb-12" style={{ justifyContent: isMine ? "flex-end" : "flex-start" }}>
      <div className="flex items-end gap-8" style={{ maxWidth: "70%", flexDirection: isMine ? "row-reverse" : "row" }}>
        <div className={`msg-bubble ${isMine ? "msg-mine" : "msg-theirs"}`}>
          {message.body && (
            <p style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.5 }}>
              {message.body}
            </p>
          )}
          {message.attachments.length > 0 && (
            <div className="flex flex-col gap-8" style={{ marginTop: message.body ? 12 : 0 }}>
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
        <span className="msg-meta">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  )
}
