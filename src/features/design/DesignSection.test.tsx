import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DesignSection } from './DesignSection'
import { design } from '../../data/design'
import { t } from '../../i18n/translations'

const reducedMotionMock = vi.hoisted(() => ({ value: false }))

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => reducedMotionMock.value,
}))

describe('DesignSection', () => {
  beforeEach(() => {
    reducedMotionMock.value = false
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

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

  it('renders the generative canvas', () => {
    render(<DesignSection />)
    const canvas = screen.getByRole('img', { name: t('design.canvasLabel') })
    expect(canvas).toBeInTheDocument()
    expect(canvas.tagName.toLowerCase()).toBe('canvas')
  })

  it('regenerates pattern when canvas is clicked', () => {
    const clearRect = vi.fn()
    const originalGetContext = HTMLCanvasElement.prototype.getContext
    const mockGetContext = function (this: HTMLCanvasElement, contextId: string) {
      if (contextId === '2d') {
        return {
          canvas: this,
          clearRect,
          save: vi.fn(),
          restore: vi.fn(),
          scale: vi.fn(),
          fillRect: vi.fn(),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          stroke: vi.fn(),
          fill: vi.fn(),
          arc: vi.fn(),
        } as unknown as CanvasRenderingContext2D
      }
      return originalGetContext.call(this, contextId as '2d')
    }
    HTMLCanvasElement.prototype.getContext = mockGetContext as unknown as typeof HTMLCanvasElement.prototype.getContext

    render(<DesignSection />)
    const canvas = screen.getByRole('img', { name: t('design.canvasLabel') })
    fireEvent.click(canvas)

    expect(clearRect).toHaveBeenCalled()

    HTMLCanvasElement.prototype.getContext = originalGetContext
  })

  it('does not throw when reduced motion is enabled', () => {
    reducedMotionMock.value = true
    expect(() => render(<DesignSection />)).not.toThrow()
    expect(screen.getByRole('img', { name: t('design.canvasLabel') })).toBeInTheDocument()
    expect(screen.getByText(t(design.introKey))).toBeInTheDocument()
  })

  it('has design id on section', () => {
    const { container } = render(<DesignSection />)
    expect(container.querySelector('section')).toHaveAttribute('id', 'design')
  })
})
