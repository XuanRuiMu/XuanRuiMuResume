import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AboutSection } from './AboutSection'
import { t } from '../../i18n/translations'

describe('AboutSection', () => {
  it('renders section title and subtitle', () => {
    render(<AboutSection />)
    expect(screen.getByRole('heading', { name: t('about.title') })).toBeInTheDocument()
    expect(screen.getByText(t('about.subtitle'))).toBeInTheDocument()
  })

  it('renders personal intro', () => {
    render(<AboutSection />)
    expect(screen.getByText(t('about.intro'))).toBeInTheDocument()
  })

  it('renders all metric cards', () => {
    render(<AboutSection />)
    const metrics: Array<{
      valueKey:
        | 'about.metrics.projects.value'
        | 'about.metrics.techStack.value'
        | 'about.metrics.courses.value'
        | 'about.metrics.students.value'
      labelKey:
        | 'about.metrics.projects.label'
        | 'about.metrics.techStack.label'
        | 'about.metrics.courses.label'
        | 'about.metrics.students.label'
    }> = [
      { valueKey: 'about.metrics.projects.value', labelKey: 'about.metrics.projects.label' },
      { valueKey: 'about.metrics.techStack.value', labelKey: 'about.metrics.techStack.label' },
      { valueKey: 'about.metrics.courses.value', labelKey: 'about.metrics.courses.label' },
      { valueKey: 'about.metrics.students.value', labelKey: 'about.metrics.students.label' },
    ]
    for (const metric of metrics) {
      expect(screen.getByText(t(metric.valueKey))).toBeInTheDocument()
      expect(screen.getByText(t(metric.labelKey))).toBeInTheDocument()
    }
  })

  it('has about id on section', () => {
    const { container } = render(<AboutSection />)
    expect(container.querySelector('section')).toHaveAttribute('id', 'about')
  })
})
