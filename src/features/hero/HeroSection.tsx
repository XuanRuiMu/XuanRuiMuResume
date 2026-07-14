import { useState, useCallback, type CSSProperties } from 'react'
import { Mail, FolderGit2, Download, MessageSquare, Terminal } from 'lucide-react'
import { personalInfo } from '../../data/personalInfo'
import { skillMetrics } from '../../data/skillMetrics'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useAppStore } from '../../store/useAppStore'
import { t } from '../../i18n/translations'
import { downloadResume } from '../../lib/resume'

export function HeroSection() {
  const [copied, setCopied] = useState(false)
  const setChatOpen = useAppStore((state) => state.setChatOpen)
  const transitionToSection = useAppStore((state) => state.transitionToSection)

  const handleCopyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(personalInfo.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 剪贴板写入失败时静默降级，不影响用户体验
    }
  }, [])

  const handleDownloadResume = useCallback(() => {
    downloadResume()
  }, [])

  return (
    <section
      id="hero"
      className="relative flex min-h-[calc(100vh-3.5rem)] items-center overflow-hidden px-4 sm:px-6 lg:px-8"
      aria-label={t('nav.hero')}
    >
      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-12 py-16 md:grid-cols-2 md:py-24">
        <div className="flex flex-col justify-center">
          <h1 className="mb-4 font-display text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
            {personalInfo.name}
          </h1>
          <p className="mb-4 text-lg font-medium text-primary sm:text-xl">{t(personalInfo.targetKey)}</p>
          <p className="mb-8 max-w-lg text-base leading-relaxed text-text-secondary sm:text-lg">
            {t('hero.valueProposition')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCopyEmail} icon={<Mail size={18} />}>
              {copied ? t('hero.copied') : t('hero.cta.copyEmail')}
            </Button>
            <Button variant="secondary" onClick={() => transitionToSection('projects')} icon={<FolderGit2 size={18} />}>
              {t('hero.cta.viewProjects')}
            </Button>
            <Button variant="ghost" onClick={handleDownloadResume} icon={<Download size={18} />}>
              {t('hero.cta.downloadResume')}
            </Button>
            <Button variant="ghost" onClick={() => setChatOpen(true)} icon={<MessageSquare size={18} />}>
              {t('hero.cta.openAIChat')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <Card hover tilt glass className="font-mono text-sm">
            <div className="mb-4 flex items-center gap-2 text-muted">
              <Terminal size={16} />
              <span>{t('hero.metricsTitle')}</span>
            </div>
            <div className="grid gap-3">
              {skillMetrics.slice(0, 5).map((metric) => (
                <div key={metric.dimensionKey} className="flex items-center gap-3">
                  <span className="flex-1 text-text-secondary">{t(metric.dimensionKey)}</span>
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-elevated sm:w-32">
                    <div
                      className="scroll-progress-bar h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      style={{ '--progress-target': `${metric.score}%` } as CSSProperties}
                    />
                  </div>
                  <span className="w-8 text-right text-text-primary">{metric.score}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
