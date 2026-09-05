import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import { ShowcaseSection } from './ShowcaseSection'
import {
  归一化位移,
  钳制滚动增量,
  计算份数,
  取缓动时距,
  指数缓动系数,
  是否滚动按键,
  推进一帧,
  缓动时距,
} from './marqueeEngine'
import { showcaseRows } from '../../data/showcase'
import { t } from '../../i18n/translations'

describe('ShowcaseSection（12-next-spline-3d HeroParallax 移植）', () => {
  it('renders the gradient header with both title lines and subtitle', () => {
    render(<ShowcaseSection />)
    expect(screen.getByText(t('showcase.titleLine1'))).toBeInTheDocument()
    expect(screen.getByText(t('showcase.titleLine2'))).toBeInTheDocument()
    expect(screen.getByText(t('showcase.subtitle'))).toBeInTheDocument()
  })

  it('renders every card of all three rows', () => {
    render(<ShowcaseSection />)
    for (const row of showcaseRows) {
      for (const card of row.cards) {
        // 每张逻辑卡片至少渲染一次（marquee 无缝循环会渲染两份相同卡片组）
        expect(screen.getAllByText(t(card.titleKey)).length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText(t(card.descKey)).length).toBeGreaterThanOrEqual(1)
      }
    }
    // 15 张逻辑卡 × 2 份（无缝 marquee 轨道）：3 行 × 5 张 × 2
    const expected = showcaseRows.reduce((n, r) => n + r.cards.length, 0) * 2
    const cards = document.querySelectorAll('.group\\/card')
    expect(cards).toHaveLength(expected)
  })

  it('keeps original section anchors so navigation still works', () => {
    render(<ShowcaseSection />)
    for (const id of ['education', 'design', 'media']) {
      const anchor = document.getElementById(id)
      expect(anchor).not.toBeNull()
    }
  })

  it('ports the neon gradient border design on every card', () => {
    render(<ShowcaseSection />)
    // 30 张 = 15 逻辑卡 × 2 份 marquee 轨道
    const cards = document.querySelectorAll('.group\\/card')
    expect(cards).toHaveLength(30)
    for (const card of cards) {
      const border = card.querySelector('.bg-gradient-to-r') as HTMLElement
      expect(border).not.toBeNull()
      expect(border.className).toMatch(/shadow-\[0_0_30px_5px_rgba\(/)
      const inner = border.firstElementChild as HTMLElement
      expect(inner.className).toContain('bg-black')
    }
  })

  it('renders the bilibili card as an external link and others as plain cards', () => {
    render(<ShowcaseSection />)
    const escapedTitle = t('showcase.cards.courses.title').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // marquee 渲染两份，故 bilibili 链接出现两次，均应为外链
    const links = screen.getAllByRole('link', { name: new RegExp(escapedTitle) })
    expect(links.length).toBe(2)
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('href', 'https://space.bilibili.com/383504924')
    }

    const degreeTextNodes = screen.getAllByText(t('showcase.cards.degree.title'))
    for (const node of degreeTextNodes) {
      const degreeCard = node.closest('.group\\/card') as HTMLElement
      expect(within(degreeCard).queryByRole('link')).toBeNull()
    }
  })

  it('renders rows statically without inline transform under reduced motion', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia

    render(<ShowcaseSection />)
    // 30 张 = 15 逻辑卡 × 2 份 marquee 轨道（reduced-motion 下静止但仍渲染两份）
    const cards = document.querySelectorAll('.group\\/card')
    expect(cards).toHaveLength(30)
    for (const card of cards) {
      const el = card as HTMLElement
      // 减少动效时不应注入 transform 行内样式（仅保留 drift 动画所需的 CSS 变量）
      expect(el.style.transform).toBe('')
    }
  })

  it('renders every showcase row anchor so navigation still works', () => {
    render(<ShowcaseSection />)
    for (const row of showcaseRows) {
      const anchor = document.getElementById(row.anchorId)
      expect(anchor).not.toBeNull()
    }
  })
})

