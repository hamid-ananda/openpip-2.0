import { useEffect } from 'react'
import { useSettings } from '../api/settings'
import { injectCSSVars } from '../lib/theme'
import { ThemeContext } from './useTheme'
import { useDarkMode } from '../store/darkModeStore'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { data: settings } = useSettings()
  const { dark } = useDarkMode()

  useEffect(() => {
    if (settings) injectCSSVars(settings)
  }, [settings, dark])

  return (
    <ThemeContext.Provider value={settings ?? null}>
      {children}
    </ThemeContext.Provider>
  )
}
