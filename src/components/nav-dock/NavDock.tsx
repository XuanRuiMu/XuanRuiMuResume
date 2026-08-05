import { useEffect } from 'react'
import { Command } from 'lucide-react'
import { useAppStore, SECTION_ORDER, type AppSection } from '../../store/useAppStore'
import { cn } from '../../lib/utils'
import { t } from '../../i18n/translations'
import { StarMapNav } from './StarMapNav'

export function NavDock() {
  const activeSection = useAppStore((state) => state.activeSection)
  const transitionToSection = useAppStore((state) => state.transitionToSection)
  const setCommandOpen = useAppStore((state) => state.setCommandOpen)
  const setActiveSection = useAppStore((state) => state.setActiveSection)

  // 保留原 IntersectionObserver：以 rootMargin 判断当前章节并联动高亮
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
    <nav className="flex items-center gap-3" aria-label={t('nav.main')}>
      <StarMapNav activeSection={activeSection} 跳转={transitionToSection} />
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className={cn(
          'inline-flex shrink-0 items-center gap-2 rounded-full border border-border',
          'bg-surface px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
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
