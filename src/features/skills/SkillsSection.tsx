import { Section } from '../../components/ui/Section'
import { Card } from '../../components/ui/Card'
import { Tag } from '../../components/ui/Tag'
import { SkillRadarChart } from '../../components/skill-radar/SkillRadarChart'
import { t, ta } from '../../i18n/translations'
import type { TranslationKey } from '../../i18n/translations'

interface 分类配置 {
  id: string
  标签键: TranslationKey
  描述键: TranslationKey
  标签集键: TranslationKey
}

const 分类配置集: 分类配置[] = [
  {
    id: 'it',
    标签键: 'skills.categories.it.label',
    描述键: 'skills.categories.it.description',
    标签集键: 'skills.categories.it.tags',
  },
  {
    id: 'creative',
    标签键: 'skills.categories.creative.label',
    描述键: 'skills.categories.creative.description',
    标签集键: 'skills.categories.creative.tags',
  },
  {
    id: 'soft',
    标签键: 'skills.categories.soft.label',
    描述键: 'skills.categories.soft.description',
    标签集键: 'skills.categories.soft.tags',
  },
]

export function SkillsSection() {
  return (
    <Section id="skills" title={t('skills.title')} subtitle={t('skills.subtitle')}>
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <Card tilt className="scroll-reveal-item">
          <div className="h-[300px]">
            <SkillRadarChart />
          </div>
        </Card>
        <div className="flex flex-col gap-4">
          {分类配置集.map((分类) => {
            const 标签集 = ta(分类.标签集键)
            return (
              <Card key={分类.id} hover tilt className="scroll-reveal-item">
                <h3 className="mb-2 text-lg font-medium text-text-primary">{t(分类.标签键)}</h3>
                <p className="mb-3 text-sm text-text-secondary">{t(分类.描述键)}</p>
                <div className="flex flex-wrap gap-2">
                  {标签集.map((标签内容) => (
                    <Tag key={标签内容}>{标签内容}</Tag>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
