import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  username: string | null
  avatar: string | null
  vipLevel: number
}

interface AuthState {
  user: User | null
  sessionToken: string | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setSession: (token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      sessionToken: null,
      isAuthenticated: false,
      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),
      setSession: (token) => set({ sessionToken: token }),
      logout: () =>
        set({ user: null, sessionToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)






