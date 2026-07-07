import { useState } from 'react'
import { designContent } from '../../data/resumeData'
import { Palette, Shapes } from 'lucide-react'

export function DesignPanel() {
  const [selectedWork, setSelectedWork] = useState(designContent.works[0])

  return (
    <div className="space-y-5">
      <p className="text-sm text-white/75 leading-relaxed">{designContent.intro}</p>

      <div>
        <h3 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
          <Shapes size={14} /> 作品集
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {designContent.works.map((work) => (
            <button
              key={work.name}
              onClick={() => setSelectedWork(work)}
              className={`p-2 rounded-lg text-left text-xs transition-colors border ${
                selectedWork.name === work.name
                  ? 'bg-design-purple/20 border-design-purple text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              <div className="font-medium truncate">{work.name}</div>
              <div className="text-[10px] opacity-70 mt-1">{work.category}</div>
            </button>
          ))}
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-design-purple/30">
          <div className="text-sm font-medium text-white mb-1">{selectedWork.name}</div>
          <div className="text-[10px] text-design-gold mb-2">{selectedWork.category}</div>
          <p className="text-xs text-white/60 leading-relaxed">{selectedWork.desc}</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
          <Palette size={14} /> 设计工具 / 风格
        </h3>
        <div className="flex flex-wrap gap-2">
          {designContent.tools.map((tool) => (
            <span
              key={tool}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80"
            >
              {tool}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
