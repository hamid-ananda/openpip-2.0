import { create } from 'zustand'

const STORAGE_KEY = 'openpip-dark-mode'

function getInitial(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) return stored === 'true'
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
}

function apply(dark: boolean) {
  document.documentElement.dataset.theme = dark ? 'dark' : ''
}

const initial = getInitial()
apply(initial)

interface DarkModeStore {
  dark: boolean
  toggle: () => void
}

export const useDarkMode = create<DarkModeStore>((set, get) => ({
  dark: initial,
  toggle: () => {
    const next = !get().dark
    apply(next)
    localStorage.setItem(STORAGE_KEY, String(next))
    set({ dark: next })
  },
}))
