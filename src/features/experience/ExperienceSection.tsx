import { useEffect, useRef } from 'react'
import { experiences } from '../../data/experience'
import { Section } from '../../components/ui/Section'
import { Card } from '../../components/ui/Card'
import { t } from '../../i18n/translations'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const TIMELINE_PROGRESS_VAR = '--timeline-progress'

function useTimelineProgress(ref: React.RefObject<HTMLElement | null>, count: number) {
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion || !ref.current) return

    const element = ref.current
    let rafId = 0
    let lastProgress = -1

    const nodes = Array.from(element.querySelectorAll<HTMLElement>('[data-timeline-index] .timeline-node'))

    const updateProgress = () => {
      const rect = element.getBoundingClientRect()
      const viewportCenter = window.innerHeight * 0.5
      const timelineHeight = rect.height
      const ratio = timelineHeight > 0 ? Math.min(1, Math.max(0, (viewportCenter - rect.top) / timelineHeight)) : 0

      if (Math.abs(ratio - lastProgress) > 0.005) {
        lastProgress = ratio
        element.style.setProperty(TIMELINE_PROGRESS_VAR, String(ratio))
      }

      for (const node of nodes) {
        const nodeRect = node.getBoundingClientRect()
        const nodeCenter = nodeRect.top + nodeRect.height * 0.5
        const nodeRatio = timelineHeight > 0 ? Math.min(1, Math.max(0, (nodeCenter - rect.top) / timelineHeight)) : 0
        node.classList.toggle('is-active', ratio >= nodeRatio)
      }

      rafId = 0
    }

    const handleScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(updateProgress)
    }

    updateProgress()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [prefersReducedMotion, ref, count])
}

function useTimelineItems(count: number) {
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) return

    const observers: IntersectionObserver[] = []

    for (let index = 0; index < count; index++) {
      const element = document.querySelector(`[data-timeline-index="${index}"]`)
      if (!element) continue

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            element.classList.add('is-visible')
            observer.disconnect()
          }
        },
        { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
      )
      observer.observe(element)
      observers.push(observer)
    }

    return () => {
      for (const observer of observers) observer.disconnect()
    }
  }, [count, prefersReducedMotion])
}

export function ExperienceSection() {
  const timelineRef = useRef<HTMLOListElement>(null)
  const prefersReducedMotion = useReducedMotion()
  useTimelineProgress(timelineRef, experiences.length)
  useTimelineItems(experiences.length)

  return (
    <Section id="experience" title={t('experience.title')} subtitle={t('experience.subtitle')}>
      <ol
        ref={timelineRef}
        className="timeline relative mx-auto max-w-5xl list-none py-4 md:py-8"
        aria-label={t('experience.timelineLabel')}
      >
        {experiences.map((entry, index) => {
          const isEven = index % 2 === 0

          return (
            <li
              key={entry.id}
              data-timeline-index={index}
              className={`timeline-item group grid grid-cols-[auto_1fr] gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-6 ${
                prefersReducedMotion ? 'is-visible' : ''
              }`}
              aria-labelledby={`experience-title-${entry.id}`}
            >
              <div
                className={`timeline-card-wrapper relative rounded-2xl order-2 md:order-none ${
                  isEven ? 'md:col-start-1 md:col-end-2 md:row-start-1' : 'md:col-start-3 md:col-end-4 md:row-start-1'
                }`}
              >
                <Card hover tilt className="group">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3
                      id={`experience-title-${entry.id}`}
                      className="text-lg font-semibold text-text-primary md:text-xl"
                    >
                      {t(entry.titleKey)}
                    </h3>
                    {entry.organizationKey && (
                      <span className="rounded-full bg-surface-elevated px-2.5 py-0.5 text-xs font-medium text-muted">
                        {t(entry.organizationKey)}
                      </span>
                    )}
                  </div>
                  <p className="mb-3 font-display text-sm font-bold tracking-wide text-primary text-glow">
                    {t(entry.periodKey)}
                  </p>
                  <ul className="timeline-details space-y-2 overflow-hidden transition-all duration-500">
                    {entry.descriptionKeys.map((key) => (
                      <li
                        key={key}
                        className="relative pl-4 text-sm leading-relaxed text-text-secondary before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary/70"
                      >
                        {t(key)}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              <div className="order-1 flex w-10 flex-col items-center md:order-none md:col-start-2 md:col-end-3 md:w-20 md:justify-center">
                <div
                  className="timeline-node relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-bg bg-primary shadow-[0_0_16px_rgba(0,217,255,0.6)] transition-transform duration-300 group-hover:scale-125"
                  aria-hidden="true"
                >
                  <span className="h-2 w-2 rounded-full bg-bg" />
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </Section>
  )
}
