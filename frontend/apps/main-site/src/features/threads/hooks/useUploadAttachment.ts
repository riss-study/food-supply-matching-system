import { useMutation } from "@tanstack/react-query"
import type { UploadThreadAttachmentResponse } from "@fsm/types"
import { uploadAttachment } from "../api/thread-api"

export function useUploadAttachment(threadId: string) {
  return useMutation<
    UploadThreadAttachmentResponse,
    Error,
    { file: File; onProgress?: (progress: number) => void }
  >({
    mutationFn: ({ file, onProgress }) => uploadAttachment(threadId, file, onProgress),
  })
}
