import { useEffect, useState } from 'react'
import { Theater } from './components/Theater'
import { ScrollOverlay } from './components/ScrollOverlay'
import { MobileFallback } from './components/MobileFallback'
import { personalInfo } from './data/resumeData'
import { useTheaterStore } from './store/useTheaterStore'
import { audioManager } from './utils/audio'
import { Volume2, VolumeX, MousePointer2 } from 'lucide-react'

function IntroOverlay() {
  const [show, setShow] = useState(true)

  const handleStart = () => {
    audioManager.init()
    audioManager.ensureRunning()
    useTheaterStore.getState().setAudioEnabled(true)
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(90, 60, 180, 0.22) 0%, transparent 35%),
          radial-gradient(circle at 80% 25%, rgba(0, 120, 200, 0.18) 0%, transparent 30%),
          radial-gradient(circle at 50% 80%, rgba(200, 150, 80, 0.12) 0%, transparent 35%),
          linear-gradient(180deg, #0a0c18 0%, #05070d 50%, #03040a 100%)`,
      }}
    >
      <div className="absolute inset-0 backdrop-blur-[2px]" />
      <div className="relative text-center max-w-lg px-6">
        <div
          className="text-6xl md:text-7xl font-semibold tracking-tight mb-3"
          style={{
            background: 'linear-gradient(135deg, #e0f0ff 0%, #a5c8ff 40%, #c9a8ff 70%, #ffd8a8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 60px rgba(165, 200, 255, 0.25)',
          }}
        >
          {personalInfo.name}
        </div>
        <p className="text-white/60 mb-8 text-base md:text-lg">{personalInfo.target}</p>
        <div className="space-y-3 text-sm text-white/50 mb-10">
          <p className="flex items-center justify-center gap-2">
            <MousePointer2 size={16} />
            Hover 唤醒实体，点击进入专属空间
          </p>
          <p>剧场包含声音反馈，建议开启音频</p>
        </div>
        <button
          onClick={handleStart}
          className="relative px-10 py-3.5 rounded-full text-white font-medium transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(90,160,255,0.35)] active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(100, 150, 255, 0.22) 0%, rgba(140, 100, 220, 0.22) 100%)',
            border: '1px solid rgba(200, 220, 255, 0.35)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          进入剧场
        </button>
        <p className="mt-8 text-xs text-white/30">按 Esc 或点击右上角可再次开启本界面</p>
      </div>
    </div>
  )
}

function AudioToggle() {
  const audioEnabled = useTheaterStore((s) => s.audioEnabled)
  const setAudioEnabled = useTheaterStore((s) => s.setAudioEnabled)

  return (
    <button
      onClick={() => {
        const next = !audioEnabled
        setAudioEnabled(next)
        if (next) {
          audioManager.init()
          audioManager.ensureRunning()
        }
      }}
      className="fixed top-5 right-5 z-40 p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
      aria-label={audioEnabled ? '关闭音效' : '开启音效'}
    >
      {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  )
}

function HeroLabel() {
  const activeSection = useTheaterStore((s) => s.activeSection)
  if (activeSection) return null

  return (
    <div className="fixed top-6 left-6 z-30 pointer-events-none">
      <h1 className="text-3xl font-medium text-white tracking-tight">{personalInfo.name}</h1>
      <p className="text-sm text-white/50 mt-1">{personalInfo.target}</p>
    </div>
  )
}

function App() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024 || window.matchMedia('(pointer: coarse)').matches)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (isMobile) return <MobileFallback />

  return (
    <div className="relative w-full min-h-screen">
      <IntroOverlay />
      <AudioToggle />
      <HeroLabel />
      <Theater />
      <ScrollOverlay />
    </div>
  )
}

export default App
