import { useState } from 'react'
import { personalInfo } from '../data/resumeData'
import { SECTION_META } from '../store/useTheaterStore'
import { ITPanel } from './panels/ITPanel'
import { EduPanel } from './panels/EduPanel'
import { DesignPanel } from './panels/DesignPanel'
import { MusicPanel } from './panels/MusicPanel'
import { MediaPanel } from './panels/MediaPanel'
import { Mail, Phone, MapPin, Code2, ExternalLink } from 'lucide-react'

const PANELS = {
  it: ITPanel,
  edu: EduPanel,
  design: DesignPanel,
  music: MusicPanel,
  media: MediaPanel,
}

export function MobileFallback() {
  const [active, setActive] = useState(null)
  const order = ['it', 'edu', 'design', 'music', 'media']

  return (
    <div className="min-h-screen bg-theater-bg text-white p-5 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-medium tracking-tight mb-2">{personalInfo.name}</h1>
        <p className="text-white/60 text-sm">{personalInfo.target}</p>
        <div className="flex flex-wrap gap-3 mt-4 text-xs text-white/60">
          <span className="flex items-center gap-1"><Phone size={12} /> {personalInfo.phone}</span>
          <span className="flex items-center gap-1"><Mail size={12} /> {personalInfo.email}</span>
          <span className="flex items-center gap-1"><MapPin size={12} /> {personalInfo.location}</span>
        </div>
        <div className="flex gap-3 mt-3">
          <a href={personalInfo.github} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-white/80 hover:text-white">
            <Code2 size={14} /> GitHub
          </a>
          <a href={personalInfo.bilibili} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-white/80 hover:text-white">
            <ExternalLink size={14} /> B站
          </a>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="text-lg font-medium mb-4">能力剧场</h2>
        <div className="grid grid-cols-1 gap-3">
          {order.map((section) => {
            const meta = SECTION_META[section]
            const Panel = PANELS[section]
            const isOpen = active === section
            return (
              <div
                key={section}
                className="rounded-2xl border border-white/10 overflow-hidden"
                style={{ background: `${meta.darkColor}80` }}
              >
                <button
                  onClick={() => setActive(isOpen ? null : section)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div>
                    <div className="font-medium" style={{ color: meta.color }}>{meta.title}</div>
                    <div className="text-xs text-white/50">{meta.description}</div>
                  </div>
                  <span className="text-white/50">{isOpen ? '收起' : '展开'}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <Panel />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <footer className="text-xs text-white/40 text-center">
        桌面端访问可获得完整 3D 剧场交互体验
      </footer>
    </div>
  )
}
