import { create } from 'zustand'

const TOKEN_KEY = 'openpip_access_token'

interface AuthState {
  isLoggedIn: boolean
  isAdmin: boolean
  token: string | null
  login: (token: string, isAdmin: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: !!localStorage.getItem(TOKEN_KEY),
  isAdmin: false,
  token: localStorage.getItem(TOKEN_KEY),
  login: (token, isAdmin) => {
    localStorage.setItem(TOKEN_KEY, token)
    set({ isLoggedIn: true, isAdmin, token })
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ isLoggedIn: false, isAdmin: false, token: null })
  },
}))
