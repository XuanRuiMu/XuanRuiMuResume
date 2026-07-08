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
    <nav className="flex items-center gap-1" aria-label={t('nav.main')}>
      {SECTION_ORDER.map((section) => (
        <button
          key={section}
          type="button"
          onClick={() => transitionToSection(section)}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            'text-text-secondary hover:text-text-primary hover:bg-surface',
            activeSection === section && 'bg-surface text-text-primary'
          )}
        >
          {sectionLabel(section)}
        </button>
      ))}
      <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-border',
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
