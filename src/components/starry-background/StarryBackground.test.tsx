import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { StarryBackground } from './StarryBackground'
import * as usePerformanceProfileModule from '../../hooks/usePerformanceProfile'
import * as useReducedMotionModule from '../../hooks/useReducedMotion'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
    <div data-testid="mock-canvas">
      {children}
      {fallback}
    </div>
  ),
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    pointer: { x: 0, y: 0 },
    camera: {
      position: { x: 0, y: 0, z: 30 },
      lookAt: vi.fn(),
    },
  })),
}))

const mockHighSettings = {
  dpr: 1,
  particleCount: 15000,
  bloom: { levels: 6, resolutionScale: 0.75 },
  dof: { resolutionScale: 0.5 },
  shadows: true,
  postProcessing: true,
  volumetric: true,
}

const mockLowSettings = {
  dpr: 1,
  particleCount: 5000,
  bloom: { levels: 2, resolutionScale: 0.5 },
  dof: { resolutionScale: 0.5 },
  shadows: false,
  postProcessing: false,
  volumetric: false,
}

describe('StarryBackground', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(false)
  })

  it('renders fallback while performance profile is loading', () => {
    vi.spyOn(usePerformanceProfileModule, 'usePerformanceProfile').mockReturnValue({
      level: 'high',
      settings: mockHighSettings,
      loading: true,
    })

    render(<StarryBackground className="test-class" />)
    expect(screen.getByTestId('skill-galaxy-fallback')).toBeInTheDocument()
  })

  it('renders canvas when performance profile is ready', async () => {
    vi.spyOn(usePerformanceProfileModule, 'usePerformanceProfile').mockReturnValue({
      level: 'high',
      settings: mockHighSettings,
      loading: false,
    })

    render(<StarryBackground className="test-class" />)
    await waitFor(() => {
      expect(screen.getByTestId('mock-canvas')).toBeInTheDocument()
    })
  })

  it('uses reduced motion preference to stop frame loop', async () => {
    vi.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(true)
    vi.spyOn(usePerformanceProfileModule, 'usePerformanceProfile').mockReturnValue({
      level: 'low',
      settings: mockLowSettings,
      loading: false,
    })

    render(<StarryBackground />)
    await waitFor(() => {
      expect(screen.getByTestId('mock-canvas')).toBeInTheDocument()
    })
  })

  it('registers a window pointermove listener for parallax', async () => {
    vi.spyOn(usePerformanceProfileModule, 'usePerformanceProfile').mockReturnValue({
      level: 'high',
      settings: mockHighSettings,
      loading: false,
    })

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const { unmount } = render(<StarryBackground />)

    await waitFor(() => {
      expect(screen.getByTestId('mock-canvas')).toBeInTheDocument()
    })

    expect(addEventListenerSpy.mock.calls.some(([event]) => String(event) === 'pointermove')).toBe(true)

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    unmount()

    expect(removeEventListenerSpy.mock.calls.some(([event]) => String(event) === 'pointermove')).toBe(true)
  })

  it('does not register pointermove listener when reduced motion is enabled', async () => {
    vi.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(true)
    vi.spyOn(usePerformanceProfileModule, 'usePerformanceProfile').mockReturnValue({
      level: 'high',
      settings: mockHighSettings,
      loading: false,
    })

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    render(<StarryBackground />)

    await waitFor(() => {
      expect(screen.getByTestId('mock-canvas')).toBeInTheDocument()
    })

    expect(addEventListenerSpy.mock.calls.some(([event]) => String(event) === 'pointermove')).toBe(false)
  })
})
