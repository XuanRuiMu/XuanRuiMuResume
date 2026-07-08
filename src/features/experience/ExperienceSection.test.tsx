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

  it('renders all experience entries', () => {
    render(<ExperienceSection />)
    for (const entry of experiences) {
      const article = screen.getByRole('article', { name: t(entry.titleKey) })
      expect(article).toBeInTheDocument()
      expect(within(article).getByText(t(entry.periodKey))).toBeInTheDocument()
      if (entry.organizationKey) {
        expect(within(article).getByText(t(entry.organizationKey))).toBeInTheDocument()
      }
      for (const key of entry.descriptionKeys) {
        expect(within(article).getByText(t(key))).toBeInTheDocument()
      }
    }
  })

  it('has experience id on section', () => {
    const { container } = render(<ExperienceSection />)
    expect(container.querySelector('section')).toHaveAttribute('id', 'experience')
  })
})
