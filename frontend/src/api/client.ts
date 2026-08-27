import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// Single source of truth for the API root. Falls back to the app's deploy base
// (`VITE_BASE`, e.g. `/v2/`) so raw-fetch callers stay on the same prefix as axios.
export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? `${import.meta.env.BASE_URL}api`

/**
 * URL for an uploaded file the API reports as a MEDIA path ("/media/…").
 * The app is mounted under a prefix in production (VITE_BASE=/v2/), which
 * Django's MEDIA_URL knows nothing about, so the prefix is added here.
 */
export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//.test(path)) return path
  return import.meta.env.BASE_URL.replace(/\/$/, '') + path
}

export const apiClient = axios.create({ baseURL: BASE_URL })

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('openpip_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Queue of callbacks waiting for a token refresh to complete
let isRefreshing = false
let refreshQueue: ((token: string) => void)[] = []

function drainQueue(newToken: string) {
  refreshQueue.forEach((cb) => cb(newToken))
  refreshQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('openpip_refresh_token')
    if (!refreshToken) {
      useAuthStore.getState().logout()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(apiClient(original))
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/token/refresh`, {
        refresh: refreshToken,
      })
      const { access, refresh } = data
      useAuthStore.getState().setTokens(access, refresh)
      original.headers.Authorization = `Bearer ${access}`
      drainQueue(access)
      return apiClient(original)
    } catch {
      useAuthStore.getState().logout()
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)
