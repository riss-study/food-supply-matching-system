type Params = Readonly<Record<string, unknown>>

export const adminNoticeKeys = {
  all: ["admin-notices"] as const,
  lists: () => [...adminNoticeKeys.all, "list"] as const,
  list: (params: Params) => [...adminNoticeKeys.lists(), params] as const,
  details: () => [...adminNoticeKeys.all, "detail"] as const,
  detail: (noticeId: string) => [...adminNoticeKeys.details(), noticeId] as const,
}
