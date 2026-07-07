import { useState } from 'react'
import { mediaContent } from '../../data/resumeData'
import { Film, PenTool, Gamepad2, Video, Clock } from 'lucide-react'

const ICONS = {
  writing: PenTool,
  comedy: Film,
  game: Gamepad2,
  video: Video,
}

export function MediaPanel() {
  const [activeCategory, setActiveCategory] = useState(mediaContent.categories[0].id)
  const activeItems = mediaContent.categories.find((c) => c.id === activeCategory)

  return (
    <div className="space-y-5">
      <p className="text-sm text-white/75 leading-relaxed">{mediaContent.intro}</p>

      <div>
        <h3 className="text-sm font-medium text-white/90 mb-3">项目分类</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {mediaContent.categories.map((cat) => {
            const Icon = ICONS[cat.id]
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors border ${
                  activeCategory === cat.id
                    ? 'bg-media-rose/20 border-media-rose text-white'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {Icon && <Icon size={12} />}
                {cat.label}
              </button>
            )
          })}
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-media-rose/30">
          <div className="text-sm font-medium text-white mb-2">{activeItems?.label}</div>
          <ul className="space-y-1.5">
            {activeItems?.items.map((item) => (
              <li key={item} className="text-xs text-white/70 flex gap-2">
                <span className="text-media-rose">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
          <Clock size={14} /> 创作时间线
        </h3>
        <div className="relative pl-4 border-l border-white/10 space-y-4">
          {mediaContent.timeline.map((item) => (
            <div key={item.year} className="relative">
              <span
                className="absolute -left-[21px] top-0 w-2.5 h-2.5 rounded-full bg-media-mint"
                style={{ boxShadow: '0 0 8px #4ECDC4' }}
              />
              <div className="text-xs text-media-mint font-medium">{item.year}</div>
              <div className="text-xs text-white/70">{item.event}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
