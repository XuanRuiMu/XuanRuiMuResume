import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: ReactNode
  color?: 'cyan' | 'orange' | 'purple' | 'pink' | 'mint' | 'gray'
  className?: string
}

export function Badge({ children, color = 'gray', className }: BadgeProps) {
  const colorClasses = {
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    orange: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    pink: 'bg-pink-500/15 text-pink-400 border-pink-500/25',
    mint: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    gray: 'bg-white/10 text-text-secondary border-white/15',
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
