import { logger } from '../observability/logger'

interface ViewTransitionAPI {
  startViewTransition?: (updateCallback: () => void | Promise<void>) => {
    ready: Promise<void>
    finished: Promise<void>
    updateCallbackDone: Promise<void>
    skipTransition: () => void
  }
}

export function isViewTransitionSupported(): boolean {
  return typeof document !== 'undefined' && typeof document.startViewTransition === 'function'
}

export async function startViewTransition(updateCallback: () => void | Promise<void>): Promise<void> {
  const doc = document as unknown as ViewTransitionAPI

  if (!doc.startViewTransition) {
    await updateCallback()
    return
  }

  try {
    const transition = doc.startViewTransition(updateCallback)
    await transition.updateCallbackDone
    await transition.ready
  } catch (err) {
    logger.warn('View transition failed', { error: String(err) })
    await updateCallback()
  }
}
