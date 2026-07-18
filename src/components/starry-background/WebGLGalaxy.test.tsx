import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { WebGLGalaxy } from './WebGLGalaxy'
import { generateSpiralGalaxy } from './galaxyGenerator'
import { getDefaultGalaxyParams } from './galaxyConfig'
import { galaxyVertexShader } from './galaxyShaders'

import type * as THREE from 'three'

const { getLastShaderMaterialParams, ShaderMaterial, useFrame } = vi.hoisted(() => {
  let lastParams: Record<string, unknown> | null = null
  return {
    getLastShaderMaterialParams: () => lastParams,
    ShaderMaterial: vi.fn((params: Record<string, unknown>) => {
      lastParams = params
      return { uniforms: params.uniforms }
    }),
    useFrame: vi.fn((callback) => {
      callback({ clock: { getDelta: () => 0.016 } }, 0.016)
    }),
  }
})

vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three')
  return {
    ...actual,
    ShaderMaterial,
  }
})

vi.mock('@react-three/fiber', () => ({
  useFrame,
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
        pushStrength={2.0}
        pushRadius={4.0}
        pushDamping={3.0}
        intensity={1.4}
        mouseRef={mouseRef}
      />
    )

    expect(container.querySelector('points')).toBeInTheDocument()
  })

  it('uses a vertex shader with radial push uniforms and recovery terms', () => {
    expect(galaxyVertexShader).toContain('uPushStrength')
    expect(galaxyVertexShader).toContain('uPushRadius')
    expect(galaxyVertexShader).toContain('uPushDamping')
    expect(galaxyVertexShader).toContain('1.0 - smoothstep(0.0, uPushRadius, dist)')
    expect(galaxyVertexShader).toContain('exp(-cycle * uPushDamping')
    expect(galaxyVertexShader).toContain('aOriginalPosition')
  })

  it('passes push parameters and mouse ref to the shader material', () => {
    const params = getDefaultGalaxyParams(100, false)
    const data = generateSpiralGalaxy(100, params, 1)
    const mouseRef = { current: { x: 0.5, y: -0.5 } }

    render(
      <WebGLGalaxy
        data={data}
        pixelRatio={2}
        rotationSpeed={0.003}
        pushStrength={2.0}
        pushRadius={4.0}
        pushDamping={3.0}
        intensity={1}
        mouseRef={mouseRef}
      />
    )

    expect(useFrame).toHaveBeenCalled()

    const materialParams = getLastShaderMaterialParams()
    expect(materialParams).toBeDefined()
    const uniforms = materialParams?.uniforms as Record<string, { value: unknown }>
    expect(uniforms.uPushStrength.value).toBe(2.0)
    expect(uniforms.uPushRadius.value).toBe(4.0)
    expect(uniforms.uPushDamping.value).toBe(3.0)
    expect(uniforms.uMouse.value).toEqual([0, 0])
  })
})
