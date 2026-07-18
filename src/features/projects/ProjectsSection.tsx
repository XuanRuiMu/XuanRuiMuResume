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
const STRING_LENGTHS = [44, 60, 36, 68]

function StickyNote({ project, index, reducedMotion }: StickyNoteProps) {
  const link = project.links?.[0]
  const rotation = NOTE_ROTATIONS[index % NOTE_ROTATIONS.length]
  const stringLength = STRING_LENGTHS[index % STRING_LENGTHS.length]

  const colorIndex = index % 4

  const bianQianWaiKeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = bianQianWaiKeRef.current
    if (!wrapper) return

    const jingZhiJiaoDu = rotation
    wrapper.style.transform = `rotate(${jingZhiJiaoDu}deg)`

    if (reducedMotion) return

    const zhuangTai = {
      jiaoDu: (jingZhiJiaoDu * Math.PI) / 180,
      jiaoSuDu: 0,
      shangCiX: 0,
      shangCiY: 0,
      shangCiShiJian: 0,
      huoDong: false,
    }

    let xunHuanId: number | null = null
    let shangCiZhen = performance.now()

    const HUI_FU_XI_SHU = 0.00006
    const ZU_NI_XI_SHU = 0.0022
    const JIAO_DU_YU_ZHI = 0.0003
    const JIAO_SU_YU_ZHI = 0.00002
    const SHU_BIAO_YING_XIANG = 0.00045
    const FENG_CHANG_PIN_LV = 0.0011
    const FENG_CHANG_QIANG_DU = 0.000008
    const ZUI_DA_PIAN_YI = (18 * Math.PI) / 180

    const yingYongZiTai = () => {
      wrapper.style.transform = `rotate(${(zhuangTai.jiaoDu * 180) / Math.PI}deg)`
    }

    const xunHuan = (shiJian: number) => {
      const dt = Math.min(shiJian - shangCiZhen, 50)
      shangCiZhen = shiJian

      if (dt > 0) {
        const pianYi = zhuangTai.jiaoDu - (jingZhiJiaoDu * Math.PI) / 180
        const huiFuLi = -HUI_FU_XI_SHU * pianYi
        const zuNiLi = -ZU_NI_XI_SHU * zhuangTai.jiaoSuDu
        const fengLi = Math.sin(shiJian * FENG_CHANG_PIN_LV + index) * FENG_CHANG_QIANG_DU
        zhuangTai.jiaoSuDu += (huiFuLi + zuNiLi + fengLi) * dt
        zhuangTai.jiaoDu += zhuangTai.jiaoSuDu * dt
        const jingZhiJiaoDuRad = (jingZhiJiaoDu * Math.PI) / 180
        zhuangTai.jiaoDu = Math.max(
          jingZhiJiaoDuRad - ZUI_DA_PIAN_YI,
          Math.min(jingZhiJiaoDuRad + ZUI_DA_PIAN_YI, zhuangTai.jiaoDu)
        )
      }

      const yunDongZhong =
        zhuangTai.huoDong ||
        Math.abs(zhuangTai.jiaoDu - (jingZhiJiaoDu * Math.PI) / 180) > JIAO_DU_YU_ZHI ||
        Math.abs(zhuangTai.jiaoSuDu) > JIAO_SU_YU_ZHI

      if (yunDongZhong) {
        yingYongZiTai()
        xunHuanId = requestAnimationFrame(xunHuan)
      } else {
        zhuangTai.jiaoSuDu = 0
        zhuangTai.jiaoDu = (jingZhiJiaoDu * Math.PI) / 180
        yingYongZiTai()
        xunHuanId = null
      }
    }

    const chuLiYiDong = (e: MouseEvent) => {
      const xianZai = performance.now()

      if (zhuangTai.shangCiShiJian > 0) {
        const dt = Math.max(xianZai - zhuangTai.shangCiShiJian, 1)
        const vx = (e.clientX - zhuangTai.shangCiX) / dt
        const vy = (e.clientY - zhuangTai.shangCiY) / dt
        const fengSu = Math.sqrt(vx * vx + vy * vy)

        if (fengSu > 0.03) {
          const qieXiangSuDu = vx * Math.cos(zhuangTai.jiaoDu) + vy * Math.sin(zhuangTai.jiaoDu)
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
      zhuangTai.huoDong = true
      zhuangTai.shangCiShiJian = 0
      if (xunHuanId === null) {
        shangCiZhen = performance.now()
        xunHuanId = requestAnimationFrame(xunHuan)
      }
    }

    const chuLiLiKai = () => {
      zhuangTai.huoDong = false
    }

    wrapper.addEventListener('mouseenter', chuLiJinRu)
    wrapper.addEventListener('mouseleave', chuLiLiKai)
    wrapper.addEventListener('mousemove', chuLiYiDong)

    shangCiZhen = performance.now()
    xunHuanId = requestAnimationFrame(xunHuan)

    return () => {
      if (xunHuanId !== null) {
        cancelAnimationFrame(xunHuanId)
      }
      wrapper.removeEventListener('mouseenter', chuLiJinRu)
      wrapper.removeEventListener('mouseleave', chuLiLiKai)
      wrapper.removeEventListener('mousemove', chuLiYiDong)
      wrapper.style.removeProperty('transform')
    }
  }, [reducedMotion, rotation, index])

  const paper = (
    <div className="note-paper note-parchment relative w-44 will-change-transform md:w-52">
      <img
        src="/images/parchment-note.png"
        alt=""
        className={cn('note-parchment-img', `note-color-${colorIndex}`)}
        aria-hidden="true"
      />
      <div
        className={cn(
          'note-parchment-content relative flex flex-col gap-2 transition-all duration-300 will-change-transform',
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
      ref={bianQianWaiKeRef}
      className={cn('note-wrapper group flex flex-col items-center outline-none', !reducedMotion && 'note-physics')}
      data-feng={reducedMotion ? undefined : ''}
      style={{
        marginTop: `${stringLength}px`,
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
