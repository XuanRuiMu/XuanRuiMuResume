import { useEffect, useRef } from 'react'
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

const SHENG_ZI_CHANG_DU = 64
const SHENG_ZI_JIE_DIANS = 6
const SHENG_ZI_ZHONG_LI = 0.45
const SHENG_ZI_ZU_NI = 0.992
const BIAN_QIAN_LA_LI = 4.5

const HUI_FU_XI_SHU = 0.0001
const ZU_NI_XI_SHU = 0.004
const SHU_BIAO_YING_XIANG = 0.00012
const FENG_CHANG_PIN_LV = 0.0015
const FENG_CHANG_QIANG_DU = 0.000008
const ZUI_DA_PIAN_YI = (6 * Math.PI) / 180

interface ShengZiJieDian {
  x: number
  y: number
  prevX: number
  prevY: number
}

function StickyNote({ project, index, reducedMotion }: StickyNoteProps) {
  const link = project.links?.[0]
  const rotation = NOTE_ROTATIONS[index % NOTE_ROTATIONS.length]
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

    const rongQiKuan = rongQi.offsetWidth
    const maoDianX = rongQiKuan / 2
    const maoDianY = 0
    const jieDuanChang = SHENG_ZI_CHANG_DU / SHENG_ZI_JIE_DIANS

    const jieDians: ShengZiJieDian[] = []
    for (let i = 0; i <= SHENG_ZI_JIE_DIANS; i++) {
      const y = maoDianY + i * jieDuanChang
      jieDians.push({ x: maoDianX, y, prevX: maoDianX, prevY: y })
    }

    const jingZhiJiaoDuRad = (rotation * Math.PI) / 180
    const zhuangTai = {
      jiaoDu: jingZhiJiaoDuRad,
      jiaoSuDu: 0,
      shangCiX: 0,
      shangCiY: 0,
      shangCiShiJian: 0,
    }

    const huiZhiShengZi = () => {
      if (jieDians.length < 2) return
      let d = `M ${jieDians[0].x.toFixed(2)} ${jieDians[0].y.toFixed(2)}`
      for (let i = 1; i < jieDians.length - 1; i++) {
        const cur = jieDians[i]
        const next = jieDians[i + 1]
        const xc = (cur.x + next.x) / 2
        const yc = (cur.y + next.y) / 2
        d += ` Q ${cur.x.toFixed(2)} ${cur.y.toFixed(2)} ${xc.toFixed(2)} ${yc.toFixed(2)}`
      }
      const last = jieDians[jieDians.length - 1]
      d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`
      path.setAttribute('d', d)
    }

    const yingYongJingZhi = () => {
      huiZhiShengZi()
      const last = jieDians[jieDians.length - 1]
      const clipKuan = clip.offsetWidth || 20
      const clipGao = clip.offsetHeight || 12
      clip.style.transform = `translate(${(last.x - clipKuan / 2).toFixed(2)}px, ${(last.y - clipGao / 2).toFixed(2)}px)`
      const noteKuan = note.offsetWidth || rongQiKuan
      note.style.transform = `translate(${(last.x - noteKuan / 2).toFixed(2)}px, ${last.y.toFixed(2)}px) rotate(${rotation}deg)`
    }

    if (reducedMotion) {
      yingYongJingZhi()
      return
    }

    let xunHuanId: number | null = null
    let shangCiZhen = performance.now()

    const yingYongZiTai = () => {
      huiZhiShengZi()
      const last = jieDians[jieDians.length - 1]
      const clipKuan = clip.offsetWidth || 20
      const clipGao = clip.offsetHeight || 12
      clip.style.transform = `translate(${(last.x - clipKuan / 2).toFixed(2)}px, ${(last.y - clipGao / 2).toFixed(2)}px)`
      const noteKuan = note.offsetWidth || rongQiKuan
      const jiaoDuDeg = (zhuangTai.jiaoDu * 180) / Math.PI
      note.style.transform = `translate(${(last.x - noteKuan / 2).toFixed(2)}px, ${last.y.toFixed(2)}px) rotate(${jiaoDuDeg.toFixed(3)}deg)`
    }

    const gengXinShengZi = (dt: number) => {
      const dtScale = Math.min(dt * 0.06, 1)

      for (let i = 1; i < jieDians.length; i++) {
        const node = jieDians[i]
        const vx = (node.x - node.prevX) * SHENG_ZI_ZU_NI
        const vy = (node.y - node.prevY) * SHENG_ZI_ZU_NI
        node.prevX = node.x
        node.prevY = node.y
        node.x += vx
        node.y += vy + SHENG_ZI_ZHONG_LI * dtScale
      }

      const last = jieDians[jieDians.length - 1]
      const pianYiLi = Math.sin(zhuangTai.jiaoDu - jingZhiJiaoDuRad) * BIAN_QIAN_LA_LI * dtScale
      last.x += pianYiLi

      for (let iter = 0; iter < 2; iter++) {
        jieDians[0].x = maoDianX
        jieDians[0].y = maoDianY
        for (let i = 0; i < jieDians.length - 1; i++) {
          const a = jieDians[i]
          const b = jieDians[i + 1]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001
          const diff = (dist - jieDuanChang) / dist
          if (i === 0) {
            b.x -= dx * diff
            b.y -= dy * diff
          } else {
            a.x += dx * diff * 0.5
            a.y += dy * diff * 0.5
            b.x -= dx * diff * 0.5
            b.y -= dy * diff * 0.5
          }
        }
      }
    }

    const xunHuan = (shiJian: number) => {
      const dt = Math.min(shiJian - shangCiZhen, 50)
      shangCiZhen = shiJian

      if (dt > 0) {
        const pianYi = zhuangTai.jiaoDu - jingZhiJiaoDuRad
        const huiFuLi = -HUI_FU_XI_SHU * pianYi
        const zuNiLi = -ZU_NI_XI_SHU * zhuangTai.jiaoSuDu
        const fengLi = Math.sin(shiJian * FENG_CHANG_PIN_LV + index) * FENG_CHANG_QIANG_DU
        zhuangTai.jiaoSuDu += (huiFuLi + zuNiLi + fengLi) * dt
        zhuangTai.jiaoDu += zhuangTai.jiaoSuDu * dt
        zhuangTai.jiaoDu = Math.max(
          jingZhiJiaoDuRad - ZUI_DA_PIAN_YI,
          Math.min(jingZhiJiaoDuRad + ZUI_DA_PIAN_YI, zhuangTai.jiaoDu)
        )

        gengXinShengZi(dt)
      }

      yingYongZiTai()

      xunHuanId = requestAnimationFrame(xunHuan)
    }

    const chuLiYiDong = (e: MouseEvent) => {
      const xianZai = performance.now()

      if (zhuangTai.shangCiShiJian > 0) {
        const dt = Math.max(xianZai - zhuangTai.shangCiShiJian, 1)
        const vx = (e.clientX - zhuangTai.shangCiX) / dt
        const vy = (e.clientY - zhuangTai.shangCiY) / dt
        const fengSu = Math.sqrt(vx * vx + vy * vy)

        if (fengSu > 0.03) {
          const qieXiangSuDu = -(vx * Math.cos(zhuangTai.jiaoDu) + vy * Math.sin(zhuangTai.jiaoDu))
          zhuangTai.jiaoSuDu += qieXiangSuDu * SHU_BIAO_YING_XIANG
        }
      }

      zhuangTai.shangCiX = e.clientX
      zhuangTai.shangCiY = e.clientY
      zhuangTai.shangCiShiJian = xianZai

      if (xunHuanId === null) {
        shangCiZhen = performance.now()
        xunHuanId = requestAnimationFrame(xunHuan)
      }
    }

    const chuLiJinRu = () => {
      zhuangTai.shangCiShiJian = 0
      if (xunHuanId === null) {
        shangCiZhen = performance.now()
        xunHuanId = requestAnimationFrame(xunHuan)
      }
    }

    const chuLiLiKai = () => {
      zhuangTai.shangCiShiJian = 0
    }

    note.addEventListener('mouseenter', chuLiJinRu)
    note.addEventListener('mouseleave', chuLiLiKai)
    note.addEventListener('mousemove', chuLiYiDong)

    yingYongZiTai()
    shangCiZhen = performance.now()
    xunHuanId = requestAnimationFrame(xunHuan)

    return () => {
      if (xunHuanId !== null) {
        cancelAnimationFrame(xunHuanId)
        xunHuanId = null
      }
      note.removeEventListener('mouseenter', chuLiJinRu)
      note.removeEventListener('mouseleave', chuLiLiKai)
      note.removeEventListener('mousemove', chuLiYiDong)
      note.style.removeProperty('transform')
      clip.style.removeProperty('transform')
      path.removeAttribute('d')
    }
  }, [reducedMotion, rotation, index])

  const paper = (
    <div ref={noteRef} className="note-paper note-parchment">
      <img
        src="/images/parchment-note.png"
        alt=""
        className={cn('note-parchment-img', `note-color-${colorIndex}`)}
        aria-hidden="true"
      />
      <div className="note-parchment-content">
        <h3 className="font-display text-sm font-semibold leading-tight note-text line-clamp-2 md:text-base">
          {t(project.nameKey)}
        </h3>
        <p className="line-clamp-3 text-xs leading-relaxed note-text-soft md:text-sm">{t(project.descKey)}</p>
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
      ref={rongQiRef}
      className={cn('note-anchor-container group outline-none', !reducedMotion && 'note-physics')}
      data-feng={reducedMotion ? undefined : ''}
    >
      <svg className="rope-svg" aria-hidden="true">
        <path
          ref={pathRef}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-text-secondary/60"
        />
      </svg>
      <div ref={clipRef} className="note-clip" aria-hidden="true" />
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
        <div className="relative z-10 flex flex-wrap items-start justify-center gap-3 md:gap-6">
          {projects.map((project, index) => (
            <StickyNote key={project.id} project={project} index={index} reducedMotion={reducedMotion} />
          ))}
        </div>
      </div>
    </Section>
  )
}
