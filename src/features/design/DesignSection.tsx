import { useCallback, useEffect, useRef } from 'react'
import { design } from '../../data/design'
import { Section } from '../../components/ui/Section'
import { t } from '../../i18n/translations'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const CANVAS_WIDTH = 960
const CANVAS_HEIGHT = 540
const DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  hue: number
  speed: number
}

interface FlowParams {
  seed: number
  scale: number
  timeScale: number
  mouseRadius: number
  mouseStrength: number
  particleCount: number
}

function hash(n: number): number {
  return Math.sin(n * 12.9898) * 43758.5453 - Math.floor(Math.sin(n * 12.9898) * 43758.5453)
}

function noise(x: number, y: number, t: number, seed: number): number {
  const s = seed * 10
  const a = Math.sin(x * 0.005 + s + t * 0.3) + Math.sin(y * 0.007 + s * 2) * 0.5
  const b = Math.cos(x * 0.009 - y * 0.006 + t * 0.2 + s * 3)
  return a + b
}

function createParticle(width: number, height: number, params: FlowParams): Particle {
  const seed = params.seed + Math.random() * 1000
  const x = Math.random() * width
  const y = Math.random() * height
  const hue = 180 + hash(seed) * 160
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    age: 0,
    life: 120 + Math.random() * 180,
    hue,
    speed: 0.8 + Math.random() * 1.4,
  }
}

function computeFlowAngle(
  x: number,
  y: number,
  t: number,
  params: FlowParams,
  mouse: { x: number; y: number; active: boolean },
  width: number,
  height: number
): number {
  const baseAngle = noise(x, y, t, params.seed) * params.scale

  let mouseAngle = 0
  if (mouse.active) {
    const dx = x - mouse.x * width
    const dy = y - mouse.y * height
    const dist = Math.sqrt(dx * dx + dy * dy)
    const influence = Math.max(0, 1 - dist / params.mouseRadius)
    const swirl = Math.atan2(dy, dx) + Math.PI * 0.5 + Math.sin(dist * 0.01 + t) * 0.5
    mouseAngle = swirl * influence * params.mouseStrength
  }

  return baseAngle + mouseAngle
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  params: FlowParams,
  mouse: { x: number; y: number; active: boolean },
  width: number,
  height: number,
  time: number
): void {
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = 'rgba(11, 12, 21, 0.22)'
  ctx.fillRect(0, 0, width, height)

  ctx.globalCompositeOperation = 'lighter'

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    const angle = computeFlowAngle(p.x, p.y, time, params, mouse, width, height)

    const targetVx = Math.cos(angle) * p.speed
    const targetVy = Math.sin(angle) * p.speed

    p.vx += (targetVx - p.vx) * 0.08
    p.vy += (targetVy - p.vy) * 0.08

    const nextX = p.x + p.vx
    const nextY = p.y + p.vy

    const alpha = Math.min(1, Math.sin((p.age / p.life) * Math.PI)) * 0.55
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(nextX, nextY)
    ctx.strokeStyle = `hsla(${p.hue}, 80%, 65%, ${alpha})`
    ctx.lineWidth = 1.2
    ctx.stroke()

    p.x = nextX
    p.y = nextY
    p.age += 1

    if (p.age >= p.life || p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) {
      particles[i] = createParticle(width, height, params)
    }
  }

  ctx.restore()
}

function drawStatic(ctx: CanvasRenderingContext2D, params: FlowParams, width: number, height: number): void {
  ctx.save()
  ctx.clearRect(0, 0, width, height)
  ctx.globalCompositeOperation = 'lighter'

  const lines = 36
  const segments = 80
  const step = 4

  for (let i = 0; i < lines; i++) {
    const seed = params.seed + i * 123.45
    let x = hash(seed) * width
    let y = hash(seed + 1) * height
    const hue = 180 + hash(seed + 2) * 160

    ctx.beginPath()
    ctx.moveTo(x, y)

    for (let j = 0; j < segments; j++) {
      const angle = noise(x, y, 0, params.seed + i) * params.scale
      x += Math.cos(angle) * step
      y += Math.sin(angle) * step
      ctx.lineTo(x, y)
    }

    ctx.strokeStyle = `hsla(${hue}, 75%, 60%, 0.35)`
    ctx.lineWidth = 1.2
    ctx.stroke()
  }

  ctx.restore()
}

function GenerativeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = useReducedMotion()
  const paramsRef = useRef<FlowParams>({
    seed: Math.random() * 1000,
    scale: 1.2,
    timeScale: 0.003,
    mouseRadius: 220,
    mouseStrength: 1.5,
    particleCount: 220,
  })
  const mouseRef = useRef({ x: 0.5, y: 0.5, active: false })
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)
  const timeRef = useRef(0)

  const regenerate = useCallback(() => {
    const params = paramsRef.current
    params.seed = Math.random() * 10000
    params.scale = 0.8 + Math.random() * 0.8
    params.mouseStrength = 1 + Math.random()

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    if (reducedMotion) {
      drawStatic(ctx, params, width, height)
      return
    }

    particlesRef.current = Array.from({ length: params.particleCount }, () => createParticle(width, height, params))
    ctx.clearRect(0, 0, width, height)
  }, [reducedMotion])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = CANVAS_WIDTH * DPR
    canvas.height = CANVAS_HEIGHT * DPR
    ctx.scale(DPR, DPR)

    const params = paramsRef.current
    const width = CANVAS_WIDTH
    const height = CANVAS_HEIGHT

    if (reducedMotion) {
      drawStatic(ctx, params, width, height)
      return
    }

    particlesRef.current = Array.from({ length: params.particleCount }, () => createParticle(width, height, params))

    const tick = () => {
      timeRef.current += params.timeScale
      drawFrame(ctx, particlesRef.current, params, mouseRef.current, width, height, timeRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [reducedMotion])

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    mouseRef.current = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
      active: true,
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: 0.5, y: 0.5, active: false }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={t('design.canvasLabel')}
      onClick={regenerate}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="h-auto w-full cursor-pointer rounded-xl"
      style={{
        aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
        background: 'transparent',
      }}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
    />
  )
}

export function DesignSection() {
  return (
    <Section id="design" title={t('design.title')} subtitle={t('design.subtitle')}>
      <div className="grid items-center gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <GenerativeCanvas />
          <p className="mt-3 text-center text-xs text-muted">{t('design.canvasHint')}</p>
        </div>

        <div className="lg:col-span-2">
          <h3 className="mb-3 text-2xl font-semibold text-text-primary text-shadow-readable">
            {t(design.headlineKey)}
          </h3>
          <p className="leading-relaxed text-text-secondary text-shadow-readable">{t(design.introKey)}</p>
        </div>
      </div>
    </Section>
  )
}