describe('跑马灯周期归一化', () => {
  it('正负位移收敛到半开区间', () => {
    expect(归一化位移(0, 1200)).toBe(0)
    expect(归一化位移(300, 1200)).toBe(300)
    expect(归一化位移(1200, 1200)).toBe(0)
    expect(归一化位移(1500, 1200)).toBe(300)
    expect(归一化位移(-1, 1200)).toBe(1199)
    expect(归一化位移(-1500, 1200)).toBe(900)
  })

  it('非正周期与非有限位移回零不崩', () => {
    expect(归一化位移(300, 0)).toBe(0)
    expect(归一化位移(300, -5)).toBe(0)
    expect(归一化位移(Number.NaN, 1200)).toBe(0)
  })

  it.each([1, -1] as const)('方向 %i 长序列步进无重置突变', (方向) => {
    const 周期 = 1200
    const 单帧上限 = 50 / 60 + 80 * 0.5 + 1
    let 位移 = 0
    let 速度 = 50
    let 上一视觉 = 0
    for (let i = 0; i < 6000; i++) {
      const 已暂停 = i % 1000 >= 750
      const 滚动增量 = i % 200 < 40 ? ((i * 37) % 320) - 160 : 0
      const 结果 = 推进一帧({
        位移,
        速度,
        周期,
        方向,
        基准速度: 50,
        已暂停,
        滚动暂停中: 已暂停,
        步长秒: 1 / 60,
        滚动增量,
      })
      expect(Number.isFinite(结果.位移)).toBe(true)
      expect(结果.位移).toBeGreaterThanOrEqual(0)
      expect(结果.位移).toBeLessThan(周期)
      const 跳变 = Math.abs(结果.位移 - 上一视觉)
      expect(跳变 <= 单帧上限 || 跳变 >= 周期 - 单帧上限).toBe(true)
      位移 = 结果.位移
      速度 = 结果.速度
      上一视觉 = 结果.位移
    }
  })

  it('非有限滚动增量不污染位移', () => {
    const 结果 = 推进一帧({
      位移: 100,
      速度: 50,
      周期: 1200,
      方向: 1,
      基准速度: 50,
      已暂停: false,
      滚动暂停中: false,
      步长秒: 1 / 60,
      滚动增量: Number.NaN,
    })
    expect(Number.isFinite(结果.位移)).toBe(true)
    expect(结果.位移).toBeGreaterThanOrEqual(0)
    expect(结果.位移).toBeLessThan(1200)
  })
})

describe('跑马灯滚动联动与暂停语义', () => {
  it('滚动增量钳制到对称上限', () => {
    expect(钳制滚动增量(30)).toBe(30)
    expect(钳制滚动增量(-30)).toBe(-30)
    expect(钳制滚动增量(500)).toBe(80)
    expect(钳制滚动增量(-500)).toBe(-80)
    expect(钳制滚动增量(Number.NaN)).toBe(0)
  })

  it('暂停收敛静止但滚动联动仍生效', () => {
    let 速度 = 50
    let 位移 = 0
    for (let i = 0; i < 600; i++) {
      const 结果 = 推进一帧({
        位移,
        速度,
        周期: 1200,
        方向: 1,
        基准速度: 50,
        已暂停: true,
        滚动暂停中: true,
        步长秒: 1 / 60,
        滚动增量: 0,
      })
      位移 = 结果.位移
      速度 = 结果.速度
    }
    expect(速度).toBe(0)
    const 联动 = 推进一帧({
      位移,
      速度,
      周期: 1200,
      方向: 1,
      基准速度: 50,
      已暂停: true,
      滚动暂停中: true,
      步长秒: 1 / 60,
      滚动增量: 60,
    })
    expect(联动.位移).not.toBe(位移)
  })

  it('缓动时距按暂停来源选择', () => {
    expect(取缓动时距(true, true)).toBe(缓动时距.滚动)
    expect(取缓动时距(true, false)).toBe(缓动时距.悬停)
    expect(取缓动时距(false, false)).toBe(缓动时距.恢复)
  })

  it('指数缓动系数边界自洽', () => {
    expect(指数缓动系数(0, 0.7)).toBe(0)
    expect(指数缓动系数(1 / 60, 0)).toBe(0)
    const 快 = 指数缓动系数(1 / 60, 0.18)
    const 慢 = 指数缓动系数(1 / 60, 0.7)
    expect(快).toBeGreaterThan(慢)
    expect(快).toBeGreaterThan(0)
    expect(快).toBeLessThan(1)
  })

  it('滚动按键识别覆盖键盘滚动全通道', () => {
    for (const 按键 of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'PageUp', 'PageDown', 'Home', 'End']) {
      expect(是否滚动按键(按键)).toBe(true)
    }
    expect(是否滚动按键('a')).toBe(false)
    expect(是否滚动按键('Enter')).toBe(false)
  })

  it('副本数覆盖视口变化与非法输入', () => {
    expect(计算份数(1024, 500)).toBe(5)
    expect(计算份数(0, 500)).toBe(2)
    expect(计算份数(1024, 0)).toBe(2)
    for (const 视口 of [320, 768, 1024, 1920, 3840]) {
      const 份数 = 计算份数(视口, 500)
      expect(份数).toBeGreaterThanOrEqual(2)
      expect(份数 * 500).toBeGreaterThanOrEqual(视口 + 500)
    }
  })
})

describe('跑马灯布局不变量测量', () => {
  const 原始宽度描述符 = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
  const 原始视口描述符 = Object.getOwnPropertyDescriptor(window, 'innerWidth')

  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 500 })
  })

  afterEach(() => {
    if (原始宽度描述符) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', 原始宽度描述符)
    if (原始视口描述符) Object.defineProperty(window, 'innerWidth', 原始视口描述符)
  })

  it('按布局宽度计算副本数', async () => {
    render(<ShowcaseSection />)
    await waitFor(() => {
      expect(document.querySelectorAll('.group\\/card')).toHaveLength(75)
    })
  })
})
