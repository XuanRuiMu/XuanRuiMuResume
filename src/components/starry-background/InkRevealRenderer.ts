export interface InkRevealOptions {
  healSeconds?: number
  brushSize?: number
  enabled?: boolean
  /** 遮挡层颜色（默认深色模式用的近黑） */
  coverColor?: string
}

/**
 * 水墨揭示渲染器（极致还原 mimo.xiaomi.com 的水墨画笔效果）。
 *
 * 核心设计：
 * - 遮挡层是一张全屏 canvas，默认涂满 coverColor（z-index:1，盖住星空 z-0、被内容 z-10 压住）。
 * - 鼠标划过时，沿指针轨迹**插值**连续盖章（destination-out 擦除），快速移动也不断线。
 * - 笔刷是多层不规则径向渐变 blob + 内部"飞白"空隙 + 每章随机旋转/缩放/浓淡，模拟真实水墨晕染。
 * - 复原按需触发：只有发生过擦除才启动 rAF，渐隐回遮挡色，复原完成后停止循环（空闲零开销）。
 */
export class InkRevealRenderer {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly brush: HTMLCanvasElement
  private readonly brushCtx: CanvasRenderingContext2D
  private rafId: number | null = null
  private pointer = { x: -1000, y: -1000, active: false }
  private healAlpha: number
  private healSeconds: number
  private enabled: boolean
  private brushSize: number
  private readonly coverColor: string
  private readonly coverRgb: string
  private dpr = 1
  private lastStampTime = 0
  private lastMoveTime = 0

  constructor(options: InkRevealOptions = {}) {
    this.brushSize = options.brushSize ?? 160
    this.healSeconds = options.healSeconds ?? 2.8
    // 复原 alpha 调到复原窗口结束时约覆盖 95%，最后再一次填满，避免跳变。
    this.healAlpha = 3 / Math.max(20, this.healSeconds * 60)
    this.enabled = options.enabled ?? true
    this.coverColor = options.coverColor ?? '#05060f'
    this.coverRgb = this.hexToRgb(this.coverColor)

    this.canvas = document.createElement('canvas')
    this.canvas.className = 'ink-reveal-overlay'
    // z-index:1 —— 高于星空画布(z-0)、低于主内容(z-10)。
    this.canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;'
    const ctx = this.canvas.getContext('2d', { alpha: true })
    if (!ctx) throw new Error('无法创建 2D context')
    this.ctx = ctx

    this.brush = document.createElement('canvas')
    this.brush.width = this.brushSize * 2
    this.brush.height = this.brushSize * 2
    const brushCtx = this.brush.getContext('2d', { alpha: true })
    if (!brushCtx) throw new Error('无法创建 brush context')
    this.brushCtx = brushCtx
    this.buildBrush()

    this.resize()
    this.fillBlack()
  }

  mount(container: HTMLElement) {
    container.appendChild(this.canvas)
    window.addEventListener('resize', this.resize)
  }

