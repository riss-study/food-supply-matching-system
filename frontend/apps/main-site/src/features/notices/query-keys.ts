type Params = Readonly<Record<string, unknown>>

export const publicNoticeKeys = {
  all: ["public-notices"] as const,
  lists: () => [...publicNoticeKeys.all, "list"] as const,
  list: (params: Params) => [...publicNoticeKeys.lists(), params] as const,
  details: () => [...publicNoticeKeys.all, "detail"] as const,
  detail: (noticeId: string) => [...publicNoticeKeys.details(), noticeId] as const,
}
