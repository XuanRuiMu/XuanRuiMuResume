import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AboutSection } from './AboutSection'
import { t } from '../../i18n/translations'

function 模拟减少动画(减少: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: 减少,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

function 读取所有段落文本(container: HTMLElement): string {
  return Array.from(container.querySelectorAll('p'))
    .map((p) => p.textContent?.trim() ?? '')
    .join('')
}

beforeEach(() => {
  // 默认非减少动画；IntersectionObserver 由 setup 提供（observe 即触发进入视口）
  模拟减少动画(false)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('AboutSection', () => {
  it('renders section title', () => {
    render(<AboutSection />)
    expect(screen.getByRole('heading', { name: t('about.title') })).toBeInTheDocument()
  })

  it('does not render subtitle', () => {
    render(<AboutSection />)
    expect(screen.queryByText(t('about.subtitle'))).not.toBeInTheDocument()
  })

  it('renders full intro immediately under reduced motion', () => {
    模拟减少动画(true)
    const { container } = render(<AboutSection />)
    expect(读取所有段落文本(container)).toBe(t('about.intro'))
  })

  it('types out intro character by character when scrolled into view', () => {
    vi.useFakeTimers()
    const { container } = render(<AboutSection />)

    // 进入视口前/刚进入：尚未打出任何字符
    expect(读取所有段落文本(container)).toBe('')

    // 推进到一半，应出现前缀且尚未完整
    act(() => {
      vi.advanceTimersByTime(800)
    })
    const 中途文本 = 读取所有段落文本(container)
    expect(中途文本.length).toBeGreaterThan(0)
    expect(中途文本.length).toBeLessThan(t('about.intro').length)
    expect(t('about.intro').startsWith(中途文本)).toBe(true)

    // 推进到全部完成
    act(() => {
      vi.advanceTimersByTime(8000)
    })
    expect(读取所有段落文本(container)).toBe(t('about.intro'))
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
