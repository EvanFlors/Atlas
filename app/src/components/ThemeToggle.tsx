import type { ReactElement } from 'react'
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi'
import { useTheme, type Theme } from '../hooks/useTheme'
import { Button } from './ui/Button/Button'

const ICON: Record<Theme, ReactElement> = {
  light: <FiSun />,
  dark: <FiMoon />,
  system: <FiMonitor />,
}

const LABEL: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}

const NEXT: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`Tema actual: ${theme}. Cambiar al siguiente.`}
      title={`Tema: ${theme} (click para cambiar)`}
    >
      {ICON[theme]} {LABEL[theme]}
    </Button>
  )
}
