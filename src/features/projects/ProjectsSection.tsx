import { useCallback, useEffect, useRef } from 'react'
import { ExternalLink } from 'lucide-react'
import { projects } from '../../data/projects'
import type { Project } from '../../data/types'
import { Section } from '../../components/ui/Section'
import { t } from '../../i18n/translations'
import { cn } from '../../lib/utils'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { 便签物理引擎, 创建默认便签配置, type 便签姿态 } from './stickyPhysics'

const NOTE_ROTATIONS = [-2.5, 1.8, -1.2, 2.2]
const 绳长 = 64
const 绳节点数 = 6
const 夹子宽 = 22
const 夹子高 = 12

function 便签静止角Deg(index: number): number {
  return NOTE_ROTATIONS[index % NOTE_ROTATIONS.length]
}

interface 便签Ref集合 {
  rongQi: HTMLDivElement
  path: SVGPathElement
  clip: HTMLDivElement
  note: HTMLDivElement
}

interface StickyNoteProps {
  project: Project
  index: number
  reducedMotion: boolean
  注册Ref: (id: string, refs: 便签Ref集合) => void
  注销Ref: (id: string) => void
}

function 应用静止姿态(refs: 便签Ref集合, rotationDeg: number) {
  const { rongQi, path, clip, note } = refs
  const 容器宽 = rongQi.offsetWidth
  const 锚点X = 容器宽 / 2
  const 分段长 = 绳长 / 绳节点数

  let d = `M ${锚点X.toFixed(2)} 0`
  for (let i = 1; i <= 绳节点数; i++) {
    d += ` L ${锚点X.toFixed(2)} ${(i * 分段长).toFixed(2)}`
  }
  path.setAttribute('d', d)

  const 末端Y = 绳长
  clip.style.transform = `translate(${(锚点X - 夹子宽 / 2).toFixed(2)}px, ${(末端Y - 夹子高 / 2).toFixed(2)}px)`

  const noteKuan = note.offsetWidth || 容器宽
  note.style.transform = `translate(${(锚点X - noteKuan / 2).toFixed(2)}px, ${末端Y.toFixed(2)}px) rotate(${rotationDeg}deg)`
}

