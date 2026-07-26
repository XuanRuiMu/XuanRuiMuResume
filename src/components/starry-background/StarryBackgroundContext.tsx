import { createContext, useContext } from 'react'
import type { A25StarrySceneApi } from './A25StarryScene'

export type StarryBackgroundControlsApi = A25StarrySceneApi

export const StarryBackgroundContext = createContext<StarryBackgroundControlsApi | null>(null)

export function useStarryBackground(): StarryBackgroundControlsApi | null {
  return useContext(StarryBackgroundContext)
}
