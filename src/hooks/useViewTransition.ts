import { useCallback } from 'react'
import { startViewTransition, isViewTransitionSupported } from '../utils/viewTransition'
import { logger } from '../observability/logger'

export function useViewTransition() {
  const withTransition = useCallback(
    async (updateCallback: () => void | Promise<void>, options?: { name?: string }) => {
      if (options?.name) {
        logger.debug('Starting view transition', { name: options.name })
      }
      await startViewTransition(updateCallback)
    },
    []
  )

  return {
    withTransition,
    supported: isViewTransitionSupported(),
  }
}
