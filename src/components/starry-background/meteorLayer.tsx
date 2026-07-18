import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial } from 'three'
import type { LineSegments } from 'three'
import { createMeteor } from './meteorUtils'
import type { Meteor, MeteorBounds, MeteorSpeedRange } from './meteorUtils'

interface MeteorLayerProps {
  count: number
  spawnRate: number
  color: string
  bounds: MeteorBounds
  speed: MeteorSpeedRange
}

export function MeteorLayer({ count, spawnRate, color, bounds, speed }: MeteorLayerProps) {
  const meteorsRef = useRef<Meteor[]>([])
  const { geometry, material } = useMemo(() => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(new Float32Array(count * 6), 3))
    geo.setAttribute('aAlpha', new BufferAttribute(new Float32Array(count * 2), 1))
    geo.setDrawRange(0, 0)

    const mat = new ShaderMaterial({
      uniforms: {
        uColor: { value: new Color(color) },
      },
      vertexShader: `
        attribute float aAlpha;
        varying float vAlpha;
        void main() {
          vAlpha = aAlpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(uColor, vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })

    return { geometry: geo, material: mat }
  }, [count, color])

  useEffect(() => {
    meteorsRef.current = Array.from({ length: count }, () => createMeteor(bounds, speed))
  }, [count, bounds, speed])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((_, delta) => {
    if (meteorsRef.current.length === 0) return

    let activeCount = 0
    const positionAttr = geometry.getAttribute('position') as BufferAttribute
    const alphaAttr = geometry.getAttribute('aAlpha') as BufferAttribute
    const positionArray = positionAttr.array as Float32Array
    const alphaArray = alphaAttr.array as Float32Array

    meteorsRef.current.forEach((meteor) => {
      if (!meteor.active) {
        if (Math.random() < delta * spawnRate) {
          meteor.active = true
          meteor.life = 0
          const fresh = createMeteor(bounds, speed)
          meteor.positions = fresh.positions
          meteor.velocity = fresh.velocity
          meteor.maxLife = fresh.maxLife
        }
        return
      }

      meteor.life += delta
      const progress = meteor.life / meteor.maxLife

      if (progress >= 1) {
        meteor.active = false
        return
      }

      const headX = meteor.positions[0] + meteor.velocity[0] * delta
      const headY = meteor.positions[1] + meteor.velocity[1] * delta
      const headZ = meteor.positions[2] + meteor.velocity[2] * delta

      meteor.positions[0] = headX
      meteor.positions[1] = headY
      meteor.positions[2] = headZ
      meteor.positions[3] = headX - meteor.velocity[0] * 0.04
      meteor.positions[4] = headY - meteor.velocity[1] * 0.04
      meteor.positions[5] = headZ - meteor.velocity[2] * 0.04

      const alpha = Math.sin(progress * Math.PI)
      const index = activeCount * 6
      positionArray[index] = meteor.positions[0]
      positionArray[index + 1] = meteor.positions[1]
      positionArray[index + 2] = meteor.positions[2]
      positionArray[index + 3] = meteor.positions[3]
      positionArray[index + 4] = meteor.positions[4]
      positionArray[index + 5] = meteor.positions[5]
      alphaArray[activeCount * 2] = alpha
      alphaArray[activeCount * 2 + 1] = alpha * 0.4

      activeCount += 1
    })

    positionAttr.needsUpdate = true
    alphaAttr.needsUpdate = true
    geometry.setDrawRange(0, activeCount * 2)
  })

  return <lineSegments ref={useRef<LineSegments>(null)} geometry={geometry} material={material} />
}
