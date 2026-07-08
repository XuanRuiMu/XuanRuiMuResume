import type { TranslationKey } from '../../i18n/translations'
import { FolderGit2, Code2, GraduationCap, Users } from 'lucide-react'
import { Section } from '../../components/ui/Section'
import { Card } from '../../components/ui/Card'
import { t } from '../../i18n/translations'

interface MetricConfig {
  id: string
  valueKey: TranslationKey
  labelKey: TranslationKey
  icon: typeof FolderGit2
}

const metricConfigs: MetricConfig[] = [
  {
    id: 'projects',
    valueKey: 'about.metrics.projects.value',
    labelKey: 'about.metrics.projects.label',
    icon: FolderGit2,
  },
  {
    id: 'techStack',
    valueKey: 'about.metrics.techStack.value',
    labelKey: 'about.metrics.techStack.label',
    icon: Code2,
  },
  {
    id: 'courses',
    valueKey: 'about.metrics.courses.value',
    labelKey: 'about.metrics.courses.label',
    icon: GraduationCap,
  },
  { id: 'students', valueKey: 'about.metrics.students.value', labelKey: 'about.metrics.students.label', icon: Users },
]

export function AboutSection() {
  return (
    <Section id="about" title={t('about.title')} subtitle={t('about.subtitle')}>
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <Card className="flex items-center">
          <p className="text-base leading-relaxed text-text-secondary sm:text-lg">{t('about.intro')}</p>
        </Card>

        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {metricConfigs.map((metric) => {
            const Icon = metric.icon
            return (
              <Card key={metric.id} hover className="flex flex-col items-center justify-center text-center">
                <Icon size={28} className="mb-3 text-primary" aria-hidden="true" />
                <span className="mb-1 text-3xl font-semibold text-text-primary">{t(metric.valueKey)}</span>
                <span className="text-sm text-muted">{t(metric.labelKey)}</span>
              </Card>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
