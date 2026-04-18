type Params = Readonly<Record<string, unknown>>

export const threadKeys = {
  all: ["threads"] as const,
  lists: () => [...threadKeys.all, "list"] as const,
  list: (params: Params) => [...threadKeys.lists(), params] as const,
  details: () => [...threadKeys.all, "detail"] as const,
  detail: (threadId: string) => [...threadKeys.details(), threadId] as const,
  detailWith: (threadId: string, params: Params) => [...threadKeys.detail(threadId), params] as const,
}
