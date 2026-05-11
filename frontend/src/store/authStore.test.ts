import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ isLoggedIn: false, isAdmin: false, token: null })
  })

  it('starts logged out when localStorage is empty', () => {
    const state = useAuthStore.getState()
    expect(state.isLoggedIn).toBe(false)
    expect(state.isAdmin).toBe(false)
    expect(state.token).toBeNull()
  })

  it('login() sets token in state and localStorage', () => {
    useAuthStore.getState().login('tok123', false)
    expect(useAuthStore.getState().isLoggedIn).toBe(true)
    expect(useAuthStore.getState().token).toBe('tok123')
    expect(localStorage.getItem('openpip_access_token')).toBe('tok123')
  })

  it('login() with isAdmin=true sets isAdmin', () => {
    useAuthStore.getState().login('tok456', true)
    expect(useAuthStore.getState().isAdmin).toBe(true)
  })

  it('logout() clears state and localStorage', () => {
    useAuthStore.getState().login('tok123', true)
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isLoggedIn).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
    expect(localStorage.getItem('openpip_access_token')).toBeNull()
  })
})
