import { Sun, Moon, Monitor } from 'lucide-react'
import { useThemeSystem } from './useThemeSystem'
import { cn } from '../../lib/utils'
import { t } from '../../i18n/translations'
import type { AppTheme } from '../../store/useAppStore'

const ICONS: Record<AppTheme, typeof Sun> = {
  dark: Moon,
  light: Sun,
  system: Monitor,
}

const NEXT_THEME: Record<AppTheme, AppTheme> = {
  dark: 'light',
  light: 'system',
  system: 'dark',
}

const THEME_LABEL: Record<AppTheme, string> = {
  dark: t('theme.dark'),
  light: t('theme.light'),
  system: t('theme.system'),
}

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useThemeSystem()
  const Icon = ICONS[theme]

  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT_THEME[theme])}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full',
        'bg-surface text-text-primary border border-border',
        'transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className
      )}
      aria-label={THEME_LABEL[theme]}
      title={THEME_LABEL[theme]}
    >
      <Icon size={18} />
    </button>
  )
}
