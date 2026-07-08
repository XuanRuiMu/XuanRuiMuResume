import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectsSection } from './ProjectsSection'
import { projects } from '../../data/projects'
import { t } from '../../i18n/translations'

describe('ProjectsSection', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
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

  it('renders all project cards with name, description and tags', () => {
    render(<ProjectsSection />)
    for (const project of projects) {
      expect(screen.getByRole('heading', { name: t(project.nameKey) })).toBeInTheDocument()
      expect(screen.getByText(t(project.descKey))).toBeInTheDocument()
      for (const tag of project.tags) {
        expect(screen.getByText(tag)).toBeInTheDocument()
      }
    }
  })

  it('renders project metric badges', () => {
    render(<ProjectsSection />)
    for (const project of projects) {
      for (const key of project.metricKeys ?? []) {
        expect(screen.getByText(t(key))).toBeInTheDocument()
      }
    }
  })

  it('renders project links with correct hrefs', () => {
    render(<ProjectsSection />)
    const links = screen.getAllByRole('link')
    const expectedUrls = projects.flatMap((project) => project.links?.map((link) => link.url) ?? [])
    expect(links).toHaveLength(expectedUrls.length)
    for (const url of expectedUrls) {
      expect(links.some((link) => link.getAttribute('href') === url)).toBe(true)
    }
  })

  it('has projects id on section', () => {
    const { container } = render(<ProjectsSection />)
    expect(container.querySelector('section')).toHaveAttribute('id', 'projects')
  })
})
