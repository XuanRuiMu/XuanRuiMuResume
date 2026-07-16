import { Color } from 'three'
import type { GalaxyParams } from './galaxyConfig'

export interface GalaxyParticleData {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
  phases: Float32Array
  originalPositions: Float32Array
  armIndices: Float32Array
}

function pseudoRandom(index: number, seed: number, offset: number): number {
  const x = Math.sin((index + seed) * 12.9898 + offset * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export function generateSpiralGalaxy(count: number, params: GalaxyParams, seed: number): GalaxyParticleData {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count)
  const originalPositions = new Float32Array(count * 3)
  const armIndices = new Float32Array(count)

  const centerColor = new Color(params.palette.center)
  const armColor = new Color(params.palette.arm)
  const edgeColor = new Color(params.palette.edge)

  const radiusRange = params.outerRadius - params.innerRadius

  for (let i = 0; i < count; i += 1) {
    const armIndex = Math.floor(pseudoRandom(i, seed, 0) * params.arms)
    const armAngle = (armIndex / params.arms) * Math.PI * 2

    const rNorm = pseudoRandom(i, seed, 1)
    const r = params.innerRadius + rNorm * radiusRange

    const angleOffset = (pseudoRandom(i, seed, 2) - 0.5) * params.armWidth * 2
    const scatter = params.randomScatter * Math.sqrt(r)
    const scatterX = (pseudoRandom(i, seed, 3) - 0.5) * scatter
    const scatterZ = (pseudoRandom(i, seed, 4) - 0.5) * scatter

    const spiralAngle = armAngle + Math.log(r + 1) * params.tightness + angleOffset

    const x = r * Math.cos(spiralAngle) + scatterX
    const z = r * Math.sin(spiralAngle) + scatterZ
    const y = (pseudoRandom(i, seed, 5) - 0.5) * params.thickness * (r / params.outerRadius)

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    originalPositions[i * 3] = x
    originalPositions[i * 3 + 1] = y
    originalPositions[i * 3 + 2] = z

    const normalizedR = (r - params.innerRadius) / radiusRange
    const c = new Color().lerpColors(centerColor, armColor, Math.min(normalizedR * 2, 1))
    if (normalizedR > 0.4) {
      c.lerp(edgeColor, (normalizedR - 0.4) / 0.6)
    }
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b

    sizes[i] = (0.025 + pseudoRandom(i, seed, 6) * 0.065 * (1 - normalizedR * 0.4)) * (params.sizeMultiplier ?? 1)
    phases[i] = pseudoRandom(i, seed, 7) * Math.PI * 2
    armIndices[i] = armIndex
  }

  return { positions, colors, sizes, phases, originalPositions, armIndices }
}
