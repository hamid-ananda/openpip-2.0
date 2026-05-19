import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useAuthStore } from '../store/authStore'
import { resetNetworkStore } from '../mocks/handlers/networks'
import { useSavedNetworks, useSaveNetwork, useDeleteNetwork } from './networks'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

const SAVE_BODY = {
  name: 'Test Net',
  query: 'TP53',
  score_parameter: '0.50',
  category_array: 'Published',
  tissue_expression_array: '',
  interaction_ids: [1, 2, 3],
}

beforeEach(() => {
  resetNetworkStore()
  localStorage.setItem('openpip_access_token', 'mock-token')
  useAuthStore.setState({ isLoggedIn: true, token: 'mock-token' })
})

afterEach(() => {
  localStorage.removeItem('openpip_access_token')
  useAuthStore.setState({ isLoggedIn: false, token: null, refreshToken: null, isAdmin: false })
})

describe('useSavedNetworks', () => {
  it('returns empty array when no networks saved', async () => {
    const { result } = renderHook(() => useSavedNetworks(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('is disabled when not authenticated', () => {
    useAuthStore.setState({ isLoggedIn: false, token: null })
    const { result } = renderHook(() => useSavedNetworks(), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })
})

describe('useSaveNetwork', () => {
  it('posts to /networks and returns id + interaction_count', async () => {
    const { result } = renderHook(() => useSaveNetwork(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync(SAVE_BODY)
    })
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data).toMatchObject({
      name: 'Test Net',
      interaction_count: 3,
    })
  })
})

describe('useDeleteNetwork', () => {
  it('deletes by id', async () => {
    const saveHook = renderHook(() => useSaveNetwork(), { wrapper })
    await act(async () => {
      await saveHook.result.current.mutateAsync(SAVE_BODY)
    })
    const savedId = (saveHook.result.current.data as { id: number }).id

    const { result } = renderHook(() => useDeleteNetwork(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync(savedId)
    })
    expect(result.current.isSuccess).toBe(true)
  })
})
