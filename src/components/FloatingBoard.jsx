import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useTheaterStore, SECTION_META } from '../store/useTheaterStore'
import { ITPanel } from './panels/ITPanel'
import { EduPanel } from './panels/EduPanel'
import { DesignPanel } from './panels/DesignPanel'
import { MusicPanel } from './panels/MusicPanel'
import { MediaPanel } from './panels/MediaPanel'
import { audioManager } from '../utils/audio'
import { ArrowLeft, X } from 'lucide-react'

const PANEL_COMPONENTS = {
  it: ITPanel,
  edu: EduPanel,
  design: DesignPanel,
  music: MusicPanel,
  media: MediaPanel,
}

const SECTION_ORDER = ['it', 'edu', 'design', 'music', 'media']
const RADIUS = 5.6

export function FloatingBoard() {
  const activeSection = useTheaterStore((s) => s.activeSection)
  const returnToTheater = useTheaterStore((s) => s.returnToTheater)

  const position = useMemo(() => {
    if (!activeSection) return new THREE.Vector3(0, 0, 0)
    const index = SECTION_ORDER.indexOf(activeSection)
    const angle = (index * 72 - 90) * (Math.PI / 180)
    const ex = Math.cos(angle) * RADIUS * 1.12
    const ez = Math.sin(angle) * RADIUS * 1.12
    return new THREE.Vector3(ex, 2.05, ez)
  }, [activeSection])

  if (!activeSection) return null

  const meta = SECTION_META[activeSection]
  const Panel = PANEL_COMPONENTS[activeSection]

  const handleReturn = () => {
    audioManager.ensureRunning()
    audioManager.playReturn()
    returnToTheater()
  }

  return (
    <Html
      key={activeSection}
      position={position}
      center
      distanceFactor={8}
      style={{ pointerEvents: 'auto', userSelect: 'none' }}
    >
      <div
        className="hologram-board glass-panel animate-fade-in"
        style={{
          width: '440px',
          maxHeight: '72vh',
          borderColor: `${meta.color}45`,
          boxShadow: `0 24px 90px ${meta.color}18, inset 0 0 40px ${meta.color}08`,
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: `${meta.color}30` }}
        >
          <div>
            <h2 className="text-xl font-medium" style={{ color: meta.color }}>
              {meta.title}
            </h2>
            <div className="text-xs text-white/50">{meta.subtitle}</div>
          </div>
          <button
            onClick={handleReturn}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="返回剧场"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto scrollbar-thin" style={{ maxHeight: 'calc(72vh - 72px)' }}>
          <Panel />
        </div>

        <div className="px-5 pb-4">
          <button
            onClick={handleReturn}
            className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            返回剧场
          </button>
        </div>
      </div>
    </Html>
  )
}
