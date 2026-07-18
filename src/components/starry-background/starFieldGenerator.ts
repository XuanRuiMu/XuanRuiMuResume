import { Color } from 'three'
import type { NebulaParams } from './nebulaConfig'

export interface StarFieldData {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
  phases: Float32Array
  speeds: Float32Array
}

function pseudoRandom(index: number, seed: number, offset: number): number {
  const x = Math.sin((index + seed) * 12.9898 + offset * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

export function generateStarField(count: number, params: NebulaParams, seed: number): StarFieldData {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count)
  const speeds = new Float32Array(count)

  const warmColor = new Color(params.palette.starWarm)
  const coolColor = new Color(params.palette.starCool)
  const radiusRange = params.starRadiusMax - params.starRadiusMin
  const sizeRange = params.starSizeMax - params.starSizeMin

  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count
    const inclination = Math.acos(1 - 2 * t)
    const azimuth = GOLDEN_ANGLE * i

    const jitter = params.starJitter
    const inclinationJitter = inclination + (pseudoRandom(i, seed, 0) - 0.5) * jitter
    const azimuthJitter = azimuth + (pseudoRandom(i, seed, 1) - 0.5) * jitter * 2

    const r = params.starRadiusMin + pseudoRandom(i, seed, 2) * radiusRange
    const sinInc = Math.sin(inclinationJitter)

    positions[i * 3] = r * sinInc * Math.cos(azimuthJitter)
    positions[i * 3 + 1] = r * Math.cos(inclinationJitter)
    positions[i * 3 + 2] = r * sinInc * Math.sin(azimuthJitter)

    const colorMix = pseudoRandom(i, seed, 3)
    const c = new Color().lerpColors(warmColor, coolColor, colorMix)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b

    const sizeBias = Math.pow(pseudoRandom(i, seed, 4), 2.5)
    sizes[i] = params.starSizeMin + sizeBias * sizeRange

    phases[i] = pseudoRandom(i, seed, 5) * Math.PI * 2
    speeds[i] = 0.5 + pseudoRandom(i, seed, 6) * 1.5
  }

  return { positions, colors, sizes, phases, speeds }
}
