import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TagProps {
  children: ReactNode
  className?: string
}

export function Tag({ children, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-border bg-surface-elevated px-2 py-0.5 text-[10px] font-medium tracking-wide text-text-secondary',
        className
      )}
    >
      {children}
    </span>
  )
}
