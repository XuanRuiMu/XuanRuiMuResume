import { cn } from '../../lib/utils'
import { t } from '../../i18n/translations'

interface SkillRadarProps {
  className?: string
}

export function SkillRadar({ className }: SkillRadarProps) {
  return (
    <div
      className={cn(
        'flex aspect-square items-center justify-center rounded-2xl border border-border bg-surface p-6',
        className
      )}
    >
      <p className="text-sm text-muted">{t('radar.placeholder')}</p>
    </div>
  )
}
