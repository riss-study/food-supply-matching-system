type Params = Readonly<Record<string, unknown>>

export const adminStatsKeys = {
  all: ["admin-stats"] as const,
  summaries: () => [...adminStatsKeys.all, "summary"] as const,
  summary: (params: Params) => [...adminStatsKeys.summaries(), params] as const,
}
