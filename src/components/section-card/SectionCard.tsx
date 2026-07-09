import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface SectionCardProps {
  id?: string
  children: ReactNode
  className?: string
}

export function SectionCard({ id, children, className }: SectionCardProps) {
  return (
    <section
      id={id}
      className={cn(
        'section-card-container rounded-2xl border border-border bg-surface p-6 shadow-lg transition-colors',
        className
      )}
    >
      {children}
    </section>
  )
}
