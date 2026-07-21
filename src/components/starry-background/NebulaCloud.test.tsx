import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { NebulaCloud } from './NebulaCloud'
import { getDefaultNebulaParams } from './nebulaConfig'

vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
}))

describe('NebulaCloud', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('渲染 mesh 图元', () => {
    const params = getDefaultNebulaParams(100, false, true)
    const { container } = render(<NebulaCloud params={params} reducedMotion={false} />)
    expect(container.querySelector('mesh')).toBeInTheDocument()
  })

  it('volumetric 关闭时仍渲染', () => {
    const params = getDefaultNebulaParams(100, false, false)
    const { container } = render(<NebulaCloud params={params} reducedMotion={false} />)
    expect(container.querySelector('mesh')).toBeInTheDocument()
  })

  it('reducedMotion 模式下仍渲染', () => {
    const params = getDefaultNebulaParams(100, false, true)
    const { container } = render(<NebulaCloud params={params} reducedMotion={true} />)
    expect(container.querySelector('mesh')).toBeInTheDocument()
  })
})
