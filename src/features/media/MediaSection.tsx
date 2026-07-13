import { media } from '../../data/media'
import { Section } from '../../components/ui/Section'
import { Card } from '../../components/ui/Card'
import { t } from '../../i18n/translations'

export function MediaSection() {
  return (
    <Section id="media" title={t('media.title')} subtitle={t('media.subtitle')}>
      <div className="mb-8 max-w-2xl">
        <h3 className="mb-3 text-2xl font-semibold text-text-primary">{t(media.headlineKey)}</h3>
        <p className="leading-relaxed text-text-secondary">{t(media.introKey)}</p>
      </div>

      <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {media.categories.map((category) => (
          <Card key={category.id} hover tilt className="scroll-reveal-item">
            <h4 className="mb-3 text-lg font-semibold text-text-primary">{t(category.labelKey)}</h4>
            <ul className="space-y-2">
              {category.itemKeys.map((key) => (
                <li key={key} className="text-sm leading-relaxed text-text-secondary">
                  {t(key)}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card tilt className="scroll-reveal-item">
        <h4 className="mb-4 text-sm font-medium text-muted">{t('media.timelineTitle')}</h4>
        <div className="relative pl-8 md:pl-10">
          <div className="absolute top-0 bottom-0 left-3 w-px bg-border" />
          <div className="space-y-6">
            {media.timeline.map((event) => (
              <article key={event.year} className="relative">
                <div className="absolute -left-5 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full bg-primary" />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
                  <span className="text-sm font-semibold text-primary">{event.year}</span>
                  <span className="text-sm text-text-secondary">{t(event.eventKey)}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Card>
    </Section>
  )
}
