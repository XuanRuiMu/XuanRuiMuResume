import { experiences } from '../../data/experience'
import { Section } from '../../components/ui/Section'
import { Card } from '../../components/ui/Card'
import { t } from '../../i18n/translations'

export function ExperienceSection() {
  return (
    <Section id="experience" title={t('experience.title')} subtitle={t('experience.subtitle')}>
      <div className="relative pl-8 md:pl-10">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-8">
          {experiences.map((entry) => (
            <article key={entry.id} className="relative" aria-labelledby={entry.id}>
              <div className="absolute -left-5 top-6 h-3 w-3 -translate-x-1/2 rounded-full bg-primary" />
              <Card className="scroll-reveal-item">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 id={entry.id} className="text-lg font-semibold text-text-primary">
                    {t(entry.titleKey)}
                  </h3>
                  {entry.organizationKey && <span className="text-sm text-muted">{t(entry.organizationKey)}</span>}
                </div>
                <p className="mb-3 text-sm font-medium text-primary">{t(entry.periodKey)}</p>
                <ul className="space-y-1">
                  {entry.descriptionKeys.map((key) => (
                    <li key={key} className="text-sm leading-relaxed text-text-secondary">
                      {t(key)}
                    </li>
                  ))}
                </ul>
              </Card>
            </article>
          ))}
        </div>
      </div>
    </Section>
  )
}
