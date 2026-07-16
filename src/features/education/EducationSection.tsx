import { motion, useReducedMotion } from 'framer-motion'
import { education } from '../../data/education'
import { Section } from '../../components/ui/Section'
import { t } from '../../i18n/translations'

export function EducationSection() {
  const shouldReduceMotion = useReducedMotion()

  const transition = shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: 'easeOut' as const }

  return (
    <Section id="education" title={t('education.title')} subtitle={t('education.subtitle')}>
      <motion.div
        className="scroll-reveal-item max-w-3xl"
        initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={transition}
      >
        <div className="flex items-start gap-6">
          <div className="relative flex flex-col items-center gap-2 pt-1">
            <div className="h-3 w-3 rounded-full bg-text-primary/80" />
            <div className="h-full w-px bg-gradient-to-b from-text-primary/40 to-transparent min-h-[4rem]" />
            <span className="whitespace-nowrap text-xs text-text-secondary text-shadow-readable [writing-mode:vertical-rl]">
              {education.summary.period}
            </span>
          </div>
          <p className="text-lg leading-relaxed text-text-primary text-shadow-readable">{t('education.paragraph')}</p>
        </div>
      </motion.div>
    </Section>
  )
}
