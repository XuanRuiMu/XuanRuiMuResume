import { useEffect } from 'react'

/**
 * 全局惯性平滑滚动控制器（零依赖，参考智谱官网的"缓冲"滚动）。
 *
 * 根因：原生滚动在 src/index.css 中 `scroll-behavior: auto` 关闭了 CSS 平滑，
 * 停止生硬、无惯性。本控制器劫持 window 的 wheel 事件，累积「目标位移」，
 * 用单条 rAF 循环以 lerp 逼近「当前位移」，实现柔和减速与吸附停。
 *
 * 守卫（不劫持、走原生）：
 *  - prefers-reduced-motion: reduce → 尊重减少动画偏好
 *  - pointer: coarse（触摸设备）→ 触屏原生手势更自然，避免吞掉橡皮筋
 *  - 事件发生在内部可滚动容器（命令面板 / AI 聊天 / 特效面板 / overflow-auto）→ 放行原生
 *  - 仅拦截 wheel，键盘（方向键、空格、Home/End、PageUp/Down）滚动不受影响
 *
 * 与现有能力兼容：
 *  - 我们手动 window.scrollTo 会触发 scroll 事件 → 章节 IntersectionObserver 正常刷新 activeSection
 *  - transitionToSection（⌘K / 导航点击）走原生 scrollIntoView，本控制器只在 wheel 时启动，互不冲突
 *  - 下一帧 wheel 以真实 window.scrollY 重新基准，承接任意程序化跳转后的位置
 */

// 每帧逼近比例：越小越"黏"、减速越长；0.12 接近智谱式缓冲手感
const 缓动系数 = 0.12
// 当 |目标位移 - 当前位移| 小于该值即吸附并停止 rAF，避免空转耗 CPU
const 吸附阈值 = 0.5
// 滚轮灵敏度（可整体调参）
const 灵敏度 = 1
// deltaMode === 1（行）时，每行折算的像素
const 行高像素 = 16
// deltaMode === 2（页）时，按视口高度折算
const 取视口高度 = () => window.innerHeight

export function useInertialScroll(): void {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    // 守卫条件：实时读取 .matches 以支持运行时偏好切换
    const 减少动画 = window.matchMedia('(prefers-reduced-motion: reduce)')
    const 粗指针 = window.matchMedia('(pointer: coarse)')

    // 控制器状态（闭包内，单例）
    let 目标位移 = window.scrollY
    let 当前位移 = window.scrollY
    let 运行中 = false
    let 动画帧 = 0
    let 最大位移 = 0

    const 重算最大位移 = () => {
      // 每帧只读一次的开销挪到必要时刻：resize 与每个手势起点
      最大位移 = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    }
    重算最大位移()

    const 限幅 = (值: number): number => Math.min(Math.max(值, 0), 最大位移)

    // 判断事件是否发生在"自身可滚动容器"内：是则放行原生滚动
    const 内部可滚动 = (目标: EventTarget | null): boolean => {
      // 非元素（window/document 等）→ 视为整页滚动，由本控制器接管
      if (!(目标 instanceof HTMLElement)) return false
      let 节点: HTMLElement | null = 目标
      // 不把 html/body 当作内部容器（整页滚动由本控制器接管）
      while (节点 && 节点 !== document.documentElement && 节点 !== document.body) {
        const 样式 = getComputedStyle(节点)
        const 纵向溢出 = 样式.overflowY === 'auto' || 样式.overflowY === 'scroll'
        if (纵向溢出 && 节点.scrollHeight > 节点.clientHeight + 1) return true
        节点 = 节点.parentElement
      }
      return false
    }

    const 帧循环 = () => {
      const 差值 = 目标位移 - 当前位移
      if (Math.abs(差值) < 吸附阈值) {
        // 吸附到目标并停止循环，释放 CPU
        当前位移 = 目标位移
        window.scrollTo(0, 当前位移)
        运行中 = false
        动画帧 = 0
        return
      }
      当前位移 += 差值 * 缓动系数
      window.scrollTo(0, 当前位移)
      动画帧 = requestAnimationFrame(帧循环)
    }

    const 启动 = () => {
      if (运行中) return
      运行中 = true
      动画帧 = requestAnimationFrame(帧循环)
    }

    const 处理滚轮 = (事件: WheelEvent) => {
      // 守卫：减少动画 / 触摸设备 → 不劫持，原生滚动
      if (减少动画.matches || 粗指针.matches) return
      // 守卫：内部可滚动容器 → 放行原生
      if (内部可滚动(事件.target)) return

      // 以当前真实滚动位置重新基准，承接锚点跳转 / ⌘K 之后的位置
      当前位移 = window.scrollY
      目标位移 = 当前位移
      重算最大位移()

      // 归一化 deltaY：deltaMode 0=像素 1=行 2=页
      let 步长 = 事件.deltaY
      if (事件.deltaMode === 1) 步长 = 事件.deltaY * 行高像素
      else if (事件.deltaMode === 2) 步长 = 事件.deltaY * 取视口高度()
      步长 *= 灵敏度

      目标位移 = 限幅(目标位移 + 步长)

      // 阻止原生滚动，改由 rAF 驱动，制造缓冲
      事件.preventDefault()
      启动()
    }

    window.addEventListener('wheel', 处理滚轮, { passive: false })
    window.addEventListener('resize', 重算最大位移)

    return () => {
      window.removeEventListener('wheel', 处理滚轮, { passive: false } as EventListenerOptions)
      window.removeEventListener('resize', 重算最大位移)
      if (动画帧) cancelAnimationFrame(动画帧)
      运行中 = false
      动画帧 = 0
    }
  }, [])
}
