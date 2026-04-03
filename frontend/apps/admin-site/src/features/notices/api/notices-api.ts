import type {
  ApiEnvelope,
  ArchiveNoticeResponse,
  CreateNoticeRequest,
  CreateNoticeResponse,
  NoticeDetail,
  NoticeSummary,
  PaginationMeta,
  PublishNoticeResponse,
  UpdateNoticeRequest,
  UpdateNoticeResponse,
} from "@fsm/types"
import { adminApiClient } from "../../auth/lib/api-client"

export interface GetNoticesParams {
  state?: string
  page?: number
  size?: number
  sort?: string
  order?: "asc" | "desc"
}

export async function getNotices(params: GetNoticesParams = {}) {
  const response = await adminApiClient.get<ApiEnvelope<NoticeSummary[]>>("/api/admin/notices", {
    params: {
      state: params.state,
      page: params.page,
      size: params.size,
      sort: params.sort,
      order: params.order,
    },
  })
  return {
    items: response.data.data,
    meta: response.data.meta as PaginationMeta | undefined,
  }
}

export async function getNoticeDetail(noticeId: string): Promise<NoticeDetail> {
  const response = await adminApiClient.get<ApiEnvelope<NoticeDetail>>(`/api/admin/notices/${noticeId}`)
  return response.data.data
}

export async function createNotice(request: CreateNoticeRequest): Promise<CreateNoticeResponse> {
  const response = await adminApiClient.post<ApiEnvelope<CreateNoticeResponse>>("/api/admin/notices", request)
  return response.data.data
}

export async function updateNotice(
  noticeId: string,
  request: UpdateNoticeRequest,
): Promise<UpdateNoticeResponse> {
  const response = await adminApiClient.patch<ApiEnvelope<UpdateNoticeResponse>>(`/api/admin/notices/${noticeId}`, request)
  return response.data.data
}

export async function publishNotice(noticeId: string): Promise<PublishNoticeResponse> {
  const response = await adminApiClient.patch<ApiEnvelope<UpdateNoticeResponse>>(
    `/api/admin/notices/${noticeId}`,
    { state: "published" },
  )
  return {
    noticeId: response.data.data.noticeId,
    state: response.data.data.state,
    publishedAt: response.data.data.publishedAt ?? response.data.data.updatedAt,
  }
}

export async function uploadNoticeAttachment(noticeId: string, file: File): Promise<{ attachmentId: string; fileName: string; url: string }> {
  const formData = new FormData()
  formData.append("file", file)
  const response = await adminApiClient.post<ApiEnvelope<{ attachmentId: string; fileName: string; url: string }>>(
    `/api/admin/notices/${noticeId}/attachments`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  )
  return response.data.data
}

export async function archiveNotice(noticeId: string): Promise<ArchiveNoticeResponse> {
  const response = await adminApiClient.patch<ApiEnvelope<UpdateNoticeResponse>>(
    `/api/admin/notices/${noticeId}`,
    { state: "archived" },
  )
  return {
    noticeId: response.data.data.noticeId,
    state: response.data.data.state,
    archivedAt: response.data.data.updatedAt,
  }
}
