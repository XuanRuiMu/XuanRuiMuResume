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

export function createClusteredStarLayer(
  count: number,
  clusterCount: number,
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

  const clusters: Array<{ x: number; y: number; z: number; radius: number }> = []
  for (let c = 0; c < clusterCount; c += 1) {
    const theta = pseudoRandom(c + count, 0) * Math.PI * 2
    const phi = Math.acos(2 * pseudoRandom(c + count, 1) - 1)
    const r = radiusRange[0] + pseudoRandom(c + count, 2) * (radiusRange[1] - radiusRange[0])
    clusters.push({
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
      radius: (radiusRange[1] - radiusRange[0]) * (0.08 + pseudoRandom(c + count, 3) * 0.12),
    })
  }

  for (let i = 0; i < count; i += 1) {
    const clusterIndex = Math.floor(pseudoRandom(i, 7) * clusterCount)
    const cluster = clusters[clusterIndex]

    const theta = pseudoRandom(i, 0) * Math.PI * 2
    const phi = Math.acos(2 * pseudoRandom(i, 1) - 1)
    const offsetR = cluster.radius * Math.cbrt(pseudoRandom(i, 2))

    positions[i * 3] = cluster.x + offsetR * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = cluster.y + offsetR * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = cluster.z + offsetR * Math.cos(phi)

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

export function createDustLayer(
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
    const diskBias = 0.3 + pseudoRandom(i, 1) * 0.7
    const phi = Math.acos(2 * diskBias - 1)
    const r = radiusRange[0] + pseudoRandom(i, 2) * (radiusRange[1] - radiusRange[0])

    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.25
    const z = r * Math.cos(phi)
    const currentR = Math.sqrt(x * x + y * y + z * z)
    const scale = currentR > 0 ? r / currentR : 1

    positions[i * 3] = x * scale
    positions[i * 3 + 1] = y * scale
    positions[i * 3 + 2] = z * scale

    const colorHex = baseColors[Math.floor(pseudoRandom(i, 3) * baseColors.length)]
    const c = new Color(colorHex)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b

    sizes[i] = sizeRange[0] + pseudoRandom(i, 4) * (sizeRange[1] - sizeRange[0])
    phases[i] = pseudoRandom(i, 5) * Math.PI * 2
    speeds[i] = 0.2 + pseudoRandom(i, 6) * 0.6
  }

  return { positions, colors, sizes, phases, speeds }
}
