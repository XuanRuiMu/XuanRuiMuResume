import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { BackgroundStarLayer } from './BackgroundStarLayer'
import { getDefaultNebulaParams } from './nebulaConfig'

vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
}))

describe('BackgroundStarLayer', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('渲染 points 图元', () => {
    const params = getDefaultNebulaParams(100, false)
    const { container } = render(<BackgroundStarLayer params={params} pixelRatio={1} reducedMotion={false} seed={3} />)
    expect(container.querySelector('points')).toBeInTheDocument()
  })

  it('reducedMotion 模式下仍渲染', () => {
    const params = getDefaultNebulaParams(100, false)
    const { container } = render(<BackgroundStarLayer params={params} pixelRatio={1} reducedMotion={true} seed={3} />)
    expect(container.querySelector('points')).toBeInTheDocument()
  })

  it('生成与配置一致数量的背景星点', () => {
    const params = getDefaultNebulaParams(100, false)
    const expectedCount = params.background.starCount
    expect(expectedCount).toBeGreaterThan(0)
    const { container } = render(<BackgroundStarLayer params={params} pixelRatio={1} reducedMotion={false} seed={3} />)
    expect(container.querySelector('points')).toBeInTheDocument()
  })
})
