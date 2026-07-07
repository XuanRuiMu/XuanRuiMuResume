import { useEffect, useState } from 'react'
import { Theater } from './components/Theater'
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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-theater-bg/90 backdrop-blur-md">
      <div className="text-center max-w-md px-6">
        <h1 className="text-5xl font-medium tracking-tight mb-2 text-white">{personalInfo.name}</h1>
        <p className="text-white/60 mb-8">{personalInfo.target}</p>
        <div className="space-y-4 text-sm text-white/50 mb-10">
          <p className="flex items-center justify-center gap-2">
            <MousePointer2 size={16} />
            Hover 唤醒实体，点击进入专属空间
          </p>
          <p>剧场包含声音反馈，建议开启音频</p>
        </div>
        <button
          onClick={handleStart}
          className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all hover:scale-105"
        >
          进入剧场
        </button>
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
      className="absolute top-5 right-5 z-40 p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
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
    <div className="absolute top-6 left-6 z-30 pointer-events-none">
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
    <div className="relative w-full h-full">
      <IntroOverlay />
      <AudioToggle />
      <HeroLabel />
      <Theater />
    </div>
  )
}

export default App
