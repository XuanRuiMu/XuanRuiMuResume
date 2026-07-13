import { useRef } from 'react'
import { useFantasyCursor } from './useFantasyCursor'

export function FantasyCursor() {
  const 画布引用 = useRef<HTMLCanvasElement>(null)
  const { 光标状态, 减少动画 } = useFantasyCursor(画布引用)

  if (减少动画) return null

  return (
    <>
      <canvas
        ref={画布引用}
        data-testid="fantasy-cursor-canvas"
        aria-hidden="true"
        className="fantasy-cursor-canvas pointer-events-none fixed inset-0 z-[100]"
      />
      <div
        data-testid="fantasy-cursor-pointer"
        aria-hidden="true"
        className="fantasy-cursor-pointer pointer-events-none fixed z-[101]"
        style={{
          left: 光标状态.x,
          top: 光标状态.y,
          transform: 'translate(-2px, -2px)',
          opacity: 光标状态.可见 && !光标状态.悬浮输入元素 ? 1 : 0,
          transition: 'opacity 0.15s ease',
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_8px_rgba(0,217,255,0.9)]"
        >
          <defs>
            <linearGradient id="cursor-blade" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" />
              <stop offset="0.45" stopColor="#00d9ff" />
              <stop offset="1" stopColor="#a55eea" />
            </linearGradient>
            <filter id="cursor-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d="M2 2L10 24L13.5 16.5L22 14L2 2Z" fill="url(#cursor-blade)" filter="url(#cursor-glow)" />
          <circle cx="3" cy="3" r="2" fill="#ffffff" />
        </svg>
      </div>
    </>
  )
}
