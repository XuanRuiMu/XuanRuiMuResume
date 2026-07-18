export interface MeteorBounds {
  x: number
  y: number
  z: number
}

export interface MeteorSpeedRange {
  min: number
  max: number
}

export interface Meteor {
  positions: Float32Array
  velocity: [number, number, number]
  life: number
  maxLife: number
  active: boolean
}

export function createMeteor(bounds: MeteorBounds, speedRange: MeteorSpeedRange): Meteor {
  const startY = bounds.y * 0.25 + Math.random() * bounds.y * 0.4
  const startX = -bounds.x * 0.55 - Math.random() * bounds.x * 0.35
  const startZ = -bounds.z * 0.15 - Math.random() * bounds.z * 0.35
  const speed = speedRange.min + Math.random() * (speedRange.max - speedRange.min)
  const angle = -Math.PI / 6 + (Math.random() - 0.5) * 0.3

  return {
    positions: new Float32Array([startX, startY, startZ, startX - 0.3, startY + 0.15, startZ]),
    velocity: [speed * Math.cos(angle), -speed * Math.sin(angle), 0],
    life: 0,
    maxLife: 1.2 + Math.random() * 0.8,
    active: false,
  }
}
