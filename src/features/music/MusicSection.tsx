import { useState } from 'react'
import { Music2, Radio } from 'lucide-react'
import { music } from '../../data/music'
import { Section } from '../../components/ui/Section'
import { Card } from '../../components/ui/Card'
import { Tag } from '../../components/ui/Tag'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs'
import { t } from '../../i18n/translations'

export function MusicSection() {
  const [activeTab, setActiveTab] = useState('works')

  return (
    <Section id="music" title={t('music.title')} subtitle={t('music.subtitle')}>
      <div className="mb-8 max-w-2xl">
        <h3 className="mb-3 text-2xl font-semibold text-text-primary">{t(music.headlineKey)}</h3>
        <p className="leading-relaxed text-text-secondary">{t(music.introKey)}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="works">{t('music.tabs.works')}</TabsTrigger>
          <TabsTrigger value="tools">{t('music.tabs.tools')}</TabsTrigger>
          <TabsTrigger value="skills">{t('music.tabs.skills')}</TabsTrigger>
        </TabsList>

        <TabsContent value="works">
          <div className="grid gap-6 sm:grid-cols-2">
            {music.tracks.map((track) => (
              <Card key={track.id} hover tilt className="scroll-reveal-item">
                <div className="mb-3 flex items-center gap-2 text-primary">
                  <Music2 size={18} aria-hidden="true" />
                  <span className="text-xs font-medium uppercase tracking-wider">{t(track.typeKey)}</span>
                </div>
                <h4 className="mb-2 text-lg font-semibold text-text-primary">{t(track.nameKey)}</h4>
                <p className="text-sm leading-relaxed text-text-secondary">{t(track.descKey)}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tools">
          <div className="flex flex-wrap gap-2">
            {music.toolKeys.map((key) => (
              <Tag key={key}>{t(key)}</Tag>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="skills">
          <div className="flex flex-wrap gap-2">
            {music.skillKeys.map((key) => (
              <Tag key={key}>{t(key)}</Tag>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-10" aria-hidden="true">
        <div className="mb-3 flex items-center gap-2 text-muted">
          <Radio size={16} aria-hidden="true" />
          <span className="text-xs font-medium uppercase tracking-wider">{t('music.visualizerTitle')}</span>
        </div>
        <div className="flex h-24 items-end gap-1 overflow-hidden rounded-xl border border-border bg-surface p-3">
          {music.launchpadNotes.map((note, index) => (
            <div
              key={note.note}
              className="flex-1 rounded-sm transition-all duration-700"
              style={{
                backgroundColor: note.color,
                height: `${30 + ((index * 17 + 40) % 60)}%`,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      </div>
    </Section>
  )
}
