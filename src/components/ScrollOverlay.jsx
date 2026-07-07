import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MapPin, Mail, Phone, Code, ExternalLink, User, Rocket } from 'lucide-react'
import { useTheaterStore, SECTION_ORDER, SECTION_META } from '../store/useTheaterStore'
import { personalInfo } from '../data/resumeData'
import { ITPanel } from './panels/ITPanel'
import { EduPanel } from './panels/EduPanel'
import { DesignPanel } from './panels/DesignPanel'
import { MusicPanel } from './panels/MusicPanel'
import { MediaPanel } from './panels/MediaPanel'

gsap.registerPlugin(ScrollTrigger)

const 面板映射 = {
  it: ITPanel,
  edu: EduPanel,
  design: DesignPanel,
  music: MusicPanel,
  media: MediaPanel,
}

function 联系方式链接({ href, icon: Icon, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="pointer-events-auto flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
    >
      <Icon size={12} />
      {children}
    </a>
  )
}

function 英雄屏() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-start px-6 md:px-16 pointer-events-none"
      data-section="hero"
    >
      <div className="pointer-events-auto w-full max-w-xl glass-panel rounded-2xl p-8 md:p-10 ml-0 md:ml-12 border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70">
            <User size={20} />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-medium text-white tracking-tight">{personalInfo.name}</h1>
            <p className="text-sm text-white/50">{personalInfo.age} 岁 · {personalInfo.location}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 text-it-cyan text-sm font-medium mb-2">
            <Rocket size={14} />
            求职方向
          </div>
          <p className="text-base md:text-lg text-white/90 leading-relaxed">{personalInfo.target}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">期望城市</div>
            <div className="text-sm text-white/90">{personalInfo.expectedCity}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">到岗时间</div>
            <div className="text-sm text-white/90">{personalInfo.availability}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">期望薪资</div>
            <div className="text-sm text-white/90">{personalInfo.salary}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">学历</div>
            <div className="text-sm text-white/90">{personalInfo.education.school} · {personalInfo.education.degree}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/10">
          <联系方式链接 href={`tel:${personalInfo.phone}`} icon={Phone}>{personalInfo.phone}</联系方式链接>
          <联系方式链接 href={`mailto:${personalInfo.email}`} icon={Mail}>{personalInfo.email}</联系方式链接>
          <联系方式链接 href={personalInfo.github} icon={Code}>GitHub</联系方式链接>
          <联系方式链接 href={personalInfo.bilibili} icon={ExternalLink}>B站</联系方式链接>
          <span className="flex items-center gap-1.5 text-xs text-white/40">
            <MapPin size={12} />
            {personalInfo.location}
          </span>
        </div>
      </div>
    </section>
  )
}

function 内容屏({ section, index }) {
  const meta = SECTION_META[section]
  const Panel = 面板映射[section]

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
        <Panel />
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
      <英雄屏 />
      {SECTION_ORDER.map((section, i) => (
        <内容屏 key={section} section={section} index={i} />
      ))}
    </div>
  )
}
