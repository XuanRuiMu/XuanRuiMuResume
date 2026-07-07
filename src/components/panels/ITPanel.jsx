import { useState } from 'react'
import { itContent } from '../../data/resumeData'
import { Cpu, ChevronDown, ChevronUp } from 'lucide-react'

export function ITPanel() {
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="space-y-5">
      <p className="text-sm text-white/75 leading-relaxed">{itContent.intro}</p>

      <div className="grid grid-cols-2 gap-3">
        {itContent.capabilityCards.map((card) => (
          <button
            key={card.title}
            onClick={() => setExpanded(expanded === card.title ? null : card.title)}
            className="text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-it-cyan font-medium">
                <Cpu size={14} />
                {card.title}
              </div>
              {expanded === card.title ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
            {expanded === card.title && (
              <ul className="text-xs text-white/60 space-y-1 mt-2">
                {card.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            )}
          </button>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-medium text-white/90 mb-3">项目列表</h3>
        <div className="space-y-3">
          {itContent.projects.map((project) => (
            <div key={project.name} className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-white">{project.name}</div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {project.tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-it-cyan/15 text-it-cyan">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-xs text-white/60 leading-relaxed">{project.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