  unmount() {
    window.removeEventListener('resize', this.resize)
    this.stopHeal()
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    this.stopHeal()
    if (!enabled) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    } else {
      this.fillBlack()
    }
  }

  setHealSeconds(seconds: number) {
    this.healSeconds = seconds
    this.healAlpha = 3 / Math.max(20, seconds * 60)
  }

  setBrushSize(size: number) {
    this.brushSize = Math.max(40, Math.min(size, 400))
    this.brush.width = this.brushSize * 2
    this.brush.height = this.brushSize * 2
    this.buildBrush()
  }

  onPointerMove(x: number, y: number) {
    if (!this.enabled) return
    const px = x * this.dpr
    const py = y * this.dpr
    const now = performance.now()
    if (this.pointer.active) {
      const dx = px - this.pointer.x
      const dy = py - this.pointer.y
      const dist = Math.hypot(dx, dy)
      // 速度与运动方向：决定笔刷是否拉伸成"快速划水"的箭头/彗星形。
      const dt = Math.max(now - this.lastMoveTime, 1)
      const speed = dist / dt // px / ms
      const angle = Math.atan2(dy, dx)
      const stretch = this.speedToStretch(speed)
      const step = this.brushSize * this.dpr * 0.3
      // 快速划水时少插值——让彗星的尾迹自己覆盖路径，呈现"头一点、身后拖尾"的箭头；
      // 慢速则密插值保证圆点连续不断线。
      const maxSteps = stretch > 1.3 ? 3 : 24
      if (dist > step) {
        const steps = Math.min(Math.floor(dist / step), maxSteps)
        for (let i = 1; i <= steps; i++) {
          const t = i / steps
          this.stamp(this.pointer.x + dx * t, this.pointer.y + dy * t, angle, stretch)
        }
      } else {
        this.stamp(px, py, angle, stretch)
      }
    } else {
      this.stamp(px, py, 0, 1)
    }
    this.pointer.x = px
    this.pointer.y = py
    this.pointer.active = true
    this.lastMoveTime = now
    this.kickHeal()
  }

  /** 速度→拉伸系数：慢速≈1（圆 blob），快速→最多 ~2.8（箭头形）。 */
  private speedToStretch(speed: number): number {
    // speed 单位 px/ms。经验阈值：>0.9 px/ms 视作"快速划水"。
    const t = Math.max(0, Math.min((speed - 0.35) / 1.6, 1))
    // 平滑缓动，避免突变
    const eased = t * t * (3 - 2 * t)
    return 1 + eased * 1.8
  }

  onPointerLeave() {
    this.pointer.active = false
  }

  /** 构建一枚不规则水墨笔刷：多层 blob + 飞白。 */
  private buildBrush() {
    const ctx = this.brushCtx
    const size = this.brush.width
    const c = size / 2
    ctx.clearRect(0, 0, size, size)
    ctx.globalCompositeOperation = 'source-over'

    // 多层不规则径向渐变 blob，越靠中心越浓密，边缘参差。
    const layers = 42
    for (let i = 0; i < layers; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.pow(Math.random(), 1.6) * this.brushSize * 0.55
      const bx = c + Math.cos(angle) * dist
      const by = c + Math.sin(angle) * dist
      const r = this.brushSize * (0.1 + Math.random() * 0.28)
      const alpha = 0.14 + Math.random() * 0.4
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, r)
      g.addColorStop(0, `rgba(255,255,255,${alpha})`)
      g.addColorStop(0.55, `rgba(255,255,255,${alpha * 0.5})`)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, size, size)
    }

    // 飞白：在笔刷内部随机擦除一些小空隙，形成干笔纹理。
    ctx.globalCompositeOperation = 'destination-out'
    const gaps = 14
    for (let i = 0; i < gaps; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * this.brushSize * 0.42
      const bx = c + Math.cos(angle) * dist
      const by = c + Math.sin(angle) * dist
      const r = this.brushSize * (0.03 + Math.random() * 0.09)
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, r)
      g.addColorStop(0, `rgba(255,255,255,${0.35 + Math.random() * 0.45})`)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, size, size)
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  private resize = () => {
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    this.canvas.width = Math.floor(window.innerWidth * this.dpr)
    this.canvas.height = Math.floor(window.innerHeight * this.dpr)
    this.fillBlack()
  }

  private fillBlack() {
    if (!this.enabled) return
    this.ctx.globalCompositeOperation = 'source-over'
    this.ctx.globalAlpha = 1
    this.ctx.fillStyle = this.coverColor
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  /**
   * 盖章一笔。
   * @param angle 运动方向角（弧度）
   * @param stretch 速度拉伸系数（1=圆 blob，>1=快速划水的箭头/彗星形）
   */
  private stamp(x: number, y: number, angle: number, stretch: number) {
    if (!this.enabled) return
    const ctx = this.ctx
    const half = this.brushSize * this.dpr
    if (stretch > 1.02) {
      // 快速划水：头部(当前点)浓而宽、尾部(运动后方)细而淡的细长彗星/箭头尾迹。
      const dirX = Math.cos(angle)
      const dirY = Math.sin(angle)
      const wakeLen = half * stretch * 1.25
      const segments = 5
      for (let i = 0; i < segments; i++) {
        const t = i / (segments - 1) // 0=头，1=尾
        const bx = x - dirX * wakeLen * t
        const by = y - dirY * wakeLen * t
        // 运动方向拉长、垂直方向大幅收窄，尾部收成尖点。
        const scaleX = stretch * 1.15 * (1 - t * 0.7)
        const scaleY = ((1 - t * 0.78) / (stretch * 1.25)) * (0.9 + Math.random() * 0.2)
        ctx.save()
        ctx.globalCompositeOperation = 'destination-out'
        ctx.globalAlpha = (0.7 + Math.random() * 0.3) * (1 - t * 0.8)
        ctx.translate(bx, by)
        ctx.rotate(angle + (Math.random() - 0.5) * 0.12)
        ctx.scale(scaleX, scaleY)
        ctx.drawImage(this.brush, -half, -half)
        ctx.restore()
      }
    } else {
      // 慢速：常规圆 blob，随机旋转/缩放/浓淡。
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = 0.55 + Math.random() * 0.45
      ctx.translate(x, y)
      const scale = 0.7 + Math.random() * 0.65
      ctx.rotate(Math.random() * Math.PI * 2)
      ctx.scale(scale, scale)
      ctx.drawImage(this.brush, -half, -half)
      ctx.restore()
    }
    this.lastStampTime = performance.now()
  }

  private kickHeal() {
    this.lastStampTime = performance.now()
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(this.healLoop)
    }
  }

  private healLoop = () => {
    const elapsed = performance.now() - this.lastStampTime
    const healWindow = this.healSeconds * 1000
    if (elapsed < healWindow) {
      // 渐隐复原：低 alpha 遮挡色逐步盖回。
      this.ctx.globalCompositeOperation = 'source-over'
      this.ctx.globalAlpha = 1
      this.ctx.fillStyle = `rgba(${this.coverRgb},${this.healAlpha})`
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      this.rafId = requestAnimationFrame(this.healLoop)
    } else {
      // 复原完成：一次填满并停止循环（空闲零开销）。
      this.fillBlack()
      this.rafId = null
    }
  }

  private stopHeal() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private hexToRgb(hex: string): string {
    const m = hex.replace('#', '')
    const full =
      m.length === 3
        ? m
            .split('')
            .map((c) => c + c)
            .join('')
        : m
    const num = parseInt(full, 16)
    return `${(num >> 16) & 255},${(num >> 8) & 255},${num & 255}`
  }
}
