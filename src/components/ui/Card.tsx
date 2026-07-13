import { useRef, useCallback, useEffect, type ReactNode, type MouseEvent } from 'react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface CardProps {
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
  glass?: boolean
  hover?: boolean
  tilt?: boolean
  className?: string
}

const TILT_PERSPECTIVE = 1000
const TILT_ROTATE_COEFFICIENT = 28
const TILT_SCALE = 1.03
const TILT_TRANSLATE_Z = 24

export function Card({ children, header, footer, glass = true, hover = false, tilt = false, className }: CardProps) {
  const reducedMotion = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const isHoveringRef = useRef(false)

  const resetGlow = useCallback((element: HTMLDivElement) => {
    element.style.setProperty('--tilt-glow-x', '50%')
    element.style.setProperty('--tilt-glow-y', '50%')
  }, [])

  const applyTransform = useCallback((rotateX: number, rotateY: number, scale: number, translateZ: number) => {
    const element = cardRef.current
    if (!element) return
    element.style.transform = `perspective(${TILT_PERSPECTIVE}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale}) translateZ(${translateZ}px)`
  }, [])

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (reducedMotion || !cardRef.current || !isHoveringRef.current) return
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        const element = cardRef.current
        if (!element || !isHoveringRef.current) {
          rafRef.current = 0
          return
        }
        const rect = element.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width - 0.5
        const y = (event.clientY - rect.top) / rect.height - 0.5
        const rotateX = -y * TILT_ROTATE_COEFFICIENT
        const rotateY = x * TILT_ROTATE_COEFFICIENT
        applyTransform(rotateX, rotateY, TILT_SCALE, TILT_TRANSLATE_Z)
        element.style.setProperty('--tilt-glow-x', `${(x + 0.5) * 100}%`)
        element.style.setProperty('--tilt-glow-y', `${(y + 0.5) * 100}%`)
        rafRef.current = 0
      })
    },
    [reducedMotion, applyTransform]
  )

  const handleMouseEnter = useCallback(() => {
    if (reducedMotion) return
    isHoveringRef.current = true
    cardRef.current?.classList.add('is-tilt-active')
  }, [reducedMotion])

  const handleMouseLeave = useCallback(() => {
    isHoveringRef.current = false
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    const element = cardRef.current
    if (!element) return
    element.classList.remove('is-tilt-active')
    applyTransform(0, 0, 1, 0)
    resetGlow(element)
  }, [applyTransform, resetGlow])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const tiltEnabled = tilt && !reducedMotion

  return (
    <div
      ref={cardRef}
      onMouseMove={tiltEnabled ? handleMouseMove : undefined}
      onMouseEnter={tiltEnabled ? handleMouseEnter : undefined}
      onMouseLeave={tiltEnabled ? handleMouseLeave : undefined}
      style={{ '--tilt-glow-x': '50%', '--tilt-glow-y': '50%' } as React.CSSProperties}
      className={cn(
        'card-container relative overflow-hidden rounded-2xl p-6',
        glass && 'glass-panel',
        !glass && 'border border-border bg-surface shadow-lg',
        hover && !tiltEnabled && 'transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl',
        hover && tiltEnabled && 'hover:shadow-2xl',
        tiltEnabled && 'tilt-card transition-transform duration-150 ease-out will-change-transform',
        className
      )}
    >
      {tiltEnabled && (
        <>
          <div
            className="tilt-card-glow pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                'radial-gradient(circle at var(--tilt-glow-x) var(--tilt-glow-y), rgba(255,255,255,0.16) 0%, transparent 55%)',
            }}
            aria-hidden="true"
          />
          <div
            className="tilt-card-border pointer-events-none absolute inset-0 z-0 rounded-2xl"
            style={{
              boxShadow: 'inset 0 0 0 1px rgba(0,217,255,0.25), 0 0 32px rgba(0,217,255,0.12)',
            }}
            aria-hidden="true"
          />
        </>
      )}
      {header && <div className="card-header mb-4">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer mt-4 border-t border-border pt-4">{footer}</div>}
    </div>
  )
}
