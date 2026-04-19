export const reviewKeys = {
  all: ["reviews"] as const,
  eligibility: (requestId: string, supplierId: string) =>
    [...reviewKeys.all, "eligibility", requestId, supplierId] as const,
  supplierReviews: (supplierId: string) => [...reviewKeys.all, "supplier", supplierId] as const,
  supplierReviewsList: (supplierId: string, page: number, size: number) =>
    [...reviewKeys.supplierReviews(supplierId), { page, size }] as const,
}
