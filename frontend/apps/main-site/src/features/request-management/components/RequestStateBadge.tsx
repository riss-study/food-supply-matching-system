import type { RequestState } from "@fsm/types"

const stateLabels: Record<RequestState, string> = {
  draft: "작성 중",
  open: "진행 중",
  closed: "마감",
  cancelled: "취소됨",
}

const stateBadgeClass: Record<RequestState, string> = {
  draft: "badge badge-gray",
  open: "badge badge-green",
  closed: "badge badge-blue",
  cancelled: "badge badge-red",
}

export function RequestStateBadge({ state }: { state: RequestState }) {
  return <span className={stateBadgeClass[state]}>{stateLabels[state]}</span>
}
