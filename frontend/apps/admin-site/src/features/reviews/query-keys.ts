type Params = Readonly<Record<string, unknown>>

export const adminReviewKeys = {
  all: ["admin-reviews"] as const,
  queues: () => [...adminReviewKeys.all, "queue"] as const,
  queue: (params: Params) => [...adminReviewKeys.queues(), params] as const,
  details: () => [...adminReviewKeys.all, "detail"] as const,
  detail: (reviewId: string) => [...adminReviewKeys.details(), reviewId] as const,
}
