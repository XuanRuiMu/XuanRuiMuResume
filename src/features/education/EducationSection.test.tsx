import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EducationSection } from './EducationSection'
import { education } from '../../data/education'
import { t } from '../../i18n/translations'

describe('EducationSection', () => {
  it('renders section title and subtitle', () => {
    render(<EducationSection />)
    expect(screen.getByRole('heading', { name: t('education.title') })).toBeInTheDocument()
    expect(screen.getByText(t('education.subtitle'))).toBeInTheDocument()
  })

  it('renders summary tab by default', () => {
    render(<EducationSection />)
    expect(screen.getByText(education.summary.school)).toBeInTheDocument()
    expect(screen.getByText(education.summary.period)).toBeInTheDocument()
  })

  it('switches to courses tab and renders all courses', () => {
    render(<EducationSection />)
    fireEvent.click(screen.getByRole('tab', { name: t('education.tabs.courses') }))
    for (const course of education.courses) {
      expect(screen.getByText(t(course.nameKey))).toBeInTheDocument()
      expect(screen.getByText(t(course.levelKey))).toBeInTheDocument()
    }
  })

  it('switches to achievements tab and renders all achievements', () => {
    render(<EducationSection />)
    fireEvent.click(screen.getByRole('tab', { name: t('education.tabs.achievements') }))
    for (const key of education.achievementKeys) {
      expect(screen.getByText(t(key))).toBeInTheDocument()
    }
  })

  it('has education id on section', () => {
    const { container } = render(<EducationSection />)
    expect(container.querySelector('section')).toHaveAttribute('id', 'education')
  })
})
