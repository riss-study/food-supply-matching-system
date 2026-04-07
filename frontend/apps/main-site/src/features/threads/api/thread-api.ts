import { getApiBaseUrl } from "@fsm/utils"
import type {
  ApiEnvelope,
  ContactShareActionResponse,
  CreateThreadRequest,
  CreateThreadResponse,
  MarkThreadReadResponse,
  PaginationMeta,
  SendThreadMessageRequest,
  SendThreadMessageResponse,
  ThreadDetail,
  ThreadSummary,
  UploadThreadAttachmentResponse,
} from "@fsm/types"
import { authApiClient } from "../../auth/lib/api-client"

export interface ThreadListParams {
  unreadOnly?: boolean
  page?: number
  size?: number
}

export interface ThreadListResult {
  items: ThreadSummary[]
  meta: PaginationMeta
}

export async function getThreadList(params: ThreadListParams = {}): Promise<ThreadListResult> {
  const response = await authApiClient.get<ApiEnvelope<ThreadSummary[]>>("/api/threads", { params })
  return {
    items: response.data.data,
    meta: (response.data.meta as PaginationMeta | undefined) ?? {},
  }
}

export interface ThreadDetailParams {
  page?: number
  size?: number
}

export async function getThreadDetail(
  threadId: string,
  params: ThreadDetailParams = {},
): Promise<ThreadDetail> {
  const response = await authApiClient.get<ApiEnvelope<ThreadDetail>>(`/api/threads/${threadId}`, {
    params,
  })
  return response.data.data
}

export async function createThread(
  requestId: string,
  request: CreateThreadRequest,
): Promise<CreateThreadResponse> {
  const response = await authApiClient.post<ApiEnvelope<CreateThreadResponse>>(
    `/api/requests/${requestId}/threads`,
    request,
  )
  return response.data.data
}

export async function sendMessage(
  threadId: string,
  request: SendThreadMessageRequest,
): Promise<SendThreadMessageResponse> {
  const response = await authApiClient.post<ApiEnvelope<SendThreadMessageResponse>>(
    `/api/threads/${threadId}/messages`,
    request,
  )
  return response.data.data
}

export async function markThreadAsRead(threadId: string): Promise<MarkThreadReadResponse> {
  const response = await authApiClient.post<ApiEnvelope<MarkThreadReadResponse>>(
    `/api/threads/${threadId}/read`,
  )
  return response.data.data
}

export async function uploadAttachment(
  threadId: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<UploadThreadAttachmentResponse> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await authApiClient.post<ApiEnvelope<UploadThreadAttachmentResponse>>(
    `/api/threads/${threadId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: onProgress
        ? (progressEvent) => {
            const total = progressEvent.total ?? file.size
            const progress = Math.round((progressEvent.loaded * 100) / total)
            onProgress(progress)
          }
        : undefined,
    },
  )
  return response.data.data
}

export async function downloadAttachment(threadId: string, attachmentId: string): Promise<Blob> {
  const response = await authApiClient.get<Blob>(`/api/threads/${threadId}/attachments/${attachmentId}`, {
    responseType: "blob",
  })
  return response.data
}

export async function requestContactShare(threadId: string): Promise<ContactShareActionResponse> {
  const response = await authApiClient.post<ApiEnvelope<ContactShareActionResponse>>(
    `/api/threads/${threadId}/contact-share/request`,
  )
  return response.data.data
}

export async function approveContactShare(threadId: string): Promise<ContactShareActionResponse> {
  const response = await authApiClient.post<ApiEnvelope<ContactShareActionResponse>>(
    `/api/threads/${threadId}/contact-share/approve`,
  )
  return response.data.data
}

export async function revokeContactShare(threadId: string): Promise<ContactShareActionResponse> {
  const response = await authApiClient.post<ApiEnvelope<ContactShareActionResponse>>(
    `/api/threads/${threadId}/contact-share/revoke`,
  )
  return response.data.data
}

export function getAttachmentUrl(threadId: string, attachmentId: string): string {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/api/threads/${threadId}/attachments/${attachmentId}`
}

export function isImageAttachment(contentType: string): boolean {
  return contentType.startsWith("image/")
}

export function isPreviewableImage(contentType: string): boolean {
  return ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(contentType)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export const ALLOWED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
]

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024

export function validateAttachment(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "지원하지 않는 파일 형식입니다. (JPEG, PNG, GIF, PDF만 가능)",
    }
  }
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return {
      valid: false,
      error: "파일 크기는 10MB를 초과할 수 없습니다.",
    }
  }
  return { valid: true }
}
