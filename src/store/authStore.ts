import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  sessionVersion: number
  setToken: (token: string | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      sessionVersion: 0,
      setToken: (token) =>
        set((state) => ({ token, sessionVersion: state.sessionVersion + 1 })),
    }),
    {
      name: 'library-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ token }) => ({ token }),
    },
  ),
)
