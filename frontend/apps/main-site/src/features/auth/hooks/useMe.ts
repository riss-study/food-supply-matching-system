import { useQuery } from "@tanstack/react-query"
import { me } from "../api/auth-api"
import { authKeys } from "../query-keys"
import { useAuthStore } from "../store/auth-store"

export function useMe() {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: me,
    enabled: Boolean(accessToken),
  })
}
