import { useMutation } from "@tanstack/react-query"
import type { SignupRequest } from "@fsm/types"
import { signup } from "../api/auth-api"

export function useSignup() {
  return useMutation({
    mutationFn: (request: SignupRequest) => signup(request),
  })
}
