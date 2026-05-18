import { create } from 'zustand'

const ACCESS_KEY = 'openpip_access_token'
const REFRESH_KEY = 'openpip_refresh_token'

function decodeIsAdmin(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return !!payload.is_admin
  } catch {
    return false
  }
}

interface AuthState {
  isLoggedIn: boolean
  isAdmin: boolean
  token: string | null
  refreshToken: string | null
  login: (access: string, refresh: string, isAdmin: boolean) => void
  setTokens: (access: string, refresh: string) => void
  logout: () => void
}

const storedAccess = localStorage.getItem(ACCESS_KEY)

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: !!storedAccess,
  isAdmin: storedAccess ? decodeIsAdmin(storedAccess) : false,
  token: storedAccess,
  refreshToken: localStorage.getItem(REFRESH_KEY),
  login: (access, refresh, isAdmin) => {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
    set({ isLoggedIn: true, isAdmin, token: access, refreshToken: refresh })
  },
  setTokens: (access, refresh) => {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
    set({ token: access, refreshToken: refresh, isAdmin: decodeIsAdmin(access) })
  },
  logout: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    set({ isLoggedIn: false, isAdmin: false, token: null, refreshToken: null })
  },
}))
