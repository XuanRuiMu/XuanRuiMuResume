import { useEffect, useRef } from 'react'
import { ExternalLink } from 'lucide-react'
import { projects } from '../../data/projects'
import { Section } from '../../components/ui/Section'
import { t } from '../../i18n/translations'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useProjectsWindStore, 风力下限, 风力上限 } from '../../store/useProjectsWindStore'
import { 晾衣架物理引擎, 晾衣架配置, type 晾衣架快照 } from './clotheslinePhysics'

// canvas 无法直接引用 CSS 变量，非 CSS 环境（如测试）下的兜底色；浏览器中始终以 index.css 的 --rope-* 变量为准
const 兜底绳色 = {
  银亮: '#e8eaed',
  银中: '#9aa0a6',
  银暗: '#5f6368',
  棕亮: '#a9743d',
  棕暗: '#6b4423',
} as const

function 读取绳色(容器: HTMLElement) {
  const 样式 = getComputedStyle(容器)
  const 读 = (名: string, 兜底: string) => 样式.getPropertyValue(名).trim() || 兜底
  return {
    银亮: 读('--rope-silver-light', 兜底绳色.银亮),
    银中: 读('--rope-silver-mid', 兜底绳色.银中),
    银暗: 读('--rope-silver-dark', 兜底绳色.银暗),
    棕亮: 读('--rope-brown-light', 兜底绳色.棕亮),
    棕暗: 读('--rope-brown-dark', 兜底绳色.棕暗),
  }
}

function 描画曲线(ctx: CanvasRenderingContext2D, 点列: Array<{ x: number; y: number }>) {
  if (点列.length < 2) return
  ctx.beginPath()
  ctx.moveTo(点列[0].x, 点列[0].y)
  for (let i = 1; i < 点列.length - 1; i++) {
    const 当前 = 点列[i]
    const 下一点 = 点列[i + 1]
    ctx.quadraticCurveTo(当前.x, 当前.y, (当前.x + 下一点.x) / 2, (当前.y + 下一点.y) / 2)
  }
  const 末点 = 点列[点列.length - 1]
  ctx.lineTo(末点.x, 末点.y)
  ctx.stroke()
}

function 绘制晾衣绳(
  canvas: HTMLCanvasElement,
  快照: 晾衣架快照,
  色: ReturnType<typeof 读取绳色>,
  宽: number,
  高: number
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const 目标宽 = Math.round(宽 * dpr)
  const 目标高 = Math.round(高 * dpr)
  if (canvas.width !== 目标宽 || canvas.height !== 目标高) {
    canvas.width = 目标宽
    canvas.height = 目标高
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, 宽, 高)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const 主绳渐变 = ctx.createLinearGradient(快照.主绳[0].x, 0, 快照.主绳[快照.主绳.length - 1].x, 0)
  主绳渐变.addColorStop(0, 色.银暗)
  主绳渐变.addColorStop(0.25, 色.银亮)
  主绳渐变.addColorStop(0.5, 色.银中)
  主绳渐变.addColorStop(0.75, 色.银亮)
  主绳渐变.addColorStop(1, 色.银暗)
  ctx.strokeStyle = 主绳渐变
  ctx.lineWidth = 3.6
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
  ctx.shadowBlur = 2
  ctx.shadowOffsetY = 1
  描画曲线(ctx, 快照.主绳)

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  ctx.lineWidth = 2.4
  for (let i = 0; i < 快照.吊绳.length; i++) {
    const 吊绳 = 快照.吊绳[i]
    const 便签顶Y = 快照.便签[i].y - 快照.便签[i].高 / 2
    const 吊绳渐变 = ctx.createLinearGradient(0, 吊绳[0].y, 0, 便签顶Y)
    吊绳渐变.addColorStop(0, 色.棕亮)
    吊绳渐变.addColorStop(1, 色.棕暗)
    ctx.strokeStyle = 吊绳渐变
    描画曲线(ctx, [...吊绳, { x: 快照.便签[i].x, y: 便签顶Y }])
  }
}

