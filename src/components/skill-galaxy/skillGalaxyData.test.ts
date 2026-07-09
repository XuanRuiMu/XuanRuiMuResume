import { describe, it, expect } from 'vitest'
import { 生成星系数据 } from './skillGalaxyData'
import { skillGroups } from '../../data/skills'

describe('skillGalaxyData', () => {
  it('generates deterministic data for the same input', () => {
    const first = 生成星系数据(1000)
    const second = 生成星系数据(1000)
    expect(first.技能节点).toEqual(second.技能节点)
    expect(first.背景粒子位置).toEqual(second.背景粒子位置)
    expect(first.连线位置).toEqual(second.连线位置)
  })

  it('generates one node per skill item', () => {
    const totalItems = skillGroups.reduce((sum, group) => sum + group.items.length, 0)
    const data = 生成星系数据(100)
    expect(data.技能节点.length).toBe(totalItems)
  })

  it('generates arrays sized for the requested particle count', () => {
    const count = 500
    const data = 生成星系数据(count)
    expect(data.背景粒子位置.length).toBe(count * 3)
    expect(data.背景粒子颜色.length).toBe(count * 3)
  })

  it('generates line data only when nodes are close enough', () => {
    const sparse = 生成星系数据(10)
    const dense = 生成星系数据(10)
    expect(sparse.连线位置.length).toBe(dense.连线位置.length)
    expect(sparse.连线位置.length % 6).toBe(0)
  })

  it('assigns colors from section meta', () => {
    const data = 生成星系数据(100)
    const firstNode = data.技能节点[0]
    expect(firstNode.颜色).toMatch(/^#[0-9a-fA-F]{6}$/)
  })
})
