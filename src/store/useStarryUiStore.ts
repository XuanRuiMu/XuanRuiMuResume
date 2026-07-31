import { create } from 'zustand'

interface StarryUiState {
  inkEnabled: boolean
  setInkEnabled: (v: boolean) => void
}

export const useStarryUiStore = create<StarryUiState>((set) => ({
  inkEnabled: true,
  setInkEnabled: (v) => set({ inkEnabled: v }),
}))