function StickyNote({ project, index, reducedMotion, 注册Ref, 注销Ref }: StickyNoteProps) {
  const link = project.links?.[0]
  const rotation = 便签静止角Deg(index)
  const colorIndex = index % 4

  const rongQiRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const clipRef = useRef<HTMLDivElement>(null)
  const noteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const rongQi = rongQiRef.current
    const path = pathRef.current
    const clip = clipRef.current
    const note = noteRef.current
    if (!rongQi || !path || !clip || !note) return
    const refs = { rongQi, path, clip, note }
    注册Ref(project.id, refs)
    if (reducedMotion) {
      应用静止姿态(refs, rotation)
    }
    return () => 注销Ref(project.id)
  }, [project.id, 注册Ref, 注销Ref, reducedMotion, rotation])

  return (
    <div
      ref={rongQiRef}
      className={cn('note-anchor-container group outline-none', !reducedMotion && 'note-physics')}
      data-feng={reducedMotion ? undefined : ''}
    >
      <svg className="rope-svg" aria-hidden="true">
        <defs>
          <linearGradient id="silver-rope-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e8eaed" />
            <stop offset="45%" stopColor="#9aa0a6" />
            <stop offset="100%" stopColor="#5f6368" />
          </linearGradient>
        </defs>
        <path ref={pathRef} fill="none" stroke="url(#silver-rope-gradient)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <div ref={clipRef} className="note-clip" aria-hidden="true" />
      <div ref={noteRef} className="note-paper note-parchment">
        <img
          src="/images/标准.png"
          alt=""
          className={cn('note-parchment-img', `note-color-${colorIndex}`)}
          aria-hidden="true"
        />
        <div className="note-color-overlay" data-color={colorIndex} aria-hidden="true" />
        <div className="note-parchment-content">
          <h3 className="font-display note-title note-text">{t(project.nameKey)}</h3>
          <p className="note-desc note-text-soft">{t(project.descKey)}</p>
          {link && (
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="note-link-text inline-flex items-center gap-1 self-start note-text-soft transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label={`${t(project.nameKey)}：${t(link.labelKey)}`}
            >
              <span className="note-link-label">{t(link.labelKey)}</span>
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function 绘制绳子Path(path: SVGPathElement, 节点: 便签姿态['绳子节点']) {
  if (节点.length < 2) return
  let d = `M ${节点[0].x.toFixed(2)} ${节点[0].y.toFixed(2)}`
  for (let i = 1; i < 节点.length - 1; i++) {
    const cur = 节点[i]
    const next = 节点[i + 1]
    const xc = (cur.x + next.x) / 2
    const yc = (cur.y + next.y) / 2
    d += ` Q ${cur.x.toFixed(2)} ${cur.y.toFixed(2)} ${xc.toFixed(2)} ${yc.toFixed(2)}`
  }
  const last = 节点[节点.length - 1]
  d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`
  path.setAttribute('d', d)
}

export function ProjectsSection() {
  const reducedMotion = useReducedMotion()
  const refsMap = useRef<Map<string, 便签Ref集合>>(new Map())
  const engineRef = useRef<便签物理引擎 | null>(null)
  const 容器Ref = useRef<HTMLDivElement>(null)

  const 注册Ref = useCallback((id: string, refs: 便签Ref集合) => {
    refsMap.current.set(id, refs)
  }, [])

  const 注销Ref = useCallback((id: string) => {
    refsMap.current.delete(id)
  }, [])

  useEffect(() => {
    if (reducedMotion) return
    const refsSnapshot = refsMap.current
    if (refsSnapshot.size !== projects.length) return

    const 引擎 = new 便签物理引擎()
    engineRef.current = 引擎

    for (let index = 0; index < projects.length; index++) {
      const project = projects[index]
      const refs = refsSnapshot.get(project.id)
      if (!refs) continue
      const 容器宽 = refs.rongQi.offsetWidth
      const 配置 = 创建默认便签配置({
        便签ID: project.id,
        容器宽,
        绳长,
        静止角Deg: 便签静止角Deg(index),
        索引: index,
      })
      引擎.添加便签(配置)
    }

    const 同步DOM = (姿态列表: 便签姿态[]) => {
      for (const 姿态 of 姿态列表) {
        const refs = refsSnapshot.get(姿态.便签ID)
        if (!refs) continue
        const { note, path, clip } = refs
        const noteKuan = note.offsetWidth || 姿态.便签宽
        const topX = 姿态.便签X - noteKuan / 2
        const topY = 姿态.便签Y - 姿态.便签高 / 2
        note.style.transform = `translate(${topX.toFixed(2)}px, ${topY.toFixed(2)}px) rotate(${姿态.角度.toFixed(3)}rad)`
        绘制绳子Path(path, 姿态.绳子节点)
        const 末端 = 姿态.绳子节点[姿态.绳子节点.length - 1]
        clip.style.transform = `translate(${(末端.x - 夹子宽 / 2).toFixed(2)}px, ${(末端.y - 夹子高 / 2).toFixed(2)}px)`
      }
    }

    引擎.设置姿态回调(同步DOM)
    引擎.启动()

    const 鼠标处理器Map = new Map<string, { move: (e: MouseEvent) => void; enter: () => void; leave: () => void }>()

    for (const project of projects) {
      const refs = refsSnapshot.get(project.id)
      if (!refs) continue
      const move = (e: MouseEvent) => {
        引擎.施加鼠标力(project.id, e.clientX, e.clientY)
      }
      const enter = () => 引擎.重置鼠标状态(project.id)
      const leave = () => 引擎.重置鼠标状态(project.id)
      refs.note.addEventListener('mouseenter', enter)
      refs.note.addEventListener('mouseleave', leave)
      refs.note.addEventListener('mousemove', move)
      鼠标处理器Map.set(project.id, { move, enter, leave })
    }

    let observer: IntersectionObserver | null = null
    const 容器 = 容器Ref.current
    if (容器 && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            引擎.设置可见(entry.isIntersecting)
          }
        },
        { threshold: 0 }
      )
      observer.observe(容器)
    }

    return () => {
      for (const [id, handlers] of 鼠标处理器Map) {
        const refs = refsSnapshot.get(id)
        if (!refs) continue
        refs.note.removeEventListener('mouseenter', handlers.enter)
        refs.note.removeEventListener('mouseleave', handlers.leave)
        refs.note.removeEventListener('mousemove', handlers.move)
      }
      鼠标处理器Map.clear()
      observer?.disconnect()
      引擎.销毁()
      engineRef.current = null
    }
  }, [reducedMotion])

  return (
    <Section id="projects" title={t('projects.title')} subtitle={t('projects.subtitle')}>
      <div ref={容器Ref} className="relative min-h-[28rem] px-2 py-4 md:min-h-[32rem]">
        <div className="relative z-10 flex flex-wrap items-start justify-center gap-3 md:gap-6">
          {projects.map((project, index) => (
            <StickyNote
              key={project.id}
              project={project}
              index={index}
              reducedMotion={reducedMotion}
              注册Ref={注册Ref}
              注销Ref={注销Ref}
            />
          ))}
        </div>
      </div>
    </Section>
  )
}
