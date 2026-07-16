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
  intensity: number
  sizeMultiplier: number
}

export const galaxyPalettes = {
  dark: {
    center: '#3a9cff',
    arm: '#1a6cff',
    edge: '#05070a',
  },
  light: {
    center: '#0077ff',
    arm: '#4da6ff',
    edge: '#b3d9ff',
  },
}

export function getDefaultGalaxyParams(particleCount: number, isLight: boolean): GalaxyParams {
  return {
    particleCount,
    arms: 5,
    tightness: 7.5,
    armWidth: 0.7,
    innerRadius: 1.0,
    outerRadius: 13,
    thickness: 2.5,
    randomScatter: 0.3,
    rotationSpeed: 0.005,
    palette: isLight ? galaxyPalettes.light : galaxyPalettes.dark,
    intensity: isLight ? 1.4 : 1.0,
    sizeMultiplier: isLight ? 1.6 : 1.0,
  }
}
