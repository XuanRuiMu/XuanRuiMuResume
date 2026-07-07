import { useTheaterStore, SECTION_META } from '../store/useTheaterStore'
import { ITPanel } from './panels/ITPanel'
import { EduPanel } from './panels/EduPanel'
import { DesignPanel } from './panels/DesignPanel'
import { MusicPanel } from './panels/MusicPanel'
import { MediaPanel } from './panels/MediaPanel'
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react'
import { audioManager } from '../utils/audio'

const PANEL_COMPONENTS = {
  it: ITPanel,
  edu: EduPanel,
  design: DesignPanel,
  music: MusicPanel,
  media: MediaPanel,
}

export function ContentPanel() {
  const activeSection = useTheaterStore((s) => s.activeSection)
  const audioEnabled = useTheaterStore((s) => s.audioEnabled)
  const setAudioEnabled = useTheaterStore((s) => s.setAudioEnabled)
  const returnToTheater = useTheaterStore((s) => s.returnToTheater)

  if (!activeSection) return null

  const meta = SECTION_META[activeSection]
  const Panel = PANEL_COMPONENTS[activeSection]

  const toggleAudio = () => {
    const next = !audioEnabled
    setAudioEnabled(next)
    if (next) {
      audioManager.init()
      audioManager.ensureRunning()
    }
  }

  const handleReturn = () => {
    if (audioEnabled) audioManager.playReturn()
    returnToTheater()
  }

  const widths = {
    it: '35%',
    edu: '35%',
    design: '40%',
    music: '30%',
    media: '38%',
  }

  return (
    <div
      className="absolute top-0 right-0 h-full z-20 flex flex-col justify-center pr-6 pl-12 pointer-events-none"
      style={{ width: widths[activeSection] || '35%' }}
    >
      <div
        className="glass-panel rounded-2xl p-6 max-h-[85vh] overflow-y-auto scrollbar-thin pointer-events-auto animate-fade-in"
        style={{
          borderColor: `${meta.color}30`,
          boxShadow: `0 24px 80px ${meta.color}20`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-medium" style={{ color: meta.color }}>
              {meta.title}
            </h2>
            <div className="text-sm text-white/50">{meta.subtitle}</div>
          </div>
          <button
            onClick={toggleAudio}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label={audioEnabled ? '关闭音效' : '开启音效'}
          >
            {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>

        <Panel />

        <button
          onClick={handleReturn}
          className="mt-6 flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          返回剧场
        </button>
      </div>
    </div>
  )
}
