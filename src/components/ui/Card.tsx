import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
  glass?: boolean
  hover?: boolean
  className?: string
}

export function Card({ children, header, footer, glass = false, hover = false, className }: CardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-lg',
        glass && 'glass-panel',
        hover && 'transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl',
        className
      )}
    >
      {header && <div className="mb-4">{header}</div>}
      {children}
      {footer && <div className="mt-4 border-t border-border pt-4">{footer}</div>}
    </div>
  )
}
