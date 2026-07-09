import { useEffect } from 'react'
import { Command } from 'lucide-react'
import { useAppStore, SECTION_ORDER, type AppSection } from '../../store/useAppStore'
import { cn } from '../../lib/utils'
import { t, type TranslationKey } from '../../i18n/translations'

function sectionLabel(section: AppSection): string {
  return t(`nav.${section}` as unknown as TranslationKey)
}

export function NavDock() {
  const activeSection = useAppStore((state) => state.activeSection)
  const transitionToSection = useAppStore((state) => state.transitionToSection)
  const setCommandOpen = useAppStore((state) => state.setCommandOpen)
  const setActiveSection = useAppStore((state) => state.setActiveSection)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | null = null
        for (const entry of entries) {
          if (entry.isIntersecting && (!best || entry.intersectionRatio > best.intersectionRatio)) {
            best = entry
          }
        }
        if (best) {
          setActiveSection(best.target.id as AppSection)
        }
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    )

    SECTION_ORDER.forEach((section) => {
      const element = document.getElementById(section)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [setActiveSection])

  return (
    <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide" aria-label={t('nav.main')}>
      {SECTION_ORDER.map((section) => (
        <button
          key={section}
          type="button"
          onClick={() => transitionToSection(section)}
          style={{ anchorName: `--nav-${section}` }}
          className={cn(
            'nav-anchor shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            'text-text-secondary hover:text-text-primary hover:bg-surface',
            activeSection === section && 'bg-surface text-text-primary'
          )}
        >
          {sectionLabel(section)}
          <span
            className="nav-tooltip rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-secondary shadow-lg"
            style={{ positionAnchor: `--nav-${section}` }}
            aria-hidden="true"
          >
            {sectionLabel(section)}
          </span>
        </button>
      ))}
      <div className="mx-1 h-4 w-px shrink-0 bg-border" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className={cn(
          'inline-flex shrink-0 items-center gap-2 rounded-full border border-border',
          'bg-surface px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-elevated'
        )}
        aria-label={t('command.open')}
        title={t('command.open')}
      >
        <Command size={14} />
        <span className="hidden sm:inline">{t('command.open')}</span>
        <kbd className="ml-1 rounded border border-border px-1 text-[10px]">⌘K</kbd>
      </button>
    </nav>
  )
}
