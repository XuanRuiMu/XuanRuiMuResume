export interface InkRevealOptions {
  healSeconds?: number
  brushSize?: number
  enabled?: boolean
}

export class InkRevealRenderer {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly brush: HTMLCanvasElement
  private readonly brushCtx: CanvasRenderingContext2D
  private rafId: number | null = null
  private pointer = { x: -1000, y: -1000, active: false }
  private healAlpha: number
  private enabled: boolean
  private brushSize: number

  constructor(options: InkRevealOptions = {}) {
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'ink-reveal-overlay'
    this.canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:-1;'
    const ctx = this.canvas.getContext('2d', { alpha: true })
    if (!ctx) throw new Error('无法创建 2D context')
    this.ctx = ctx

    this.brushSize = options.brushSize ?? 180
    this.healAlpha = 1 / Math.max(30, (options.healSeconds ?? 2.5) * 60)
    this.enabled = options.enabled ?? true

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
    this.start()
  }

  unmount() {
    window.removeEventListener('resize', this.resize)
    this.stop()
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    } else {
      this.fillBlack()
    }
  }

  setHealSeconds(seconds: number) {
    this.healAlpha = 1 / Math.max(30, seconds * 60)
  }

  setBrushSize(size: number) {
    this.brushSize = Math.max(40, Math.min(size, 400))
    this.brush.width = this.brushSize * 2
    this.brush.height = this.brushSize * 2
    this.buildBrush()
  }

  onPointerMove(x: number, y: number) {
    this.pointer.x = x * window.devicePixelRatio
    this.pointer.y = y * window.devicePixelRatio
    this.pointer.active = true
    this.stamp()
  }

  private buildBrush() {
    const ctx = this.brushCtx
    const w = this.brush.width
    const h = this.brush.height
    ctx.clearRect(0, 0, w, h)
    const centerX = w / 2
    const centerY = h / 2
    const blobs = 28
    for (let i = 0; i < blobs; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.pow(Math.random(), 0.7) * this.brushSize * 0.7
      const bx = centerX + Math.cos(angle) * dist
      const by = centerY + Math.sin(angle) * dist
      const r = this.brushSize * (0.12 + Math.random() * 0.18)
      const alpha = 0.25 + Math.random() * 0.45
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, r)
      g.addColorStop(0, `rgba(255,255,255,${alpha})`)
      g.addColorStop(0.5, `rgba(255,255,255,${alpha * 0.4})`)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    }
  }

  private resize = () => {
    const dpr = Math.min(window.devicePixelRatio, 1.5)
    this.canvas.width = Math.floor(window.innerWidth * dpr)
    this.canvas.height = Math.floor(window.innerHeight * dpr)
    this.fillBlack()
  }

  private fillBlack() {
    if (!this.enabled) return
    this.ctx.globalCompositeOperation = 'source-over'
    this.ctx.fillStyle = '#05060f'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private stamp() {
    if (!this.enabled || !this.pointer.active) return
    this.ctx.globalCompositeOperation = 'destination-out'
    this.ctx.drawImage(this.brush, this.pointer.x - this.brushSize, this.pointer.y - this.brushSize)
  }

  private start() {
    if (this.rafId !== null) return
    const loop = () => {
      if (this.enabled) {
        this.ctx.globalCompositeOperation = 'source-over'
        this.ctx.fillStyle = `rgba(5, 6, 15, ${this.healAlpha})`
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      }
      this.rafId = requestAnimationFrame(loop)
    }
    this.rafId = requestAnimationFrame(loop)
  }

  private stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}
