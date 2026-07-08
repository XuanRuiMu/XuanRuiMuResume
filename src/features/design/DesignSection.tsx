import { Palette } from 'lucide-react'
import { design } from '../../data/design'
import { Section } from '../../components/ui/Section'
import { Card } from '../../components/ui/Card'
import { Tag } from '../../components/ui/Tag'
import { t } from '../../i18n/translations'

export function DesignSection() {
  return (
    <Section id="design" title={t('design.title')} subtitle={t('design.subtitle')}>
      <div className="mb-8 max-w-2xl">
        <h3 className="mb-3 text-2xl font-semibold text-text-primary">{t(design.headlineKey)}</h3>
        <p className="leading-relaxed text-text-secondary">{t(design.introKey)}</p>
      </div>

      <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {design.works.map((work) => (
          <Card key={work.id} hover>
            <div className="mb-3 flex items-center gap-2 text-primary">
              <Palette size={18} aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-wider">{t(work.categoryKey)}</span>
            </div>
            <h4 className="mb-2 text-lg font-semibold text-text-primary">{t(work.nameKey)}</h4>
            <p className="text-sm leading-relaxed text-text-secondary">{t(work.descKey)}</p>
          </Card>
        ))}
      </div>

      <Card header={<h4 className="text-sm font-medium text-muted">{t('design.toolsTitle')}</h4>}>
        <div className="flex flex-wrap gap-2">
          {design.toolKeys.map((key) => (
            <Tag key={key}>{t(key)}</Tag>
          ))}
        </div>
      </Card>
    </Section>
  )
}
