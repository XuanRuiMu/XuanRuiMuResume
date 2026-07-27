export interface InkRevealOptions {
  healSeconds?: number
  brushSize?: number
  enabled?: boolean
  /** 遮挡层颜色（默认深色模式用的近黑） */
  coverColor?: string
}

interface Ripple {
  x: number
  y: number
  born: number
  life: number
  maxR: number
}

/**
 * 水墨揭示渲染器（还原 mimo.xiaomi.com 的水墨画笔效果）。
 *
 * 核心设计：
 * - 遮挡层是一张全屏 canvas，默认涂满 coverColor（z-index:1，盖住星空 z-0、被内容 z-10 压住）。
 * - 鼠标划过：沿指针轨迹**插值**连续盖圆点（destination-out 擦除），保证不断线。
 * - 慢速（< FAST_THRESHOLD）：纯圆点晕染，仿水墨落笔点墨。
 * - 快速（>= FAST_THRESHOLD）：在圆点轨迹之外，于指针处生成**向外扩散的同心水波环**，
 *   模拟"快速划过水面"的物理涟漪，而不是夸张的彗星拖尾。
 * - 复原按需触发：只有发生过擦除/涟漪才启动 rAF，渐隐回遮挡色，复原完成后停止循环（空闲零开销）。
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
  private lastMoveTime = 0
  /** 距上次生成水波环已累积的快速移动距离 */
  private fastAcc = 0

  /** 速度阈值(px/ms)：超过即视为"快速划水"，触发生成水波环。 */
  private static readonly FAST_THRESHOLD = 1.3
  /** 快速移动多少像素生成一个水波环 */
  private static readonly RIPPLE_SPACING = 90

  private ripples: Ripple[] = []

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
    this.stopLoop()
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    this.stopLoop()
    this.ripples = []
    this.fastAcc = 0
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
      const dt = Math.max(now - this.lastMoveTime, 1)
      const speed = dist / dt // px / ms
      const angle = Math.atan2(dy, dx)

      // 沿轨迹插值连续盖圆点，保证慢速/快速都不断线。
      const step = this.brushSize * this.dpr * 0.3
      if (dist > step) {
        const steps = Math.min(Math.floor(dist / step), 24)
        for (let i = 1; i <= steps; i++) {
          const t = i / steps
          this.stampDot(this.pointer.x + dx * t, this.pointer.y + dy * t, angle)
        }
      } else {
        this.stampDot(px, py, angle)
      }

      // 快速划水：沿路径按间距生成水波环（不再拉伸成箭头）。
      if (speed >= InkRevealRenderer.FAST_THRESHOLD) {
        this.fastAcc += dist
        const spacing = InkRevealRenderer.RIPPLE_SPACING * this.dpr
        while (this.fastAcc >= spacing) {
          this.fastAcc -= spacing
          this.spawnRipple(px, py, speed)
        }
      } else {
        this.fastAcc = 0
      }
    } else {
      this.stampDot(px, py, 0)
    }
    this.pointer.x = px
    this.pointer.y = py
    this.pointer.active = true
    this.lastMoveTime = now
    this.kickLoop()
  }

  onPointerLeave() {
    this.pointer.active = false
    this.fastAcc = 0
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

  /** 盖一枚圆点晕染（水墨落笔）。 */
  private stampDot(x: number, y: number, angle: number) {
    if (!this.enabled) return
    const ctx = this.ctx
    const half = this.brushSize * this.dpr
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.globalAlpha = 0.5 + Math.random() * 0.5
    ctx.translate(x, y)
    const scale = 0.7 + Math.random() * 0.6
    ctx.rotate(angle + (Math.random() - 0.5) * 0.2)
    ctx.scale(scale, scale)
    ctx.drawImage(this.brush, -half, -half)
    ctx.restore()
  }

  /** 在 (x,y) 生成一枚水波环，半径随速度增大。 */
  private spawnRipple(x: number, y: number, speed: number) {
    const maxR = Math.min(240, 70 + speed * 45) * this.dpr
    this.ripples.push({
      x,
      y,
      born: performance.now(),
      life: 620,
      maxR,
    })
    // 控制总量，避免极端情况堆积。
    if (this.ripples.length > 40) this.ripples.shift()
  }

  /** 每帧绘制并更新水波环（擦除），返回是否仍有存活涟漪。 */
  private drawRipples(now: number): boolean {
    if (this.ripples.length === 0) return false
    const ctx = this.ctx
    let alive = false
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rp = this.ripples[i]
      const t = (now - rp.born) / rp.life
      if (t >= 1) {
        this.ripples.splice(i, 1)
        continue
      }
      alive = true
      // easeOut：先快后慢地扩散，像真实水波。
      const eased = 1 - (1 - t) * (1 - t)
      const r = eased * rp.maxR
      const a = (1 - t) * 0.85 // 随时间淡出
      // 同心多环，营造水面涟漪层次。
      for (let k = 0; k < 3; k++) {
        const rr = r * (1 - k * 0.28)
        if (rr <= 0) continue
        const th = 9 * this.dpr
        const g = ctx.createRadialGradient(rp.x, rp.y, Math.max(0, rr - th), rp.x, rp.y, rr + th)
        g.addColorStop(0, 'rgba(255,255,255,0)')
        g.addColorStop(0.5, `rgba(255,255,255,${a * (1 - k * 0.32)})`)
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      }
    }
    ctx.restore()
    return alive
  }

  private kickLoop() {
    this.lastActivity = performance.now()
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(this.tick)
    }
  }

  private lastActivity = 0

  private tick = () => {
    const now = performance.now()
    const ripplesAlive = this.drawRipples(now)
    const elapsed = now - this.lastActivity
    const healWindow = this.healSeconds * 1000
    if (elapsed < healWindow || ripplesAlive) {
      // 渐隐复原：低 alpha 遮挡色逐步盖回（覆盖圆点与水波）。
      this.ctx.globalCompositeOperation = 'source-over'
      this.ctx.globalAlpha = 1
      this.ctx.fillStyle = `rgba(${this.coverRgb},${this.healAlpha})`
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      this.rafId = requestAnimationFrame(this.tick)
    } else {
      // 复原完成：一次填满并停止循环（空闲零开销）。
      this.fillBlack()
      this.rafId = null
    }
  }

  private stopLoop() {
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
