import { useMemo } from 'react'
import * as THREE from 'three'
import { EntityObject } from './EntityObject'
import { SECTIONS } from '../store/useTheaterStore'

const RADIUS = 5.6
const SECTION_ORDER = [SECTIONS.IT, SECTIONS.EDU, SECTIONS.DESIGN, SECTIONS.MUSIC, SECTIONS.MEDIA]

export function Entities() {
  const positions = useMemo(() => {
    return SECTION_ORDER.map((section, i) => {
      const angle = (i * 72 - 90) * (Math.PI / 180)
      return new THREE.Vector3(Math.cos(angle) * RADIUS, 0, Math.sin(angle) * RADIUS)
    })
  }, [])

  return (
    <group>
      {SECTION_ORDER.map((section, i) => (
        <EntityObject
          key={section}
          section={section}
          position={positions[i]}
          angle={(i * 72 - 90) * (Math.PI / 180)}
        />
      ))}
    </group>
  )
}
