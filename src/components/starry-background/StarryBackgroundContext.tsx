import { createContext, useContext } from 'react'
import type { A25StarrySceneApi } from './A25StarryScene'

export type StarryBackgroundControlsApi = Partial<A25StarrySceneApi> & {
  inkRevealEnabled: boolean
  setInkRevealEnabled: (enabled: boolean) => void
}

export const StarryBackgroundContext = createContext<StarryBackgroundControlsApi | null>(null)

export function useStarryBackground(): StarryBackgroundControlsApi | null {
  return useContext(StarryBackgroundContext)
}
