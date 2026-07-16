import { ExternalLink } from 'lucide-react'
import { projects } from '../../data/projects'
import type { Project } from '../../data/types'
import { Section } from '../../components/ui/Section'
import { t } from '../../i18n/translations'
import { cn } from '../../lib/utils'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface StickyNoteProps {
  project: Project
  index: number
  reducedMotion: boolean
}

const NOTE_ROTATIONS = [-2.5, 1.8, -1.2, 2.2]
const STRING_LENGTHS = [44, 60, 36, 68]
const SWAY_DELAYS = [0, 0.6, 1.1, 0.3]

function StickyNote({ project, index, reducedMotion }: StickyNoteProps) {
  const link = project.links?.[0]
  const rotation = NOTE_ROTATIONS[index % NOTE_ROTATIONS.length]
  const stringLength = STRING_LENGTHS[index % STRING_LENGTHS.length]
  const delay = SWAY_DELAYS[index % SWAY_DELAYS.length]

  const colorIndex = index % 4

  const paper = (
    <div
      className="note-paper note-parchment relative w-44 md:w-52"
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <img
        src="/images/parchment-note.png"
        alt=""
        className={cn('note-parchment-img', `note-color-${colorIndex}`)}
        aria-hidden="true"
      />
      <div
        className={cn(
          'note-parchment-content relative flex flex-col gap-2 px-4 py-10 transition-all duration-300 will-change-transform',
          'group-hover:scale-105 group-hover:-translate-y-2 group-focus-visible:scale-105 group-focus-visible:-translate-y-2'
        )}
      >
        <h3 className="font-display text-base font-semibold leading-tight note-text line-clamp-2 md:text-lg">
          {t(project.nameKey)}
        </h3>
        <p className="line-clamp-4 text-xs leading-relaxed note-text-soft md:text-sm">{t(project.descKey)}</p>
        {link && (
          <div className="mt-1 inline-flex items-center gap-1 self-start text-xs font-medium note-text-soft transition-opacity group-hover:opacity-100">
            <span className="line-clamp-1 max-w-[8rem]">{t(link.labelKey)}</span>
            <ExternalLink size={12} aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  )

  const content = (
    <div
      className={cn('note-wrapper group flex flex-col items-center outline-none', !reducedMotion && 'note-sway')}
      style={{
        marginTop: `${stringLength}px`,
        animationDelay: `${delay}s`,
      }}
    >
      <div
        className="note-string w-px bg-gradient-to-b from-text-secondary/50 to-text-secondary/20"
        style={{ height: `${stringLength}px` }}
        aria-hidden="true"
      />
      <div
        className="note-clip my-1 h-3 w-5 rounded-sm shadow-sm"
        style={{ background: 'oklch(from #a16207 l c h / 0.85)' }}
        aria-hidden="true"
      />
      {paper}
    </div>
  )

  if (!link) {
    return content
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="note-link block"
      aria-label={`${t(project.nameKey)}：${t(link.labelKey)}`}
    >
      {content}
    </a>
  )
}

export function ProjectsSection() {
  const reducedMotion = useReducedMotion()

  return (
    <Section id="projects" title={t('projects.title')} subtitle={t('projects.subtitle')}>
      <div className="relative min-h-[28rem] px-2 py-4 md:min-h-[32rem]">
        <svg
          className="rope-svg pointer-events-none absolute left-0 right-0 top-0 h-20 w-full"
          viewBox="0 0 1000 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,40 C200,58 400,22 600,40 C800,58 900,30 1000,40"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="text-text-secondary/60"
          />
        </svg>

        <div className="relative z-10 flex flex-wrap items-start justify-center gap-3 pt-10 md:gap-6 md:pt-14">
          {projects.map((project, index) => (
            <StickyNote key={project.id} project={project} index={index} reducedMotion={reducedMotion} />
          ))}
        </div>
      </div>
    </Section>
  )
}
