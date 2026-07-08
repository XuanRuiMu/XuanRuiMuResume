import { useEffect, useCallback } from 'react'
import { useAppStore, SECTION_ORDER } from '../store/useAppStore'
import { logger } from '../observability/logger'

export function useKeyboardNavigation(): void {
  const { activeSection, transitionToSection, transitionToTheater } = useAppStore.getState()

  const navigateToSection = useCallback(
    (index: number) => {
      const section = SECTION_ORDER[index]
      if (section) {
        transitionToSection(section)
        logger.debug('Keyboard navigation', { section, index })
      }
    },
    [transitionToSection]
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (activeSection) {
          event.preventDefault()
          transitionToTheater()
        }
        return
      }

      if (activeSection) return

      const key = event.key
      if (key >= '1' && key <= '5') {
        event.preventDefault()
        navigateToSection(Number.parseInt(key, 10) - 1)
        return
      }

      if (key === 'Home') {
        event.preventDefault()
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      if (key === 'End') {
        event.preventDefault()
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeSection, transitionToTheater, navigateToSection])
}
