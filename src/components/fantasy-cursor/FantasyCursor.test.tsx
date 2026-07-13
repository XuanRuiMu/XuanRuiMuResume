import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { FantasyCursor } from './FantasyCursor'

describe('FantasyCursor', () => {
  let matchMediaMatches = false

  beforeEach(() => {
    matchMediaMatches = false
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        get matches() {
          if (query === '(prefers-reduced-motion: reduce)') return matchMediaMatches
          if (query === '(pointer: coarse)') return false
          return false
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    Object.defineProperty(window, 'ontouchstart', {
      value: undefined,
      configurable: true,
    })

    const originalGetContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextId: string, options?: unknown) {
      if (contextId === '2d') {
        return {
          canvas: this,
          clearRect: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          translate: vi.fn(),
          rotate: vi.fn(),
          scale: vi.fn(),
          beginPath: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
          stroke: vi.fn(),
          strokeRect: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          createRadialGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
          })),
        } as unknown as CanvasRenderingContext2D
      }
      return originalGetContext.call(this, contextId as 'webgl', options)
    } as unknown as typeof HTMLCanvasElement.prototype.getContext

    global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      return window.setTimeout(() => cb(performance.now()), 16) as unknown as number
    })
    global.cancelAnimationFrame = vi.fn((id: number) => {
      window.clearTimeout(id)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders canvas and custom pointer when motion is not reduced', () => {
    render(<FantasyCursor />)
    expect(screen.getByTestId('fantasy-cursor-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('fantasy-cursor-pointer')).toBeInTheDocument()
  })

  it('does not render when reduced motion is preferred', () => {
    matchMediaMatches = true
    render(<FantasyCursor />)
    expect(screen.queryByTestId('fantasy-cursor-canvas')).not.toBeInTheDocument()
    expect(screen.queryByTestId('fantasy-cursor-pointer')).not.toBeInTheDocument()
  })

  it('updates pointer position on mouse move', async () => {
    const handler = vi.fn()
    document.addEventListener('mousemove', handler)
    render(<FantasyCursor />)
    const pointer = screen.getByTestId('fantasy-cursor-pointer')

    act(() => {
      fireEvent.mouseMove(document, { clientX: 120, clientY: 200 })
    })

    expect(handler).toHaveBeenCalled()
    document.removeEventListener('mousemove', handler)

    await waitFor(() => {
      expect(pointer).toHaveStyle({ left: '120px', top: '200px' })
    })
    expect(pointer).toHaveStyle({ opacity: '1' })
  })

  it('hides pointer when hovering input element', async () => {
    render(
      <>
        <input data-testid="test-input" />
        <FantasyCursor />
      </>
    )
    const pointer = screen.getByTestId('fantasy-cursor-pointer')
    const input = screen.getByTestId('test-input')

    act(() => {
      fireEvent.mouseMove(document, { clientX: 50, clientY: 50 })
    })
    await waitFor(() => {
      expect(pointer).toHaveStyle({ opacity: '1' })
    })

    act(() => {
      fireEvent.mouseMove(input, { clientX: 10, clientY: 10 })
    })
    await waitFor(() => {
      expect(pointer).toHaveStyle({ opacity: '0' })
    })
  })

  it('canvas has pointer-events none', () => {
    render(<FantasyCursor />)
    const canvas = screen.getByTestId('fantasy-cursor-canvas')
    expect(canvas).toHaveClass('pointer-events-none')
  })
})
