type Params = Readonly<Record<string, unknown>>

export const discoveryKeys = {
  all: ["discovery"] as const,
  categories: () => [...discoveryKeys.all, "categories"] as const,
  regions: () => [...discoveryKeys.all, "regions"] as const,
  supplierLists: () => [...discoveryKeys.all, "supplier-list"] as const,
  supplierList: (params: Params) => [...discoveryKeys.supplierLists(), params] as const,
  supplierDetails: () => [...discoveryKeys.all, "supplier-detail"] as const,
  supplierDetail: (profileId: string) => [...discoveryKeys.supplierDetails(), profileId] as const,
}
