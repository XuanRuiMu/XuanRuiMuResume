import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EducationSection } from './EducationSection'
import { education } from '../../data/education'
import { t } from '../../i18n/translations'

describe('EducationSection', () => {
  it('renders section title and subtitle', () => {
    render(<EducationSection />)
    expect(screen.getByRole('heading', { name: t('education.title') })).toBeInTheDocument()
    expect(screen.getByText(t('education.subtitle'))).toBeInTheDocument()
  })

  it('renders education paragraph', () => {
    render(<EducationSection />)
    expect(screen.getByText(t('education.paragraph'))).toBeInTheDocument()
  })

  it('renders education period on timeline', () => {
    render(<EducationSection />)
    expect(screen.getByText(education.summary.period)).toBeInTheDocument()
  })

  it('does not render tabs', () => {
    render(<EducationSection />)
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('does not render course list', () => {
    render(<EducationSection />)
    for (const course of education.courses) {
      expect(screen.queryByText(t(course.nameKey))).not.toBeInTheDocument()
    }
  })

  it('does not render achievement cards', () => {
    render(<EducationSection />)
    for (const key of education.achievementKeys) {
      expect(screen.queryByText(t(key))).not.toBeInTheDocument()
    }
  })

  it('has education id on section', () => {
    const { container } = render(<EducationSection />)
    expect(container.querySelector('section')).toHaveAttribute('id', 'education')
  })
})
