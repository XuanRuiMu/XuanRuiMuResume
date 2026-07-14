import { useRef } from 'react'
import { useFantasyCursor } from './useFantasyCursor'

export function FantasyCursor() {
  const 画布引用 = useRef<HTMLCanvasElement>(null)
  const { 光标状态, 启用 } = useFantasyCursor(画布引用)

  if (!启用) return null

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
          left: `${光标状态.x}px`,
          top: `${光标状态.y}px`,
          transform: 'translate(-2px, -2px)',
          opacity: 光标状态.可见 && !光标状态.悬浮输入元素 ? 1 : 0,
          transition: 'opacity 0.15s ease',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_10px_rgba(0,217,255,0.95)]"
        >
          <defs>
            <linearGradient id="cursor-blade" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" />
              <stop offset="0.4" stopColor="#00d9ff" />
              <stop offset="1" stopColor="#a55eea" />
            </linearGradient>
            <filter id="cursor-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d="M2 2L12 28L16 19L27 16L2 2Z" fill="url(#cursor-blade)" filter="url(#cursor-glow)" />
          <circle cx="3.5" cy="3.5" r="2.5" fill="#ffffff" />
          <circle cx="3.5" cy="3.5" r="1.5" fill="#00d9ff" />
        </svg>
      </div>
    </>
  )
}
