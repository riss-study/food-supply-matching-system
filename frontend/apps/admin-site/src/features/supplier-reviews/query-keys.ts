type Params = Readonly<Record<string, unknown>>

export const supplierReviewKeys = {
  all: ["admin", "supplier-reviews"] as const,
  lists: () => [...supplierReviewKeys.all, "list"] as const,
  list: (params: Params) => [...supplierReviewKeys.lists(), params] as const,
}
