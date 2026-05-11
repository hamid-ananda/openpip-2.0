import { createContext, useContext } from 'react'
import type { AdminSettings } from '../types/api'

export const ThemeContext = createContext<AdminSettings | null>(null)

export function useTheme() {
  return useContext(ThemeContext)
}
