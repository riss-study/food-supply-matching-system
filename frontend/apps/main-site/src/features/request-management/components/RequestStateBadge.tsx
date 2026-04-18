import { useTranslation } from "react-i18next"
import type { RequestState } from "@fsm/types"

const stateBadgeClass: Record<RequestState, string> = {
  draft: "badge badge-gray",
  open: "badge badge-green",
  closed: "badge badge-blue",
  cancelled: "badge badge-red",
}

export function RequestStateBadge({ state }: { state: RequestState }) {
  const { t } = useTranslation("request-management")
  return <span className={stateBadgeClass[state]}>{t(`state.${state}`)}</span>
}
