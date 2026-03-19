import { useQuery } from "@tanstack/react-query"
import { me } from "../api/auth-api"
import { useAuthStore } from "../store/auth-store"

export function useMe() {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: me,
    enabled: Boolean(accessToken),
  })
}
