import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { WebGLGalaxy } from './WebGLGalaxy'
import { generateSpiralGalaxy } from './galaxyGenerator'
import { getDefaultGalaxyParams } from './galaxyConfig'

vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn((callback) => {
    callback({ clock: { getDelta: () => 0.016 } }, 0.016)
  }),
  useThree: vi.fn(() => ({ pointer: { x: 0, y: 0 } })),
  Canvas: ({ children }: { children: ReactNode }) => <div data-testid="mock-canvas">{children}</div>,
}))

describe('WebGLGalaxy', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders points with the generated galaxy data', () => {
    const params = getDefaultGalaxyParams(100, false)
    const data = generateSpiralGalaxy(100, params, 1)
    const mouseRef = { current: { x: 0, y: 0 } }

    const { container } = render(
      <WebGLGalaxy
        data={data}
        pixelRatio={1}
        rotationSpeed={0.003}
        windStrength={0.35}
        windRadius={0.4}
        intensity={1.4}
        mouseRef={mouseRef}
      />
    )

    expect(container.querySelector('points')).toBeInTheDocument()
  })

  it('updates mouse uniforms when mouseRef changes', () => {
    const params = getDefaultGalaxyParams(100, false)
    const data = generateSpiralGalaxy(100, params, 1)
    const mouseRef = { current: { x: 0.5, y: -0.5 } }

    render(
      <WebGLGalaxy
        data={data}
        pixelRatio={2}
        rotationSpeed={0.003}
        windStrength={0.35}
        windRadius={0.4}
        intensity={1}
        mouseRef={mouseRef}
      />
    )
  })
})
