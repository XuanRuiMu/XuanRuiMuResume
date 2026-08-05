import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInertialScroll } from './useInertialScroll'

// 控制 requestAnimationFrame：把回调排队，手动刷帧以驱动 lerp 循环收敛
let 帧队列: FrameRequestCallback[] = []
let rafId = 0
const 原始RAF = globalThis.requestAnimationFrame
const 原始CAF = globalThis.cancelAnimationFrame

function 安装RAFMock() {
  rafId = 0
  帧队列 = []
  globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
    帧队列.push(cb)
    return ++rafId
  }) as typeof requestAnimationFrame
  globalThis.cancelAnimationFrame = vi.fn((_id: number) => {
    帧队列 = []
  }) as typeof cancelAnimationFrame
}

// 手动刷 n 帧；循环停止（无新回调）时自动结束
function 刷帧(n: number) {
  for (let i = 0; i < n; i++) {
    const 当前 = 帧队列
    帧队列 = []
    if (当前.length === 0) break
    当前.forEach((cb) => cb(0))
  }
}

function 设置MatchMedia(减少动画匹配: boolean, 粗指针匹配: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => {
      let matches = false
      if (query.includes('prefers-reduced-motion')) matches = 减少动画匹配
      else if (query.includes('pointer: coarse')) matches = 粗指针匹配
      return {
        matches,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList
    }),
  })
}

function 派发滚轮(目标: EventTarget, deltaY: number, deltaMode = 0) {
  const 事件 = new WheelEvent('wheel', {
    deltaY,
    deltaMode,
    cancelable: true,
    bubbles: true,
  })
  // 让 target 命中指定节点
  Object.defineProperty(事件, 'target', { value: 目标, configurable: true })
  act(() => {
    window.dispatchEvent(事件)
  })
  return 事件
}

describe('useInertialScroll', () => {
  let scrollToSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    安装RAFMock()
    scrollToSpy = vi.fn()
    // jsdom 未实现 window.scrollTo
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo
    // 让视口有可滚动空间
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: 5000,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1000,
    })
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    })
  })

  afterEach(() => {
    globalThis.requestAnimationFrame = 原始RAF
    globalThis.cancelAnimationFrame = 原始CAF
    vi.restoreAllMocks()
  })

  it('劫持 wheel 并驱动 scrollTo（缓冲衰减）', () => {
    设置MatchMedia(false, false)
    renderHook(() => useInertialScroll())

    const 事件 = 派发滚轮(window, 300)
    // 阻止了原生滚动
    expect(事件.defaultPrevented).toBe(true)

    刷帧(300)
    // rAF 启动并至少 scrollTo 一次，收敛后应停在目标位置附近
    expect(scrollToSpy).toHaveBeenCalled()
    const 最终 = scrollToSpy.mock.calls[scrollToSpy.mock.calls.length - 1][1] as number
    expect(最终).toBeCloseTo(300, 0)
  })

  it('reduced-motion 时走原生（不劫持）', () => {
    设置MatchMedia(true, false)
    renderHook(() => useInertialScroll())

    const 事件 = 派发滚轮(window, 300)
    expect(事件.defaultPrevented).toBe(false)
    expect(scrollToSpy).not.toHaveBeenCalled()
  })

  it('粗指针（触摸）时走原生（不劫持）', () => {
    设置MatchMedia(false, true)
    renderHook(() => useInertialScroll())

    const 事件 = 派发滚轮(window, 300)
    expect(事件.defaultPrevented).toBe(false)
    expect(scrollToSpy).not.toHaveBeenCalled()
  })

  it('内部可滚动容器放行原生', () => {
    设置MatchMedia(false, false)
    renderHook(() => useInertialScroll())

    const 容器 = document.createElement('div')
    容器.style.overflowY = 'auto'
    // 模拟内容溢出（jsdom 无布局）
    Object.defineProperty(容器, 'scrollHeight', { value: 400, configurable: true })
    Object.defineProperty(容器, 'clientHeight', { value: 100, configurable: true })
    const 子 = document.createElement('div')
    容器.appendChild(子)
    document.body.appendChild(容器)

    const 事件 = 派发滚轮(子, 300)
    expect(事件.defaultPrevented).toBe(false)
    expect(scrollToSpy).not.toHaveBeenCalled()

    document.body.removeChild(容器)
  })

  it('限幅：目标不超过最大可滚动距离', () => {
    设置MatchMedia(false, false)
    renderHook(() => useInertialScroll())

    // 一次性巨大滚动，目标应被 clamp 到 [0, 4000]
    派发滚轮(window, 999999)
    刷帧(500)
    const 最终 = scrollToSpy.mock.calls[scrollToSpy.mock.calls.length - 1][1] as number
    expect(最终).toBeLessThanOrEqual(4000)
    expect(最终).toBeCloseTo(4000, 0)
  })
})
