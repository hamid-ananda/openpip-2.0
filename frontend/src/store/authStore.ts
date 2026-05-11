import { create } from 'zustand'

interface AuthState {
  token: string | null
  isAdmin: boolean
  isAuthenticated: boolean
  login: (token: string, isAdmin: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('openpip_access_token'),
  isAdmin: false,
  isAuthenticated: !!localStorage.getItem('openpip_access_token'),
  login: (token, isAdmin) => {
    localStorage.setItem('openpip_access_token', token)
    set({ token, isAdmin, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('openpip_access_token')
    set({ token: null, isAdmin: false, isAuthenticated: false })
  },
}))
