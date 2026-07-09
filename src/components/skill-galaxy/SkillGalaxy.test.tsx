import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkillGalaxy } from './SkillGalaxy'
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
  useThree: vi.fn(() => ({ pointer: { x: 0, y: 0 } })),
}))

describe('SkillGalaxy', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(false)
  })

  it('renders fallback while performance profile is loading', () => {
    vi.spyOn(usePerformanceProfileModule, 'usePerformanceProfile').mockReturnValue({
      level: 'high',
      settings: {
        dpr: 1,
        particleCount: 15000,
        bloom: { levels: 6, resolutionScale: 0.75 },
        dof: { resolutionScale: 0.5 },
        shadows: true,
        postProcessing: true,
        volumetric: true,
      },
      loading: true,
    })

    render(<SkillGalaxy className="test-class" />)
    expect(screen.getByTestId('skill-galaxy-fallback')).toBeInTheDocument()
  })

  it('renders canvas when performance profile is ready', () => {
    vi.spyOn(usePerformanceProfileModule, 'usePerformanceProfile').mockReturnValue({
      level: 'high',
      settings: {
        dpr: 1,
        particleCount: 15000,
        bloom: { levels: 6, resolutionScale: 0.75 },
        dof: { resolutionScale: 0.5 },
        shadows: true,
        postProcessing: true,
        volumetric: true,
      },
      loading: false,
    })

    render(<SkillGalaxy className="test-class" />)
    expect(screen.getByTestId('mock-canvas')).toBeInTheDocument()
  })

  it('uses reduced motion preference to stop frame loop', () => {
    vi.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(true)
    vi.spyOn(usePerformanceProfileModule, 'usePerformanceProfile').mockReturnValue({
      level: 'low',
      settings: {
        dpr: 1,
        particleCount: 5000,
        bloom: { levels: 2, resolutionScale: 0.5 },
        dof: { resolutionScale: 0.5 },
        shadows: false,
        postProcessing: false,
        volumetric: false,
      },
      loading: false,
    })

    render(<SkillGalaxy />)
    expect(screen.getByTestId('mock-canvas')).toBeInTheDocument()
  })
})
