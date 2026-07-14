import { useEffect, useRef, useState, useCallback } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface 粒子 {
  x: number
  y: number
  vx: number
  vy: number
  生命周期: number
  最大生命周期: number
  大小: number
  颜色: string
  类型: '光点' | '星尘' | '符文'
  旋转: number
  旋转速度: number
}

interface 光标状态 {
  x: number
  y: number
  可见: boolean
  悬浮输入元素: boolean
}

interface 玄幻光标配置 {
  最大粒子数: number
  粒子生成间隔: number
  画布缩放比: number
}

const 默认配置: 玄幻光标配置 = {
  最大粒子数: 72,
  粒子生成间隔: 10,
  画布缩放比: 1,
}

function 是否触摸设备(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches
}

function 是否输入元素(元素: EventTarget | null): boolean {
  if (!(元素 instanceof HTMLElement)) return false
  const 标签名 = 元素.tagName.toLowerCase()
  return (
    标签名 === 'input' ||
    标签名 === 'textarea' ||
    标签名 === 'select' ||
    元素.isContentEditable ||
    元素.getAttribute('role') === 'textbox'
  )
}

function 随机颜色(): string {
  const 颜色 = ['#00d9ff', '#a55eea', '#ff6b9d', '#ffffff', '#7ee8fa', '#ffd700', '#ff9f43']
  return 颜色[Math.floor(Math.random() * 颜色.length)]
}

function 创建粒子(x: number, y: number, 移动速度: number): 粒子 {
  const 角度 = Math.random() * Math.PI * 2
  const 速度 = Math.random() * 2 + 0.5 + Math.min(移动速度 * 0.08, 3)
  const 类型随机 = Math.random()
  const 类型: 粒子['类型'] = 类型随机 > 0.82 ? '符文' : 类型随机 > 0.55 ? '星尘' : '光点'
  const 基础大小 =
    类型 === '光点' ? 3 + Math.random() * 4 : 类型 === '星尘' ? 1.5 + Math.random() * 2.5 : 5 + Math.random() * 4

  return {
    x,
    y,
    vx: Math.cos(角度) * 速度,
    vy: Math.sin(角度) * 速度 + 0.3,
    生命周期: 1,
    最大生命周期: 0.9 + Math.random() * 1.1,
    大小: 基础大小,
    颜色: 随机颜色(),
    类型,
    旋转: Math.random() * Math.PI * 2,
    旋转速度: (Math.random() - 0.5) * 0.2,
  }
}

