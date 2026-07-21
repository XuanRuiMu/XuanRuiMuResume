import type { MeteorBounds, MeteorSpeedRange } from './meteorUtils'

export interface NebulaPalette {
  background: string
  nebulaCore: string
  nebulaMid: string
  nebulaEdge: string
  starWarm: string
  starCool: string
  coreColor: string
  coreGlow: string
  meteor: string
  nebulaA: string
  nebulaB: string
  nebulaC: string
}

export interface SpiralGalaxyConfig {
  armCount: number
  armTightness: number
  galaxyRadius: number
  coreRadius: number
  discThickness: number
  armWidth: number
  armJitter: number
  verticalJitter: number
  starSizeMin: number
  starSizeMax: number
  twinkleSpeed: number
  rotationSpeed: number
  sizeScale: number
}

export interface BackgroundStarConfig {
  starCount: number
  radiusMin: number
  radiusMax: number
  sizeMin: number
  sizeMax: number
  jitter: number
  rotationSpeed: number
  twinkleSpeed: number
}

export interface VolumetricNebulaConfig {
  intensity: number
  stepCount: number
  rotationSpeed: number
  sphereRadius: number
  fbmOctaves: number
  turbulenceScale: number
  turbulenceSpeed: number
}

export interface StarCoreConfig {
  intensity: number
  size: number
  pulseSpeed: number
  glowFalloff: number
}

export interface MeteorConfig {
  count: number
  spawnRate: number
  bounds: MeteorBounds
  speed: MeteorSpeedRange
}

export interface StarSystemParams {
  particleCount: number
  spiral: SpiralGalaxyConfig
  background: BackgroundStarConfig
  nebula: VolumetricNebulaConfig
  core: StarCoreConfig
  meteor: MeteorConfig
  palette: NebulaPalette
  parallaxStrength: number
  scrollParallaxStrength: number
}

export const nebulaPalettes: Record<'dark' | 'light', NebulaPalette> = {
  dark: {
    background: '#05060f',
    nebulaCore: '#ff9a3c',
    nebulaMid: '#c14cff',
    nebulaEdge: '#3a6bff',
    starWarm: '#fff5d6',
    starCool: '#aaccff',
    coreColor: '#fff7e6',
    coreGlow: '#ff7a2a',
    meteor: '#e6f7ff',
    nebulaA: '#2a1a5e',
    nebulaB: '#1a3a8a',
    nebulaC: '#5a2a8a',
  },
  light: {
    background: '#e8eef7',
    nebulaCore: '#ff9a3c',
    nebulaMid: '#c14cff',
    nebulaEdge: '#3a6bff',
    starWarm: '#3a2a6a',
    starCool: '#1a2a6a',
    coreColor: '#ffd97a',
    coreGlow: '#ff8a3a',
    meteor: '#5a7ac0',
    nebulaA: '#c8d8f0',
    nebulaB: '#dde7fa',
    nebulaC: '#b8c8e8',
  },
}

function resolveSpiralConfig(particleCount: number): SpiralGalaxyConfig {
  const scaledParticleCount = Math.max(2000, particleCount)
  return {
    armCount: 4,
    armTightness: 0.45,
    galaxyRadius: 22,
    coreRadius: 3.5,
    discThickness: 1.6,
    armWidth: 0.32,
    armJitter: 0.42,
    verticalJitter: 0.32,
    starSizeMin: 0.5,
    starSizeMax: 2.4,
    twinkleSpeed: 1.6,
    rotationSpeed: 0.012,
    sizeScale: scaledParticleCount > 12000 ? 320 : scaledParticleCount > 8000 ? 280 : 240,
  }
}

function resolveBackgroundConfig(particleCount: number): BackgroundStarConfig {
  const bgCount = Math.max(800, Math.round(particleCount * 0.18))
  return {
    starCount: bgCount,
    radiusMin: 32,
    radiusMax: 48,
    sizeMin: 0.4,
    sizeMax: 1.5,
    jitter: 0.06,
    rotationSpeed: 0.0035,
    twinkleSpeed: 1.4,
  }
}

function resolveNebulaConfig(
  particleCount: number,
  isLight: boolean,
  volumetric: boolean,
  galaxyRadius: number
): VolumetricNebulaConfig {
  const stepCount = volumetric ? (particleCount >= 12000 ? 48 : 32) : 20
  return {
    intensity: isLight ? 0.65 : 1.25,
    stepCount,
    rotationSpeed: 0.008,
    sphereRadius: galaxyRadius,
    fbmOctaves: volumetric ? 5 : 3,
    turbulenceScale: 0.45,
    turbulenceSpeed: 0.04,
  }
}

function resolveCoreConfig(isLight: boolean): StarCoreConfig {
  return {
    intensity: isLight ? 0.55 : 1.05,
    size: 9,
    pulseSpeed: 0.55,
    glowFalloff: 2.6,
  }
}

function resolveMeteorConfig(particleCount: number, isLight: boolean): MeteorConfig {
  const enabled = particleCount >= 8000 && !isLight
  return {
    count: enabled ? 5 : 0,
    spawnRate: 0.08,
    bounds: { x: 30, y: 18, z: 10 },
    speed: { min: 8, max: 16 },
  }
}

export function getDefaultNebulaParams(particleCount: number, isLight: boolean, volumetric = true): StarSystemParams {
  const palette = isLight ? nebulaPalettes.light : nebulaPalettes.dark
  const spiral = resolveSpiralConfig(particleCount)
  return {
    particleCount,
    spiral,
    background: resolveBackgroundConfig(particleCount),
    nebula: resolveNebulaConfig(particleCount, isLight, volumetric, spiral.galaxyRadius),
    core: resolveCoreConfig(isLight),
    meteor: resolveMeteorConfig(particleCount, isLight),
    palette,
    parallaxStrength: 0.6,
    scrollParallaxStrength: 0.4,
  }
}
