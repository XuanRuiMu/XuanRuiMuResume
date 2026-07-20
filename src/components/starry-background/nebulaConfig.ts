import type { MeteorBounds, MeteorSpeedRange } from './meteorUtils'

export interface NebulaPalette {
  background: string
  nebulaA: string
  nebulaB: string
  nebulaC: string
  starWarm: string
  starCool: string
  meteor: string
}

export interface NebulaParams {
  particleCount: number
  starRadiusMin: number
  starRadiusMax: number
  starSizeMin: number
  starSizeMax: number
  starJitter: number
  nebulaRadius: number
  nebulaIntensity: number
  twinkleSpeed: number
  rotationSpeed: number
  meteorCount: number
  meteorSpawnRate: number
  meteorBounds: MeteorBounds
  meteorSpeed: MeteorSpeedRange
  palette: NebulaPalette
  parallaxStrength: number
  scrollParallaxStrength: number
}

export const nebulaPalettes: Record<'dark' | 'light', NebulaPalette> = {
  dark: {
    background: '#05060f',
    nebulaA: '#2a1a5e',
    nebulaB: '#1a3a8a',
    nebulaC: '#5a2a8a',
    starWarm: '#fff5e6',
    starCool: '#aaccff',
    meteor: '#e6f7ff',
  },
  light: {
    background: '#e8eef7',
    nebulaA: '#c8d8f0',
    nebulaB: '#dde7fa',
    nebulaC: '#b8c8e8',
    starWarm: '#3a4a8a',
    starCool: '#1a2a6a',
    meteor: '#5a7ac0',
  },
}

export function getDefaultNebulaParams(particleCount: number, isLight: boolean): NebulaParams {
  return {
    particleCount,
    starRadiusMin: 18,
    starRadiusMax: 28,
    starSizeMin: 0.6,
    starSizeMax: 2.0,
    starJitter: 0.06,
    nebulaRadius: 60,
    nebulaIntensity: isLight ? 0.75 : 1.3,
    twinkleSpeed: 1.4,
    rotationSpeed: 0.0035,
    meteorCount: 5,
    meteorSpawnRate: 0.08,
    meteorBounds: { x: 30, y: 18, z: 10 },
    meteorSpeed: { min: 8, max: 16 },
    palette: isLight ? nebulaPalettes.light : nebulaPalettes.dark,
    parallaxStrength: 0.6,
    scrollParallaxStrength: 0.4,
  }
}
