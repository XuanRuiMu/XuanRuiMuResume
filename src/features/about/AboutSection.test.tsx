import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AboutSection } from './AboutSection'
import { t } from '../../i18n/translations'

describe('AboutSection', () => {
  it('renders section title', () => {
    render(<AboutSection />)
    expect(screen.getByRole('heading', { name: t('about.title') })).toBeInTheDocument()
  })

  it('does not render subtitle', () => {
    render(<AboutSection />)
    expect(screen.queryByText(t('about.subtitle'))).not.toBeInTheDocument()
  })

  it('renders personal intro across code-style lines', () => {
    const { container } = render(<AboutSection />)
    const wanZhengJianJie = t('about.intro')
    const duanLuo = Array.from(container.querySelectorAll('p'))
    const xuanRanWenBen = duanLuo.map((p) => p.textContent?.trim() ?? '').join('')
    expect(xuanRanWenBen).toBe(wanZhengJianJie)
  })

  it('does not render metric cards', () => {
    render(<AboutSection />)
    expect(screen.queryByText(t('about.metrics.projects.value'))).not.toBeInTheDocument()
    expect(screen.queryByText(t('about.metrics.projects.label'))).not.toBeInTheDocument()
    expect(screen.queryByText(t('about.metrics.techStack.value'))).not.toBeInTheDocument()
    expect(screen.queryByText(t('about.metrics.courses.value'))).not.toBeInTheDocument()
    expect(screen.queryByText(t('about.metrics.students.value'))).not.toBeInTheDocument()
  })

  it('renders code-style line numbers', () => {
    render(<AboutSection />)
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
  })

  it('renders code comment markers', () => {
    render(<AboutSection />)
    const zhuShiFuHao = screen.getAllByText('//')
    expect(zhuShiFuHao.length).toBeGreaterThanOrEqual(2)
  })

  it('has about id on section', () => {
    const { container } = render(<AboutSection />)
    expect(container.querySelector('section')).toHaveAttribute('id', 'about')
  })
})
