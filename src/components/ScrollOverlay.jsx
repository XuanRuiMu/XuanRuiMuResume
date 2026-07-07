import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTheaterStore, SECTION_ORDER, SECTION_META } from '../store/useTheaterStore'

gsap.registerPlugin(ScrollTrigger)

function 滚动章节卡片({ section, index }) {
  const meta = SECTION_META[section]

  return (
    <section
      className="relative min-h-screen flex items-center justify-end px-6 md:px-16 pointer-events-none"
      data-section={section}
    >
      <div
        className="pointer-events-auto w-full max-w-md glass-panel rounded-2xl p-6 md:p-8 mr-0 md:mr-12"
        style={{
          borderColor: `${meta.color}30`,
          boxShadow: `0 24px 80px ${meta.color}15`,
        }}
      >
        <div className="text-xs uppercase tracking-widest text-white/40 mb-3">0{index + 1}</div>
        <h2 className="text-3xl md:text-4xl font-medium mb-2" style={{ color: meta.color }}>
          {meta.title}
        </h2>
        <p className="text-sm md:text-base text-white/70 mb-4">{meta.subtitle}</p>
        <p className="text-sm text-white/50 leading-relaxed">{meta.description}</p>
        <div className="mt-6 h-1 rounded-full overflow-hidden bg-white/10">
          <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: meta.color }} />
        </div>
      </div>
    </section>
  )
}

export function ScrollOverlay() {
  const containerRef = useRef(null)
  const setScrollProgress = useRef(useTheaterStore.getState().setScrollProgress).current

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value) {
        if (arguments.length) {
          lenis.scrollTo(value, { immediate: true })
        }
        return lenis.scroll
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }
      },
      pinType: document.documentElement.style.transform ? 'transform' : 'fixed',
    })

    const overallTrigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress
        const sectionIndex = Math.min(SECTION_ORDER.length - 1, Math.floor(progress * SECTION_ORDER.length))
        const sectionId = SECTION_ORDER[sectionIndex]
        setScrollProgress(progress, sectionIndex, sectionId)
      },
    })

    const sectionTriggers = SECTION_ORDER.map((section, i) =>
      ScrollTrigger.create({
        trigger: containerRef.current?.querySelector(`[data-section="${section}"]`),
        start: 'top center',
        end: 'bottom center',
        onEnter: () => setScrollProgress(lenis.scroll / lenis.limit, i, section),
        onEnterBack: () => setScrollProgress(lenis.scroll / lenis.limit, i, section),
      })
    )

    ScrollTrigger.refresh()

    const handleResize = () => {
      ScrollTrigger.refresh()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      sectionTriggers.forEach((trigger) => trigger.kill())
      overallTrigger.kill()
      lenis.destroy()
      gsap.ticker.remove(raf)
    }
  }, [setScrollProgress])

  return (
    <div ref={containerRef} className="relative z-10 pointer-events-none">
      <section className="min-h-screen pointer-events-none" data-section="hero" />
      {SECTION_ORDER.map((section, i) => (
        <滚动章节卡片 key={section} section={section} index={i} />
      ))}
    </div>
  )
}
