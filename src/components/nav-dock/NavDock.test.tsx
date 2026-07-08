import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NavDock } from './NavDock'
import { t } from '../../i18n/translations'

const transitionToSection = vi.fn()
const setCommandOpen = vi.fn()
const setActiveSection = vi.fn()

vi.mock('../../store/useAppStore', () => ({
  useAppStore: (selector: (state: unknown) => unknown) =>
    selector({
      activeSection: 'hero',
      transitionToSection,
      setCommandOpen,
      setActiveSection,
    }),
  SECTION_ORDER: [
    'hero',
    'about',
    'projects',
    'skills',
    'experience',
    'education',
    'design',
    'music',
    'media',
    'contact',
  ],
}))

describe('NavDock', () => {
  let intersectionObserverMock: { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.clearAllMocks()
    intersectionObserverMock = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    }
    global.IntersectionObserver = vi.fn(() => intersectionObserverMock) as unknown as typeof IntersectionObserver
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders all section navigation buttons', () => {
    render(<NavDock />)
    expect(screen.getByRole('button', { name: t('nav.hero') })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: t('nav.about') })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: t('nav.projects') })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: t('nav.skills') })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: t('nav.experience') })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: t('nav.education') })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: t('nav.design') })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: t('nav.music') })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: t('nav.media') })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: t('nav.contact') })).toBeInTheDocument()
  })

  it('highlights the active section', () => {
    render(<NavDock />)
    const activeButton = screen.getByRole('button', { name: t('nav.hero') })
    expect(activeButton).toHaveClass('bg-surface')
  })

  it('navigates to section when a nav button is clicked', () => {
    render(<NavDock />)
    fireEvent.click(screen.getByRole('button', { name: t('nav.projects') }))
    expect(transitionToSection).toHaveBeenCalledWith('projects')
  })

  it('opens command palette when command button is clicked', () => {
    render(<NavDock />)
    fireEvent.click(screen.getByRole('button', { name: t('command.open') }))
    expect(setCommandOpen).toHaveBeenCalledWith(true)
  })

  it('observes all section elements for scroll highlighting', () => {
    const hero = document.createElement('section')
    hero.id = 'hero'
    const projects = document.createElement('section')
    projects.id = 'projects'
    document.body.appendChild(hero)
    document.body.appendChild(projects)

    render(<NavDock />)
    expect(intersectionObserverMock.observe).toHaveBeenCalledWith(hero)
    expect(intersectionObserverMock.observe).toHaveBeenCalledWith(projects)

    document.body.removeChild(hero)
    document.body.removeChild(projects)
  })
})
