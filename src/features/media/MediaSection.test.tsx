import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MediaSection } from './MediaSection'
import { media } from '../../data/media'
import { t } from '../../i18n/translations'

describe('MediaSection', () => {
  it('renders section title and subtitle', () => {
    render(<MediaSection />)
    expect(screen.getByRole('heading', { name: t('media.title') })).toBeInTheDocument()
    expect(screen.getByText(t('media.subtitle'))).toBeInTheDocument()
  })

  it('renders headline and intro', () => {
    render(<MediaSection />)
    expect(screen.getByRole('heading', { name: t(media.headlineKey) })).toBeInTheDocument()
    expect(screen.getByText(t(media.introKey))).toBeInTheDocument()
  })

  it('renders all media categories and items', () => {
    render(<MediaSection />)
    for (const category of media.categories) {
      expect(screen.getByRole('heading', { name: t(category.labelKey) })).toBeInTheDocument()
      for (const key of category.itemKeys) {
        expect(screen.getByText(t(key))).toBeInTheDocument()
      }
    }
  })

  it('renders timeline events', () => {
    render(<MediaSection />)
    for (const event of media.timeline) {
      expect(screen.getByText(event.year)).toBeInTheDocument()
      expect(screen.getByText(t(event.eventKey))).toBeInTheDocument()
    }
  })

  it('has media id on section', () => {
    const { container } = render(<MediaSection />)
    expect(container.querySelector('section')).toHaveAttribute('id', 'media')
  })
})
