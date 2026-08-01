import { type ReactNode } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { NavDock } from '../components/nav-dock/NavDock'
import { ThemeToggle } from '../components/theme-toggle/ThemeToggle'
import { CommandPalette } from '../components/command-palette/CommandPalette'
import { AIChat } from '../components/ai-chat/AIChat'
import { PWAStatusIndicator } from '../components/PWAStatusIndicator'
import { StarryGalaxyBackground, InkRevealOverlay } from '../components/starry-background'
import { t } from '../i18n/translations'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-bg text-text-primary">
      <StarryGalaxyBackground className="z-0" />
      <InkRevealOverlay />
      <div className="relative z-10 flex min-h-screen flex-col">
        <PWAStatusIndicator />
        <header className="fixed inset-x-0 top-0 z-50 border-b border-border">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2">
              <NavDock />
              <div id="starry-gui-root" className="relative">
                <button
                  id="starry-gui-trigger"
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded="false"
                  aria-label={t('starryBg.panelTrigger')}
                  title={t('starryBg.panelTrigger')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-primary transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <SlidersHorizontal size={16} />
                </button>
                <div
                  id="starry-gui-slot"
                  className="absolute left-0 top-full z-[1000] mt-2 hidden w-[300px] overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="relative z-10 flex-1 pt-14">{children}</main>

        <footer className="border-t border-border px-4 py-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-muted text-shadow-readable sm:flex-row">
            <span>{t('footer.copyright')}</span>
            <span>{t('footer.status')}</span>
          </div>
        </footer>

        <CommandPalette />
        <AIChat />
      </div>
    </div>
  )
}
