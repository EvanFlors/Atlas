import { useTheme, type Theme } from '../hooks/useTheme'
import { Button } from './ui/Button/Button'


const LABEL: Record<Theme, string> = {
  light: '☀️ Light',
  dark: '🌙 Dark',
  system: '🖥 System',
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
      aria-label="Toggle theme"
    >
      {LABEL[theme]}
    </Button>
  )
}