export function ProjectsSection() {
  const reducedMotion = useReducedMotion()
  const 风力强度 = useProjectsWindStore((s) => s.风力强度)
  const 设置风力强度 = useProjectsWindStore((s) => s.设置风力强度)
  const 容器Ref = useRef<HTMLDivElement>(null)
  const 画布Ref = useRef<HTMLCanvasElement>(null)
  const 便签Refs = useRef<Array<HTMLDivElement | null>>([])
  const 风力Ref = useRef(风力强度)

  useEffect(() => {
    风力Ref.current = 风力强度
  }, [风力强度])

  useEffect(() => {
    const 容器 = 容器Ref.current
    const 画布 = 画布Ref.current
    if (!容器 || !画布) return

    let 引擎: 晾衣架物理引擎 | null = null
    let rafId: number | null = null
    let 运行中 = false
    let 上次帧 = 0
    let 累积Ms = 0
    let 鼠标样本: { x: number; y: number; 时间: number } | null = null

    const 同步快照 = (快照: 晾衣架快照) => {
      for (let i = 0; i < 快照.便签.length; i++) {
        const el = 便签Refs.current[i]
        if (!el) continue
        const 便签 = 快照.便签[i]
        el.style.width = `${便签.宽.toFixed(2)}px`
        el.style.height = `${便签.高.toFixed(2)}px`
        el.style.transform = `translate(${(便签.x - 便签.宽 / 2).toFixed(2)}px, ${(便签.y - 便签.高 / 2).toFixed(2)}px) rotate(${便签.角度.toFixed(4)}rad)`
        el.style.opacity = '1'
      }
      绘制晾衣绳(画布, 快照, 读取绳色(容器), 容器.offsetWidth, 容器.offsetHeight)
    }

    const 构建 = () => {
      引擎?.销毁()
      const 宽 = 容器.offsetWidth
      if (宽 < 1) return
      引擎 = new 晾衣架物理引擎({ 宽, 高: 容器.offsetHeight })
      同步快照(引擎.获取快照())
    }

    const 停止循环 = () => {
      运行中 = false
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }

    const 启动循环 = () => {
      if (运行中 || !引擎 || reducedMotion) return
      运行中 = true
      上次帧 = performance.now()
      累积Ms = 0
      const tick = (现在: number) => {
        if (!运行中 || !引擎) return
        rafId = requestAnimationFrame(tick)
        累积Ms += 现在 - 上次帧
        上次帧 = 现在
        const 步长 = 晾衣架配置.求解.固定步长Ms
        let 步数 = 0
        while (累积Ms >= 步长 && 步数 < 晾衣架配置.求解.最大跳帧) {
          引擎.步进()
          累积Ms -= 步长
          步数 += 1
        }
        if (步数 === 晾衣架配置.求解.最大跳帧) 累积Ms = 0
        if (步数 > 0) 同步快照(引擎.获取快照())
      }
      rafId = requestAnimationFrame(tick)
    }

    构建()

    // 风监听挂在 section 级容器上：纯被动监听，不捕获指针、不 preventDefault，文字选择与链接点击不受影响
    const 风宿主 = 容器.closest('section') ?? 容器
    const 处理指针移动 = (e: PointerEvent) => {
      if (!引擎 || e.buttons !== 0) {
        鼠标样本 = null
        return
      }
      const 矩形 = 容器.getBoundingClientRect()
      const x = e.clientX - 矩形.left
      const y = e.clientY - 矩形.top
      const 现在 = performance.now()
      if (鼠标样本) {
        const dt = Math.max(现在 - 鼠标样本.时间, 1)
        引擎.登记风源(x, y, (x - 鼠标样本.x) / dt, (y - 鼠标样本.y) / dt, 风力Ref.current)
      }
      鼠标样本 = { x, y, 时间: 现在 }
    }

    const 处理可见性 = () => {
      if (document.hidden) {
        停止循环()
      } else {
        启动循环()
      }
    }

    let 观察器: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== 'undefined') {
      观察器 = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              启动循环()
            } else {
              停止循环()
            }
          }
        },
        { threshold: 0 }
      )
      观察器.observe(容器)
    }

    let 尺寸观察器: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      尺寸观察器 = new ResizeObserver(() => {
        const 曾运行 = 运行中
        停止循环()
        构建()
        if (曾运行) 启动循环()
      })
      尺寸观察器.observe(容器)
    }

    if (!reducedMotion) {
      风宿主.addEventListener('pointermove', 处理指针移动, { passive: true })
      document.addEventListener('visibilitychange', 处理可见性)
      启动循环()
    }

    return () => {
      停止循环()
      风宿主.removeEventListener('pointermove', 处理指针移动)
      document.removeEventListener('visibilitychange', 处理可见性)
      观察器?.disconnect()
      尺寸观察器?.disconnect()
      引擎?.销毁()
      引擎 = null
    }
  }, [reducedMotion])

  return (
    <Section id="projects" title={t('projects.title')} subtitle={t('projects.subtitle')}>
      <div className="mb-4 flex items-center justify-end gap-3 text-sm text-text-secondary">
        <span>{t('projects.wind.title')}</span>
        <input
          type="range"
          min={风力下限}
          max={风力上限}
          step={0.05}
          value={风力强度}
          aria-label={t('projects.wind.strength')}
          onChange={(e) => 设置风力强度(Number(e.target.value))}
          className="h-1.5 w-40 cursor-pointer accent-primary"
        />
        <span className="w-10 text-right tabular-nums">{`×${风力强度.toFixed(2)}`}</span>
      </div>
      <div ref={容器Ref} className="clothesline-region">
        <canvas ref={画布Ref} className="clothesline-canvas" aria-hidden="true" />
        {projects.map((project, index) => {
          const link = project.links?.[0]
          return (
            <div
              key={project.id}
              ref={(el) => {
                便签Refs.current[index] = el
              }}
              className="clothesline-note select-text"
              data-tint={index % 4}
            >
              <img src="/images/标准.png" alt="" className="clothesline-note-img" aria-hidden="true" />
              <div className="clothesline-note-tint" aria-hidden="true" />
              <div className="clothesline-note-content">
                <h3 className="font-display clothesline-note-title">{t(project.nameKey)}</h3>
                <p className="clothesline-note-desc">{t(project.descKey)}</p>
                {link && (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="clothesline-note-link inline-flex items-center gap-1 self-start transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    aria-label={`${t(project.nameKey)}：${t(link.labelKey)}`}
                  >
                    <span>{t(link.labelKey)}</span>
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
