import type { AuthenticatedUser } from "@fsm/types"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthenticatedUser | null
  setAuth: (payload: { accessToken: string; refreshToken: string; user: AuthenticatedUser }) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: ({ accessToken, refreshToken, user }) => set({ accessToken, refreshToken, user }),
      clearAuth: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: "fsm-auth",
    },
  ),
)
