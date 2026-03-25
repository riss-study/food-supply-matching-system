import type {
  ApiEnvelope,
  PaginationMeta,
  PublicNoticeDetail,
  PublicNoticeSummary,
} from "@fsm/types"
import { authApiClient } from "../../auth/lib/api-client"

export interface GetPublicNoticesParams {
  page?: number
  size?: number
}

export async function getPublicNotices(params: GetPublicNoticesParams = {}) {
  const response = await authApiClient.get<ApiEnvelope<PublicNoticeSummary[]>>("/api/notices", {
    params: {
      page: params.page,
      size: params.size,
    },
  })
  return {
    items: response.data.data,
    meta: response.data.meta as PaginationMeta | undefined,
  }
}

export async function getPublicNoticeDetail(noticeId: string): Promise<PublicNoticeDetail> {
  const response = await authApiClient.get<ApiEnvelope<PublicNoticeDetail>>(`/api/notices/${noticeId}`)
  return response.data.data
}
