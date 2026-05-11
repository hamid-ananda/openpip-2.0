import { useEffect } from 'react'
import { useSettings } from '../api/settings'
import { injectCSSVars } from '../lib/theme'
import { ThemeContext } from './useTheme'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { data: settings } = useSettings()

  useEffect(() => {
    if (settings) injectCSSVars(settings)
  }, [settings])

  return (
    <ThemeContext.Provider value={settings ?? null}>
      {children}
    </ThemeContext.Provider>
  )
}
