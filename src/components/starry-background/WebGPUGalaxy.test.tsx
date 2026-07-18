import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { WebGPUGalaxy } from './WebGPUGalaxy'
import { generateSpiralGalaxy } from './galaxyGenerator'
import { getDefaultGalaxyParams } from './galaxyConfig'

const { getLastPointsNodeMaterialParams, PointsNodeMaterial, useFrame } = vi.hoisted(() => {
  let lastParams: Record<string, unknown> | null = null
  return {
    getLastPointsNodeMaterialParams: () => lastParams,
    PointsNodeMaterial: vi.fn((params: Record<string, unknown>) => {
      lastParams = params
      return params
    }),
    useFrame: vi.fn((callback) => {
      callback({ clock: { getDelta: () => 0.016 } }, 0.016)
    }),
  }
})

vi.mock('@react-three/fiber', () => ({
  useFrame,
  useThree: vi.fn(() => ({ pointer: { x: 0, y: 0 } })),
  Canvas: ({ children }: { children: ReactNode }) => <div data-testid="mock-canvas">{children}</div>,
}))

vi.mock('three/webgpu', () => ({
  PointsNodeMaterial,
}))

vi.mock('three/tsl', () => ({
  add: vi.fn((a, b) => ({ add: [a, b] })),
  atan: vi.fn((y, x) => ({ atan: [y, x] })),
  attribute: vi.fn(() => ({ attribute: true })),
  clamp: vi.fn((x) => x),
  color: vi.fn((value) => ({ color: value })),
  div: vi.fn((a, b) => ({ div: [a, b] })),
  exp: vi.fn((a) => ({ exp: a })),
  float: vi.fn((value) => ({ float: value })),
  length: vi.fn((a) => ({ length: a })),
  log: vi.fn((a) => ({ log: a })),
  mix: vi.fn((a, b, t) => ({ mix: [a, b, t] })),
  mod: vi.fn((a, b) => ({ mod: [a, b] })),
  mul: vi.fn((...args) => ({ mul: args })),
  normalize: vi.fn((a) => ({ normalize: a })),
  sin: vi.fn((a) => ({ sin: a })),
  smoothstep: vi.fn((a, b, x) => ({ smoothstep: [a, b, x] })),
  sub: vi.fn((a, b) => ({ sub: [a, b] })),
  uniform: vi.fn((node) => ({ value: node })),
  vec2: vi.fn((x, y) => ({ vec2: [x, y] })),
  vec3: vi.fn((x, y, z) => ({ vec3: [x, y, z] })),
  vec4: vi.fn((x, y, z, w) => ({ vec4: [x, y, z, w] })),
}))

describe('WebGPUGalaxy', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders points with the generated galaxy data', () => {
    const params = getDefaultGalaxyParams(100, false)
    const data = generateSpiralGalaxy(100, params, 1)
    const mouseRef = { current: { x: 0, y: 0 } }

    const { container } = render(
      <WebGPUGalaxy
        data={data}
        rotationSpeed={0.003}
        pushStrength={2.0}
        pushRadius={4.0}
        pushDamping={3.0}
        palette={params.palette}
        arms={params.arms}
        tightness={params.tightness}
        intensity={params.intensity}
        sizeMultiplier={params.sizeMultiplier}
        mouseRef={mouseRef}
      />
    )

    expect(container.querySelector('points')).toBeInTheDocument()
  })

  it('builds a position node with push parameters', () => {
    const params = getDefaultGalaxyParams(100, false)
    const data = generateSpiralGalaxy(100, params, 1)
    const mouseRef = { current: { x: 0, y: 0 } }

    render(
      <WebGPUGalaxy
        data={data}
        rotationSpeed={0.003}
        pushStrength={2.5}
        pushRadius={5.0}
        pushDamping={3.5}
        palette={params.palette}
        arms={params.arms}
        tightness={params.tightness}
        intensity={params.intensity}
        sizeMultiplier={params.sizeMultiplier}
        mouseRef={mouseRef}
      />
    )

    expect(PointsNodeMaterial).toHaveBeenCalled()
    const materialParams = getLastPointsNodeMaterialParams()
    expect(materialParams).toBeDefined()
    expect(materialParams?.positionNode).toBeDefined()
  })

  it('registers the frame loop and builds a position node', () => {
    const params = getDefaultGalaxyParams(100, false)
    const data = generateSpiralGalaxy(100, params, 1)
    const mouseRef = { current: { x: 0.5, y: -0.5 } }

    render(
      <WebGPUGalaxy
        data={data}
        rotationSpeed={0.003}
        pushStrength={2.0}
        pushRadius={4.0}
        pushDamping={3.0}
        palette={params.palette}
        arms={params.arms}
        tightness={params.tightness}
        intensity={params.intensity}
        sizeMultiplier={params.sizeMultiplier}
        mouseRef={mouseRef}
      />
    )

    expect(useFrame).toHaveBeenCalled()
  })
})
