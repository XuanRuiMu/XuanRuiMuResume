import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { ExperienceSection } from './ExperienceSection'
import { experiences } from '../../data/experience'
import { t } from '../../i18n/translations'

describe('ExperienceSection', () => {
  it('renders section title and subtitle', () => {
    render(<ExperienceSection />)
    expect(screen.getByRole('heading', { name: t('experience.title') })).toBeInTheDocument()
    expect(screen.getByText(t('experience.subtitle'))).toBeInTheDocument()
  })

  it('renders timeline as ordered list with accessible label', () => {
    render(<ExperienceSection />)
    const timeline = screen.getByRole('list', { name: t('experience.timelineLabel') })
    expect(timeline).toBeInTheDocument()
    expect(timeline).toHaveClass('timeline')
  })

  it('renders all experience entries as list items', () => {
    render(<ExperienceSection />)
    const timeline = screen.getByRole('list', { name: t('experience.timelineLabel') })
    const items = Array.from(timeline.querySelectorAll(':scope > li')) as HTMLElement[]

    expect(items).toHaveLength(experiences.length)

    for (const [index, entry] of experiences.entries()) {
      const item = items[index]
      expect(item).toHaveAttribute('data-timeline-index', String(index))
      expect(item).toHaveAttribute('aria-labelledby', `experience-title-${entry.id}`)

      const title = within(item).getByRole('heading', { name: t(entry.titleKey) })
      expect(title).toHaveAttribute('id', `experience-title-${entry.id}`)
      expect(within(item).getByText(t(entry.periodKey))).toBeInTheDocument()

      if (entry.organizationKey) {
        expect(within(item).getByText(t(entry.organizationKey))).toBeInTheDocument()
      }

      for (const key of entry.descriptionKeys) {
        expect(within(item).getByText(t(key))).toBeInTheDocument()
      }
    }
  })

  it('renders timeline nodes for each entry', () => {
    render(<ExperienceSection />)
    const nodes = document.querySelectorAll('.timeline-node')
    expect(nodes).toHaveLength(experiences.length)
  })

  it('has experience id on section', () => {
    const { container } = render(<ExperienceSection />)
    expect(container.querySelector('section')).toHaveAttribute('id', 'experience')
  })
})
