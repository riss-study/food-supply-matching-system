type Params = Readonly<Record<string, unknown>>

export const quoteKeys = {
  all: ["quotes"] as const,
  lists: () => [...quoteKeys.all, "list"] as const,
  listsByRequest: (requestId: string) => [...quoteKeys.lists(), requestId] as const,
  list: (requestId: string, params: Params) => [...quoteKeys.listsByRequest(requestId), params] as const,
}
