import { useState, useEffect, useRef } from 'react'
import { musicContent } from '../../data/resumeData'
import { Music, Activity } from 'lucide-react'
import { audioManager } from '../../utils/audio'
import { useTheaterStore } from '../../store/useTheaterStore'

export function MusicPanel() {
  const audioEnabled = useTheaterStore((s) => s.audioEnabled)
  const [visualBars, setVisualBars] = useState(Array(12).fill(0))
  const [activePad, setActivePad] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setVisualBars(Array.from({ length: 12 }).map(() => Math.random() * 100))
    }, 120)
    return () => clearInterval(intervalRef.current)
  }, [])

  const playPad = (note, index) => {
    if (!audioEnabled) {
      audioManager.init()
      audioManager.ensureRunning()
    }
    const freq = audioManager.noteToFrequency(note)
    audioManager.playNote(freq, 0.35, 'sawtooth')
    setActivePad(index)
    setTimeout(() => setActivePad(null), 180)
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-white/75 leading-relaxed">{musicContent.intro}</p>

      <div>
        <h3 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
          <Music size={14} /> 作品 / 曲目
        </h3>
        <div className="space-y-2">
          {musicContent.tracks.map((track) => (
            <div key={track.name} className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">{track.name}</div>
                  <div className="text-[10px] text-music-pink">{track.type}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-music-neon/20 flex items-center justify-center text-music-neon">
                  <Music size={14} />
                </div>
              </div>
              <p className="text-xs text-white/60 mt-2">{track.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
          <Activity size={14} /> 可视化频谱
        </h3>
        <div className="flex items-end gap-1 h-16 p-3 rounded-xl bg-white/5 border border-white/10">
          {visualBars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all duration-100"
              style={{
                height: `${Math.max(h, 8)}%`,
                background: i % 2 === 0 ? '#A855F7' : '#FF006E',
                opacity: 0.7 + h / 300,
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white/90 mb-3">迷你 Launchpad</h3>
        <div className="grid grid-cols-4 gap-2">
          {musicContent.launchpadNotes.map((pad, i) => (
            <button
              key={i}
              onClick={() => playPad(pad.note, i)}
              className="aspect-square rounded-lg transition-all duration-100 border border-white/10 hover:scale-105"
              style={{
                background: activePad === i ? pad.color : `${pad.color}30`,
                boxShadow: activePad === i ? `0 0 16px ${pad.color}` : 'none',
              }}
            >
              <span className="text-xs font-medium text-white">{pad.note}</span>
            </button>
          ))}
        </div>
        {!audioEnabled && (
          <p className="text-[10px] text-white/40 mt-2">点击音符将自动启用音频上下文</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {musicContent.skills.map((skill) => (
          <span
            key={skill}
            className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  )
}
