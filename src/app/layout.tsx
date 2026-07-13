import { type ReactNode } from 'react'
import { NavDock } from '../components/nav-dock/NavDock'
import { ThemeToggle } from '../components/theme-toggle/ThemeToggle'
import { CommandPalette } from '../components/command-palette/CommandPalette'
import { AIChat } from '../components/ai-chat/AIChat'
import { PWAStatusIndicator } from '../components/PWAStatusIndicator'
import { StarryBackground } from '../components/starry-background/StarryBackground'
import { FantasyCursor } from '../components/fantasy-cursor/FantasyCursor'
import { t } from '../i18n/translations'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-bg text-text-primary">
      <StarryBackground className="z-0" />
      <PWAStatusIndicator />
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border glass-panel">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <NavDock />
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 pt-14">{children}</main>

      <footer className="border-t border-border bg-surface px-4 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-muted sm:flex-row">
          <span>{t('footer.copyright')}</span>
          <span>{t('footer.status')}</span>
        </div>
      </footer>

      <CommandPalette />
      <AIChat />
      <FantasyCursor />
    </div>
  )
}
