import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { DesignSection } from './DesignSection'
import { design } from '../../data/design'
import { t } from '../../i18n/translations'

describe('DesignSection', () => {
  it('renders section title and subtitle', () => {
    render(<DesignSection />)
    expect(screen.getByRole('heading', { name: t('design.title') })).toBeInTheDocument()
    expect(screen.getByText(t('design.subtitle'))).toBeInTheDocument()
  })

  it('renders headline and intro', () => {
    render(<DesignSection />)
    expect(screen.getByRole('heading', { name: t(design.headlineKey) })).toBeInTheDocument()
    expect(screen.getByText(t(design.introKey))).toBeInTheDocument()
  })

  it('renders all design works with category and description', () => {
    render(<DesignSection />)
    for (const work of design.works) {
      const card = screen.getByRole('heading', { name: t(work.nameKey) }).closest('article, div')
      expect(card).not.toBeNull()
      const wrapper = within(card as HTMLElement)
      expect(wrapper.getByText(t(work.categoryKey))).toBeInTheDocument()
      expect(wrapper.getByText(t(work.descKey))).toBeInTheDocument()
    }
  })

  it('renders all design tool tags', () => {
    render(<DesignSection />)
    for (const key of design.toolKeys) {
      expect(screen.getAllByText(t(key)).length).toBeGreaterThanOrEqual(1)
    }
  })

  it('has design id on section', () => {
    const { container } = render(<DesignSection />)
    expect(container.querySelector('section')).toHaveAttribute('id', 'design')
  })
})
