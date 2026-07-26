import { useEffect, useRef } from 'react'
import { InkRevealRenderer } from './InkRevealRenderer'
import { useIsDarkMode } from './useIsDarkMode'

interface InkRevealOverlayProps {
  enabled?: boolean
  healSeconds?: number
  brushSize?: number
}

export function InkRevealOverlay({ enabled = true, healSeconds = 2.5, brushSize = 180 }: InkRevealOverlayProps) {
  const rendererRef = useRef<InkRevealRenderer | null>(null)
  const isDark = useIsDarkMode()

  useEffect(() => {
    if (typeof window === 'undefined' || !isDark) return

    const renderer = new InkRevealRenderer({ enabled, healSeconds, brushSize })
    rendererRef.current = renderer
    renderer.mount(document.body)

    const onMove = (e: PointerEvent) => {
      renderer.onPointerMove(e.clientX, e.clientY)
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onMove)
      renderer.unmount()
      rendererRef.current = null
    }
  }, [isDark, enabled, healSeconds, brushSize])

  return null
}
