import { useState } from 'react'
import { education } from '../../data/education'
import { Section } from '../../components/ui/Section'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { AdvancedTabs, AdvancedTabsList, AdvancedTabsTrigger, AdvancedTabsContent } from '../../components/ui/Tabs'
import { t } from '../../i18n/translations'

export function EducationSection() {
  const [activeTab, setActiveTab] = useState('summary')

  return (
    <Section id="education" title={t('education.title')} subtitle={t('education.subtitle')}>
      <AdvancedTabs value={activeTab} onValueChange={setActiveTab}>
        <AdvancedTabsList>
          <AdvancedTabsTrigger value="summary">{t('education.tabs.summary')}</AdvancedTabsTrigger>
          <AdvancedTabsTrigger value="courses">{t('education.tabs.courses')}</AdvancedTabsTrigger>
          <AdvancedTabsTrigger value="achievements">{t('education.tabs.achievements')}</AdvancedTabsTrigger>
        </AdvancedTabsList>
        <AdvancedTabsContent value="summary">
          <Card tilt className="scroll-reveal-item max-w-2xl">
            <div className="mb-2 text-2xl font-semibold text-text-primary">{education.summary.school}</div>
            <div className="mb-4 text-lg text-text-secondary">
              {education.summary.major} · {education.summary.degree}
            </div>
            <Badge color="mint">{education.summary.period}</Badge>
          </Card>
        </AdvancedTabsContent>
        <AdvancedTabsContent value="courses">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {education.courses.map((course) => (
              <Card key={course.id} hover tilt className="scroll-reveal-item">
                <div className="mb-1 font-medium text-text-primary">{t(course.nameKey)}</div>
                <div className="text-sm text-muted">{t(course.levelKey)}</div>
              </Card>
            ))}
          </div>
        </AdvancedTabsContent>
        <AdvancedTabsContent value="achievements">
          <div className="grid gap-4">
            {education.achievementKeys.map((key) => (
              <Card key={key} hover tilt className="scroll-reveal-item">
                <p className="text-text-secondary">{t(key)}</p>
              </Card>
            ))}
          </div>
        </AdvancedTabsContent>
      </AdvancedTabs>
    </Section>
  )
}
