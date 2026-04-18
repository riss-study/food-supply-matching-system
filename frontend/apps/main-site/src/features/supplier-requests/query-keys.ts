type Params = Readonly<Record<string, unknown>>

export const supplierRequestKeys = {
  all: ["supplier-requests"] as const,
  feeds: () => [...supplierRequestKeys.all, "feed"] as const,
  feed: (params: Params) => [...supplierRequestKeys.feeds(), params] as const,
  details: () => [...supplierRequestKeys.all, "detail"] as const,
  detail: (requestId: string) => [...supplierRequestKeys.details(), requestId] as const,
}
