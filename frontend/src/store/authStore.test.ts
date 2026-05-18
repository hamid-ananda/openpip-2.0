import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'

// A minimal valid JWT with payload { is_admin: true }
const ADMIN_JWT = [
  'eyJhbGciOiJIUzI1NiJ9',
  btoa(JSON.stringify({ is_admin: true })).replace(/=+$/, ''),
  'sig',
].join('.')

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ isLoggedIn: false, isAdmin: false, token: null, refreshToken: null })
  })

  it('starts logged out when localStorage is empty', () => {
    const state = useAuthStore.getState()
    expect(state.isLoggedIn).toBe(false)
    expect(state.isAdmin).toBe(false)
    expect(state.token).toBeNull()
  })

  it('login() sets token in state and localStorage', () => {
    useAuthStore.getState().login('tok123', 'ref123', false)
    expect(useAuthStore.getState().isLoggedIn).toBe(true)
    expect(useAuthStore.getState().token).toBe('tok123')
    expect(localStorage.getItem('openpip_access_token')).toBe('tok123')
    expect(localStorage.getItem('openpip_refresh_token')).toBe('ref123')
  })

  it('login() with isAdmin=true sets isAdmin', () => {
    useAuthStore.getState().login('tok456', 'ref456', true)
    expect(useAuthStore.getState().isAdmin).toBe(true)
  })

  it('setTokens() decodes isAdmin from JWT payload', () => {
    useAuthStore.getState().setTokens(ADMIN_JWT, 'ref789')
    expect(useAuthStore.getState().isAdmin).toBe(true)
  })

  it('logout() clears state and localStorage', () => {
    useAuthStore.getState().login('tok123', 'ref123', true)
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isLoggedIn).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().refreshToken).toBeNull()
    expect(localStorage.getItem('openpip_access_token')).toBeNull()
    expect(localStorage.getItem('openpip_refresh_token')).toBeNull()
  })
})
