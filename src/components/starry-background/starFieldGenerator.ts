import { Color } from 'three'
import type { BackgroundStarConfig, SpiralGalaxyConfig, StarSystemParams } from './nebulaConfig'

export interface StarFieldData {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
  phases: Float32Array
  speeds: Float32Array
  radii: Float32Array
  armIndices: Float32Array
}

const TWO_PI = Math.PI * 2

function createDeterministicRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gaussianRandom(rng: () => number): number {
  const u = Math.max(1e-6, rng())
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TWO_PI * v)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function sampleRadius(rng: () => number, config: SpiralGalaxyConfig): number {
  const t = rng()
  const r = Math.pow(t, 1.5) * config.galaxyRadius
  return Math.max(0.05, r)
}

function sampleArmIndex(rng: () => number, config: SpiralGalaxyConfig): number {
  return Math.floor(rng() * config.armCount) % config.armCount
}

function computeArmAngle(armIndex: number, radius: number, config: SpiralGalaxyConfig): number {
  const safeRadius = Math.max(0.05, radius)
  return (armIndex * TWO_PI) / config.armCount + config.armTightness * Math.log(safeRadius)
}

function computeColorByRadius(
  radius: number,
  config: SpiralGalaxyConfig,
  warmColor: Color,
  midColor: Color,
  coolColor: Color,
  rng: () => number
): Color {
  const normalized = clamp(radius / config.galaxyRadius, 0, 1)
  const color = new Color()
  if (normalized < 0.32) {
    const t = clamp(normalized / 0.32, 0, 1)
    color.lerpColors(warmColor, midColor, t)
  } else {
    const t = clamp((normalized - 0.32) / 0.68, 0, 1)
    color.lerpColors(midColor, coolColor, t)
  }
  const jitter = 0.12
  color.r = clamp(color.r + (rng() - 0.5) * jitter, 0, 1)
  color.g = clamp(color.g + (rng() - 0.5) * jitter, 0, 1)
  color.b = clamp(color.b + (rng() - 0.5) * jitter, 0, 1)
  return color
}

function computeSizeByRadius(radius: number, config: SpiralGalaxyConfig, rng: () => number): number {
  const normalized = clamp(radius / config.galaxyRadius, 0, 1)
  const coreBoost = Math.exp(-normalized * 3.2)
  const bias = Math.pow(rng(), 2.2)
  const size = config.starSizeMin + bias * (config.starSizeMax - config.starSizeMin)
  return Math.max(0.05, size * (0.6 + 0.8 * coreBoost))
}

export function generateSpiralGalaxy(count: number, params: StarSystemParams, seed: number): StarFieldData {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count)
  const speeds = new Float32Array(count)
  const radii = new Float32Array(count)
  const armIndices = new Float32Array(count)

  const config = params.spiral
  const palette = params.palette
  const warmColor = new Color(palette.starWarm)
  const midColor = new Color(palette.nebulaMid)
  const coolColor = new Color(palette.starCool)
  const rng = createDeterministicRandom(seed)

  for (let i = 0; i < count; i += 1) {
    const radius = sampleRadius(rng, config)
    const armIndex = sampleArmIndex(rng, config)
    const armAngle = computeArmAngle(armIndex, radius, config)

    const angleJitter = gaussianRandom(rng) * config.armJitter
    const radiusJitter = gaussianRandom(rng) * config.armWidth * radius * 0.18
    const finalRadius = clamp(radius + radiusJitter, 0.05, config.galaxyRadius * 1.05)
    const theta = armAngle + angleJitter

    const verticalScale = config.discThickness * (0.4 + 0.6 * Math.exp(-finalRadius / config.galaxyRadius))
    const verticalOffset = gaussianRandom(rng) * config.verticalJitter * verticalScale

    positions[i * 3] = finalRadius * Math.cos(theta)
    positions[i * 3 + 1] = verticalOffset
    positions[i * 3 + 2] = finalRadius * Math.sin(theta)

    const color = computeColorByRadius(finalRadius, config, warmColor, midColor, coolColor, rng)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b

    sizes[i] = computeSizeByRadius(finalRadius, config, rng)
    phases[i] = rng() * TWO_PI
    speeds[i] = 0.4 + rng() * 1.6
    radii[i] = finalRadius
    armIndices[i] = armIndex
  }

  return { positions, colors, sizes, phases, speeds, radii, armIndices }
}

export interface BackgroundStarData {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
  phases: Float32Array
  speeds: Float32Array
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

export function generateBackgroundStars(params: StarSystemParams, seed: number): BackgroundStarData {
  const config = params.background
  const count = config.starCount
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count)
  const speeds = new Float32Array(count)

  const warmColor = new Color(params.palette.starWarm)
  const coolColor = new Color(params.palette.starCool)
  const radiusRange = config.radiusMax - config.radiusMin
  const sizeRange = config.sizeMax - config.sizeMin
  const rng = createDeterministicRandom(seed ^ 0x9e3779b9)

  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count
    const inclination = Math.acos(1 - 2 * t)
    const azimuth = GOLDEN_ANGLE * i

    const inclinationJitter = inclination + (rng() - 0.5) * config.jitter
    const azimuthJitter = azimuth + (rng() - 0.5) * config.jitter * 2

    const r = config.radiusMin + rng() * radiusRange
    const sinInc = Math.sin(inclinationJitter)

    positions[i * 3] = r * sinInc * Math.cos(azimuthJitter)
    positions[i * 3 + 1] = r * Math.cos(inclinationJitter)
    positions[i * 3 + 2] = r * sinInc * Math.sin(azimuthJitter)

    const colorMix = rng()
    const c = new Color().lerpColors(warmColor, coolColor, colorMix)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b

    const sizeBias = Math.pow(rng(), 2.5)
    sizes[i] = config.sizeMin + sizeBias * sizeRange
    phases[i] = rng() * TWO_PI
    speeds[i] = 0.5 + rng() * 1.5
  }

  return { positions, colors, sizes, phases, speeds }
}

export function generateStarField(count: number, params: StarSystemParams, seed: number): StarFieldData {
  return generateSpiralGalaxy(count, params, seed)
}

export type { BackgroundStarConfig, SpiralGalaxyConfig }
