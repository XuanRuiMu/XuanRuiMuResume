export interface GalaxyPalette {
  center: string
  arm: string
  edge: string
}

export interface GalaxyParams {
  particleCount: number
  arms: number
  tightness: number
  armWidth: number
  innerRadius: number
  outerRadius: number
  thickness: number
  randomScatter: number
  rotationSpeed: number
  palette: GalaxyPalette
}

export const galaxyPalettes = {
  dark: {
    center: '#3a9cff',
    arm: '#1a6cff',
    edge: '#05070a',
  },
  light: {
    center: '#dff0ff',
    arm: '#8ec8ff',
    edge: '#f8f9fb',
  },
}

export function getDefaultGalaxyParams(particleCount: number, isLight: boolean): GalaxyParams {
  return {
    particleCount,
    arms: 4,
    tightness: 5.5,
    armWidth: 0.55,
    innerRadius: 1.5,
    outerRadius: 22,
    thickness: 2.2,
    randomScatter: 0.35,
    rotationSpeed: 0.003,
    palette: isLight ? galaxyPalettes.light : galaxyPalettes.dark,
  }
}
