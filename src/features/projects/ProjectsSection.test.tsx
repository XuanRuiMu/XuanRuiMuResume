import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectsSection } from './ProjectsSection'
import { projects } from '../../data/projects'
import { t } from '../../i18n/translations'

describe('ProjectsSection', () => {
  let matches = false

  beforeEach(() => {
    matches = false
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        get matches() {
          return matches
        },
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders section title and subtitle', () => {
    render(<ProjectsSection />)
    expect(screen.getByRole('heading', { name: t('projects.title') })).toBeInTheDocument()
    expect(screen.getByText(t('projects.subtitle'))).toBeInTheDocument()
  })

  it('renders sticky notes with project name and description', () => {
    render(<ProjectsSection />)
    for (const project of projects) {
      expect(screen.getByRole('heading', { name: t(project.nameKey) })).toBeInTheDocument()
      expect(screen.getByText(t(project.descKey))).toBeInTheDocument()
    }
  })

  it('renders clickable project links with correct hrefs', () => {
    render(<ProjectsSection />)
    const links = screen.getAllByRole('link')
    const expectedUrls = projects.flatMap((project) => project.links?.map((link) => link.url) ?? [])
    expect(links).toHaveLength(expectedUrls.length)
    for (const url of expectedUrls) {
      expect(links.some((link) => link.getAttribute('href') === url)).toBe(true)
    }
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  it('applies sway animation class when reduced motion is not preferred', () => {
    const { container } = render(<ProjectsSection />)
    const swayElements = container.querySelectorAll('.note-sway')
    expect(swayElements.length).toBe(projects.length)
  })

  it('does not apply sway animation class when reduced motion is preferred', () => {
    matches = true
    const { container } = render(<ProjectsSection />)
    const swayElements = container.querySelectorAll('.note-sway')
    expect(swayElements.length).toBe(0)
  })

  it('renders the rope svg', () => {
    const { container } = render(<ProjectsSection />)
    const rope = container.querySelector('.rope-svg')
    expect(rope).toBeInTheDocument()
    expect(rope?.querySelector('path')).toBeInTheDocument()
  })

  it('has projects id on section', () => {
    const { container } = render(<ProjectsSection />)
    expect(container.querySelector('section')).toHaveAttribute('id', 'projects')
  })

  it('renders parchment background image for each project', () => {
    const { container } = render(<ProjectsSection />)
    const images = container.querySelectorAll('.note-parchment-img')
    expect(images.length).toBe(projects.length)
    for (const img of images) {
      expect(img).toHaveAttribute('src', '/images/parchment-note.png')
      expect(img).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('applies a note color class to each parchment image', () => {
    const { container } = render(<ProjectsSection />)
    const images = container.querySelectorAll('.note-parchment-img')
    const colorClasses = new Set<string>()
    for (const img of images) {
      const matched = Array.from(img.classList).find((cls) => /^note-color-\d+$/.test(cls))
      expect(matched).toBeTruthy()
      if (matched) colorClasses.add(matched)
    }
    expect(colorClasses.size).toBeGreaterThanOrEqual(1)
  })

  it('renders dark readable text on parchment notes', () => {
    const { container } = render(<ProjectsSection />)
    const notes = container.querySelectorAll('.note-parchment')
    expect(notes.length).toBe(projects.length)
    for (const note of notes) {
      expect(note.querySelector('.note-text')).toBeInTheDocument()
      expect(note.querySelector('.note-text-soft')).toBeInTheDocument()
    }
  })

  it('provides accessible labels for project links', () => {
    render(<ProjectsSection />)
    const links = screen.getAllByRole('link')
    for (const link of links) {
      expect(link).toHaveAttribute('aria-label')
      expect(link.getAttribute('aria-label')?.length).toBeGreaterThan(0)
    }
  })
})
