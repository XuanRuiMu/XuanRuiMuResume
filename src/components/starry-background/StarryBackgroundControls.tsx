import { useState } from 'react'
import { Settings2, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { t } from '../../i18n/translations'
import { useStarryBackground } from './StarryBackgroundContext'

export function StarryBackgroundControls() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'starry' | 'notes'>('starry')
  const api = useStarryBackground()
  const [speed, setSpeed] = useState(0.1)
  const [breath, setBreath] = useState(true)

  const handleSpeedChange = (value: number) => {
    setSpeed(value)
    api?.setRotationSpeed(value)
  }

  const handleBreathChange = (value: boolean) => {
    setBreath(value)
    api?.setBreathEnabled(value)
  }

  return (
    <div className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-bg/80 text-text-primary backdrop-blur transition-colors hover:bg-bg hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          open && 'bg-bg text-primary'
        )}
        aria-label={t('controls.toggle')}
        aria-expanded={open}
      >
        {open ? <X size={16} /> : <Settings2 size={16} />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border/60 bg-bg/90 p-3 shadow-xl backdrop-blur">
          <div className="mb-3 flex rounded-lg border border-border/50 p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('starry')}
              className={cn(
                'flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                activeTab === 'starry' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              {t('controls.tabs.starry')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={cn(
                'flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                activeTab === 'notes' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              {t('controls.tabs.notes')}
            </button>
          </div>

          {activeTab === 'starry' && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('controls.starry.speed')}</span>
                  <span className="font-mono text-primary">{speed.toFixed(2)}×</span>
                </label>
                <input
                  type="range"
                  min={-1}
                  max={1.5}
                  step={0.01}
                  value={speed}
                  onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <label className="flex cursor-pointer items-center justify-between text-xs text-muted-foreground">
                <span>{t('controls.starry.breath')}</span>
                <input
                  type="checkbox"
                  checked={breath}
                  onChange={(e) => handleBreathChange(e.target.checked)}
                  className="accent-primary"
                />
              </label>

              <p className="text-[11px] leading-relaxed text-muted-foreground">{t('controls.starry.hint')}</p>
            </div>
          )}

          {activeTab === 'notes' && (
            <p className="text-xs leading-relaxed text-muted-foreground">{t('controls.notes.placeholder')}</p>
          )}
        </div>
      )}
    </div>
  )
}
