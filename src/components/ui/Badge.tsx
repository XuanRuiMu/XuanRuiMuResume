import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: ReactNode
  color?: 'cyan' | 'orange' | 'purple' | 'pink' | 'mint' | 'gray'
  className?: string
}

export function Badge({ children, color = 'gray', className }: BadgeProps) {
  const colorClasses = {
    cyan: 'bg-primary/15 text-primary border-primary/25',
    orange: 'bg-orange-500/15 text-[var(--badge-orange-text)] border-orange-500/25',
    purple: 'bg-secondary/15 text-secondary border-secondary/25',
    pink: 'bg-accent/15 text-accent border-accent/25',
    mint: 'bg-emerald-500/15 text-[var(--badge-mint-text)] border-emerald-500/25',
    gray: 'bg-surface-elevated text-text-secondary border-border',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        colorClasses[color],
        className
      )}
    >
      {children}
    </span>
  )
}
