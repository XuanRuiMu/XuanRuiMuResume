import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { StarCoreLayer } from './StarCoreLayer'
import { getDefaultNebulaParams } from './nebulaConfig'

vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    camera: {
      position: { x: 0, y: 0, z: 30 },
      lookAt: vi.fn(),
    },
  })),
}))

describe('StarCoreLayer', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('渲染 mesh 图元作为核心辉光', () => {
    const params = getDefaultNebulaParams(100, false)
    const { container } = render(<StarCoreLayer params={params} reducedMotion={false} />)
    expect(container.querySelector('mesh')).toBeInTheDocument()
  })

  it('reducedMotion 模式下仍渲染（仅停止 pulse 动画）', () => {
    const params = getDefaultNebulaParams(100, false)
    const { container } = render(<StarCoreLayer params={params} reducedMotion={true} />)
    expect(container.querySelector('mesh')).toBeInTheDocument()
  })

  it('浅色主题下渲染', () => {
    const params = getDefaultNebulaParams(100, true)
    const { container } = render(<StarCoreLayer params={params} reducedMotion={false} />)
    expect(container.querySelector('mesh')).toBeInTheDocument()
  })
})
