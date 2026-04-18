type Params = Readonly<Record<string, unknown>>

export const supplierQuoteKeys = {
  all: ["supplier-quotes"] as const,
  lists: () => [...supplierQuoteKeys.all, "list"] as const,
  list: (params: Params) => [...supplierQuoteKeys.lists(), params] as const,
}
