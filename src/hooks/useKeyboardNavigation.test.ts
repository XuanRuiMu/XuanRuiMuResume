import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardNavigation } from './useKeyboardNavigation'
import { useAppStore } from '../store/useAppStore'

describe('useKeyboardNavigation', () => {
  it('listens to Escape key and returns to theater', () => {
    const setActiveSection = vi.fn()
    const transitionToTheater = vi.fn()
    const transitionToSection = vi.fn()

    useAppStore.setState({
      activeSection: 'hero',
      setActiveSection,
      transitionToTheater,
      transitionToSection,
    } as unknown as ReturnType<typeof useAppStore.getState>)

    renderHook(() => useKeyboardNavigation())

    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(event)

    expect(transitionToTheater).toHaveBeenCalled()
  })
})
