import {
  createContext,
  useContext,
  useCallback,
  Children,
  isValidElement,
  type ReactNode,
  type ReactElement,
  type KeyboardEvent,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs(): TabsContextValue {
  const context = useContext(TabsContext)
  if (context === null) {
    throw new Error('Tabs compound components must be used within <Tabs>')
  }
  return context
}

function isTabsTriggerElement(child: ReactNode): child is ReactElement<TabsTriggerProps> {
  return isValidElement(child) && child.type === AdvancedTabsTrigger
}

function isTabsContentElement(child: ReactNode): child is ReactElement<TabsContentProps> {
  return isValidElement(child) && child.type === AdvancedTabsContent
}

function getTabValues(children: ReactNode): string[] {
  const values: string[] = []
  Children.forEach(children, (child) => {
    if (isTabsTriggerElement(child)) {
      values.push(child.props.value)
    }
  })
  return values
}

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
}

export function AdvancedTabs({ value, onValueChange, children }: TabsProps) {
  const reducedMotion = useReducedMotion()
  let listElement: ReactElement | null = null
  const contentElements: ReactElement<TabsContentProps>[] = []

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    if (child.type === AdvancedTabsList) {
      listElement = child
    } else if (isTabsContentElement(child)) {
      contentElements.push(child)
    }
  })

  const activeContent = contentElements.find((child) => child.props.value === value) ?? null
  const activeValue = activeContent?.props.value
  const panelId = activeValue ? `advanced-tab-panel-${activeValue}` : undefined
  const triggerId = activeValue ? `advanced-tab-trigger-${activeValue}` : undefined

  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className="advanced-tabs">
        {listElement}
        <AnimatePresence mode="wait" initial={false}>
          {activeContent && (
            <motion.div
              key={value}
              initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
              transition={{
                duration: reducedMotion ? 0 : 0.25,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div role="tabpanel" id={panelId} aria-labelledby={triggerId} className="advanced-tabs-content mt-4">
                {activeContent.props.children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: ReactNode
  className?: string
}

export function AdvancedTabsList({ children, className }: TabsListProps) {
  const { value, onValueChange } = useTabs()
  const tabValues = getTabValues(children)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return

      event.preventDefault()
      const currentIndex = tabValues.indexOf(value)
      if (currentIndex === -1) return

      let nextIndex = currentIndex
      if (event.key === 'ArrowLeft') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabValues.length - 1
      } else if (event.key === 'ArrowRight') {
        nextIndex = currentIndex < tabValues.length - 1 ? currentIndex + 1 : 0
      } else if (event.key === 'Home') {
        nextIndex = 0
      } else if (event.key === 'End') {
        nextIndex = tabValues.length - 1
      }

      const nextValue = tabValues[nextIndex]
      onValueChange(nextValue)
      const nextTab = event.currentTarget.querySelector<HTMLButtonElement>(`[role="tab"][data-value="${nextValue}"]`)
      nextTab?.focus()
    },
    [tabValues, value, onValueChange]
  )

  return (
    <div
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn('advanced-tabs-list inline-flex gap-1 rounded-full border border-border p-1', className)}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
}

export function AdvancedTabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabs()
  const reducedMotion = useReducedMotion()
  const isSelected = selectedValue === value
  const triggerId = `advanced-tab-trigger-${value}`
  const panelId = `advanced-tab-panel-${value}`

  return (
    <button
      type="button"
      role="tab"
      id={triggerId}
      aria-selected={isSelected}
      aria-controls={panelId}
      tabIndex={isSelected ? 0 : -1}
      data-value={value}
      onClick={() => onValueChange(value)}
      className={cn(
        'advanced-tabs-trigger relative z-10 overflow-hidden rounded-full px-4 py-1.5 text-sm font-medium outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/60',
        isSelected ? 'scale-105 text-bg' : 'text-text-secondary hover:scale-105 hover:text-text-primary',
        className
      )}
    >
      {isSelected && (
        <motion.div
          layoutId="advanced-tab-active-indicator"
          className="advanced-tabs-indicator absolute inset-0 -z-10 rounded-full"
          transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 32 }}
          aria-hidden="true"
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

export function AdvancedTabsContent({ value, children, className }: TabsContentProps) {
  const { value: selectedValue } = useTabs()
  if (selectedValue !== value) return null

  const triggerId = `advanced-tab-trigger-${value}`

  return (
    <div
      role="tabpanel"
      id={`advanced-tab-panel-${value}`}
      aria-labelledby={triggerId}
      className={cn('advanced-tabs-content mt-4', className)}
    >
      {children}
    </div>
  )
}

export const Tabs = AdvancedTabs
export const TabsList = AdvancedTabsList
export const TabsTrigger = AdvancedTabsTrigger
export const TabsContent = AdvancedTabsContent
