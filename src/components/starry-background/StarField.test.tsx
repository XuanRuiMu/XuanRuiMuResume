import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { StarField } from './StarField'
import { getDefaultNebulaParams } from './nebulaConfig'

vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
}))

describe('StarField', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('渲染 points 图元', () => {
    const params = getDefaultNebulaParams(100, false)
    const { container } = render(<StarField params={params} pixelRatio={1} reducedMotion={false} seed={7} />)
    expect(container.querySelector('points')).toBeInTheDocument()
  })

  it('reducedMotion 模式下仍渲染', () => {
    const params = getDefaultNebulaParams(100, false)
    const { container } = render(<StarField params={params} pixelRatio={1} reducedMotion={true} seed={7} />)
    expect(container.querySelector('points')).toBeInTheDocument()
  })

  it('不同 seed 渲染相同结构', () => {
    const params = getDefaultNebulaParams(100, false)
    const { container: a } = render(<StarField params={params} pixelRatio={1} reducedMotion={false} seed={1} />)
    const { container: b } = render(<StarField params={params} pixelRatio={1} reducedMotion={false} seed={2} />)
    expect(a.querySelector('points')).toBeInTheDocument()
    expect(b.querySelector('points')).toBeInTheDocument()
  })
})
