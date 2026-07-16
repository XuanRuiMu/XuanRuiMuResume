import { media } from '../../data/media'
import { music } from '../../data/music'
import { Section } from '../../components/ui/Section'
import { Card } from '../../components/ui/Card'
import { t } from '../../i18n/translations'

export function MediaSection() {
  const javaTrack = music.tracks.find((track) => track.id === 'javaInstrument')

  return (
    <Section id="media" title={t('media.title')} subtitle={t('media.subtitle')}>
      <div className="mb-8 max-w-2xl">
        <h3 className="mb-3 text-2xl font-semibold text-text-primary text-shadow-readable">{t(media.headlineKey)}</h3>
        <p className="leading-relaxed text-text-secondary text-shadow-readable">{t(media.introKey)}</p>
      </div>

      {javaTrack && (
        <Card className="mb-10 scroll-reveal-item border-secondary/20">
          <h4 className="mb-2 text-lg font-semibold text-text-primary text-shadow-readable">{t(javaTrack.nameKey)}</h4>
          <p className="text-sm leading-relaxed text-text-secondary text-shadow-readable">{t(javaTrack.descKey)}</p>
        </Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {media.categories.map((category) => (
          <Card key={category.id} className="scroll-reveal-item border-secondary/20">
            <h4 className="mb-3 text-lg font-semibold text-text-primary text-shadow-readable">
              {t(category.labelKey)}
            </h4>
            <ul className="space-y-2">
              {category.itemKeys.map((key) => (
                <li key={key} className="text-sm leading-relaxed text-text-secondary text-shadow-readable">
                  {t(key)}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </Section>
  )
}
