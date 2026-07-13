import { Color } from 'three'

export interface StarLayerData {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
  phases: Float32Array
  speeds: Float32Array
}

export function createStarLayer(
  count: number,
  radiusRange: [number, number],
  sizeRange: [number, number],
  baseColors: string[],
  seed: number
): StarLayerData {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count)
  const speeds = new Float32Array(count)

  function pseudoRandom(index: number, offset: number): number {
    const x = Math.sin((index + seed) * 12.9898 + offset * 78.233) * 43758.5453
    return x - Math.floor(x)
  }

  for (let i = 0; i < count; i += 1) {
    const theta = pseudoRandom(i, 0) * Math.PI * 2
    const phi = Math.acos(2 * pseudoRandom(i, 1) - 1)
    const r = radiusRange[0] + pseudoRandom(i, 2) * (radiusRange[1] - radiusRange[0])

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)

    const colorHex = baseColors[Math.floor(pseudoRandom(i, 3) * baseColors.length)]
    const c = new Color(colorHex)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b

    sizes[i] = sizeRange[0] + pseudoRandom(i, 4) * (sizeRange[1] - sizeRange[0])
    phases[i] = pseudoRandom(i, 5) * Math.PI * 2
    speeds[i] = 0.5 + pseudoRandom(i, 6) * 1.5
  }

  return { positions, colors, sizes, phases, speeds }
}
