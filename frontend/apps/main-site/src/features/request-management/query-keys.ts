type Params = Readonly<Record<string, unknown>>

export const requestKeys = {
  all: ["requests"] as const,
  lists: () => [...requestKeys.all, "list"] as const,
  list: (params: Params) => [...requestKeys.lists(), params] as const,
  details: () => [...requestKeys.all, "detail"] as const,
  detail: (requestId: string) => [...requestKeys.details(), requestId] as const,
}
