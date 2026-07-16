import { cn } from '../../lib/utils'
import { t } from '../../i18n/translations'

interface SkillRadarProps {
  className?: string
}

export function SkillRadar({ className }: SkillRadarProps) {
  return (
    <div
      className={cn('flex aspect-square items-center justify-center rounded-2xl border border-border p-6', className)}
    >
      <p className="text-sm text-muted text-shadow-readable">{t('radar.placeholder')}</p>
    </div>
  )
}