export function useFantasyCursor(画布: React.RefObject<HTMLCanvasElement | null>, 配置 = 默认配置) {
  const 减少动画 = useReducedMotion()
  const [光标状态, 设置光标状态] = useState<光标状态>({
    x: -100,
    y: -100,
    可见: false,
    悬浮输入元素: false,
  })
  const 是触摸设备引用 = useRef(是否触摸设备())
  const 粒子列表 = useRef<粒子[]>([])
  const 最后生成时间 = useRef(0)
  const 上一鼠标位置 = useRef<{ x: number; y: number } | null>(null)
  const 动画帧编号 = useRef<number | null>(null)

  const 启用 = !减少动画 && !是触摸设备引用.current

  const 绘制粒子 = useCallback((上下文: CanvasRenderingContext2D, 宽度: number, 高度: number) => {
    上下文.clearRect(0, 0, 宽度, 高度)

    for (let i = 粒子列表.current.length - 1; i >= 0; i--) {
      const 粒子 = 粒子列表.current[i]
      粒子.x += 粒子.vx
      粒子.y += 粒子.vy
      粒子.vy += 0.015
      粒子.vx *= 0.985
      粒子.vy *= 0.985
      粒子.生命周期 -= 0.01
      粒子.旋转 += 粒子.旋转速度

      if (粒子.生命周期 <= 0) {
        粒子列表.current.splice(i, 1)
        continue
      }

      const 进度 = 1 - 粒子.生命周期 / 粒子.最大生命周期
      const 透明度 = Math.max(0, Math.sin((1 - 进度) * Math.PI))
      上下文.save()
      上下文.globalAlpha = 透明度
      上下文.translate(粒子.x, 粒子.y)
      上下文.rotate(粒子.旋转)

      if (粒子.类型 === '光点') {
        const 渐变 = 上下文.createRadialGradient(0, 0, 0, 0, 0, 粒子.大小)
        渐变.addColorStop(0, 粒子.颜色)
        渐变.addColorStop(0.45, 粒子.颜色)
        渐变.addColorStop(1, 'transparent')
        上下文.fillStyle = 渐变
        上下文.shadowBlur = 粒子.大小 * 2
        上下文.shadowColor = 粒子.颜色
        上下文.beginPath()
        上下文.arc(0, 0, 粒子.大小, 0, Math.PI * 2)
        上下文.fill()
      } else if (粒子.类型 === '星尘') {
        上下文.fillStyle = 粒子.颜色
        上下文.shadowBlur = 6
        上下文.shadowColor = 粒子.颜色
        上下文.beginPath()
        上下文.arc(0, 0, 粒子.大小 * 0.6, 0, Math.PI * 2)
        上下文.fill()
      } else {
        上下文.strokeStyle = 粒子.颜色
        上下文.lineWidth = 1.2
        上下文.shadowBlur = 6
        上下文.shadowColor = 粒子.颜色
        上下文.globalAlpha = 透明度 * 0.9
        const 符文大小 = 粒子.大小
        上下文.strokeRect(-符文大小 / 2, -符文大小 / 2, 符文大小, 符文大小)
        上下文.beginPath()
        上下文.moveTo(-符文大小 / 2, -符文大小 / 2)
        上下文.lineTo(符文大小 / 2, 符文大小 / 2)
        上下文.moveTo(符文大小 / 2, -符文大小 / 2)
        上下文.lineTo(-符文大小 / 2, 符文大小 / 2)
        上下文.stroke()
      }

      上下文.restore()
    }
  }, [])

  const 调整画布尺寸 = useCallback(() => {
    const 画布元素 = 画布.current
    if (!画布元素) return null

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const 宽度 = window.innerWidth
    const 高度 = window.innerHeight

    画布元素.width = Math.floor(宽度 * dpr * 配置.画布缩放比)
    画布元素.height = Math.floor(高度 * dpr * 配置.画布缩放比)
    画布元素.style.width = `${宽度}px`
    画布元素.style.height = `${高度}px`

    const 上下文 = 画布元素.getContext('2d')
    if (!上下文) return null
    上下文.scale(dpr * 配置.画布缩放比, dpr * 配置.画布缩放比)
    上下文.globalCompositeOperation = 'screen'
    return { 上下文, 宽度, 高度 }
  }, [画布, 配置.画布缩放比])

  const 动画循环 = useCallback(() => {
    if (!画布.current) {
      动画帧编号.current = requestAnimationFrame(动画循环)
      return
    }

    const 尺寸 = 调整画布尺寸()
    if (尺寸) {
      绘制粒子(尺寸.上下文, 尺寸.宽度, 尺寸.高度)
    }

    动画帧编号.current = requestAnimationFrame(动画循环)
  }, [画布, 调整画布尺寸, 绘制粒子])

  useEffect(() => {
    是触摸设备引用.current = 是否触摸设备()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (减少动画 || 是触摸设备引用.current) {
      if (动画帧编号.current) cancelAnimationFrame(动画帧编号.current)
      return
    }

    const 处理鼠标移动 = (event: MouseEvent) => {
      const x = event.clientX
      const y = event.clientY
      const 输入元素 = 是否输入元素(event.target)

      设置光标状态({
        x,
        y,
        可见: true,
        悬浮输入元素: 输入元素,
      })

      const 当前时间 = performance.now()
      if (上一鼠标位置.current) {
        const dx = x - 上一鼠标位置.current.x
        const dy = y - 上一鼠标位置.current.y
        const 距离 = Math.sqrt(dx * dx + dy * dy)
        const 移动速度 = 距离 / Math.max(当前时间 - 最后生成时间.current, 1)

        if (
          距离 > 3 &&
          当前时间 - 最后生成时间.current > 配置.粒子生成间隔 &&
          粒子列表.current.length < 配置.最大粒子数
        ) {
          粒子列表.current.push(创建粒子(x, y, 移动速度))
          最后生成时间.current = 当前时间
        }
      }
      上一鼠标位置.current = { x, y }
    }

    const 处理鼠标离开 = () => {
      设置光标状态((prev) => ({ ...prev, 可见: false }))
    }

    const 处理鼠标进入 = (event: MouseEvent) => {
      设置光标状态({
        x: event.clientX,
        y: event.clientY,
        可见: true,
        悬浮输入元素: 是否输入元素(event.target),
      })
    }

    const 处理尺寸变化 = () => {
      调整画布尺寸()
    }

    document.addEventListener('mousemove', 处理鼠标移动, { passive: true })
    document.addEventListener('mouseleave', 处理鼠标离开)
    document.addEventListener('mouseenter', 处理鼠标进入)
    window.addEventListener('resize', 处理尺寸变化, { passive: true })

    const 画布元素 = 画布.current
    if (画布元素) {
      调整画布尺寸()
      动画帧编号.current = requestAnimationFrame(动画循环)
    }

    return () => {
      document.removeEventListener('mousemove', 处理鼠标移动)
      document.removeEventListener('mouseleave', 处理鼠标离开)
      document.removeEventListener('mouseenter', 处理鼠标进入)
      window.removeEventListener('resize', 处理尺寸变化)
      if (动画帧编号.current) cancelAnimationFrame(动画帧编号.current)
    }
  }, [减少动画, 画布, 动画循环, 调整画布尺寸, 配置])

  return {
    光标状态,
    启用,
    减少动画,
  }
}
