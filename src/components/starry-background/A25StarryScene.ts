import * as THREE from 'three'

export interface A25StarrySceneOptions {
  particleCount?: number
  dpr?: number
  rotationSpeed?: number
}

export interface A25StarrySceneApi {
  setRotationSpeed: (speed: number) => void
  setParticleCount: (count: number) => void
  setZoom: (zoom: number) => void
  getFps: () => number
  destroy: () => void
}

const DEFAULT_DPR = 1.5
const DEFAULT_ROTATION_SPEED = 0.1

function makeStarTexture(glowFraction = 0.08): THREE.CanvasTexture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 2D context')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(glowFraction, 'rgba(255,255,255,0.9)')
  gradient.addColorStop(0.4, 'rgba(180,200,255,0.2)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function createA25StarryScene(container: HTMLElement, options: A25StarrySceneOptions = {}): A25StarrySceneApi {
  const dpr = Math.min(options.dpr ?? DEFAULT_DPR, 2)
  let rotationSpeed = options.rotationSpeed ?? DEFAULT_ROTATION_SPEED

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05060f)

  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 600)
  camera.position.set(0, 0, 8)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(dpr)
  renderer.setClearColor(0x05060f, 1)
  renderer.setAnimationLoop(tick)
  container.appendChild(renderer.domElement)

  const starTex = makeStarTexture(0.08)
  const starTexSoft = makeStarTexture(0.3)

  const rootGroup = new THREE.Group()
  scene.add(rootGroup)

  function buildBackgroundLayer(
    count: number,
    minR: number,
    maxR: number,
    size: number,
    opacity: number,
    colorHex = 0x8899cc
  ): THREE.Points {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const r = minR + Math.random() * (maxR - minR)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i3 + 2] = r * Math.cos(phi)
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const mat = new THREE.PointsMaterial({
      size,
      sizeAttenuation: true,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: starTex,
      alphaTest: 0.001,
    })
    mat.color.setHex(colorHex)
    return new THREE.Points(geo, mat)
  }

  const bgLayer1 = buildBackgroundLayer(8000, 45, 180, 0.35, 0.6, 0x8899cc)
  rootGroup.add(bgLayer1)
  const bgLayer2 = buildBackgroundLayer(4000, 20, 50, 0.2, 0.3, 0x667799)
  rootGroup.add(bgLayer2)

  function buildNebula(count: number, minR: number, maxR: number, hue: number, size: number): THREE.Points {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const r = minR + Math.random() * (maxR - minR)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.4
      pos[i3 + 2] = r * Math.cos(phi)
      const c = new THREE.Color().setHSL(hue + (Math.random() - 0.5) * 0.06, 0.6, 0.15 + Math.random() * 0.12)
      col[i3] = c.r
      col[i3 + 1] = c.g
      col[i3 + 2] = c.b
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const mat = new THREE.PointsMaterial({
      size,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: starTexSoft,
      alphaTest: 0.001,
    })
    return new THREE.Points(geo, mat)
  }

  rootGroup.add(buildNebula(3000, 4, 8, 0.78, 0.5))
  rootGroup.add(buildNebula(2500, 5, 10, 0.82, 0.45))
  rootGroup.add(buildNebula(2000, -6, -3, 0.73, 0.4))
  rootGroup.add(buildNebula(1800, 3, 6, 0.85, 0.35))

  const milkyCount = 5000
  const milkyGeo = new THREE.BufferGeometry()
  const milkyPos = new Float32Array(milkyCount * 3)
  const milkyCol = new Float32Array(milkyCount * 3)
  for (let i = 0; i < milkyCount; i++) {
    const i3 = i * 3
    const r = 4 + Math.random() * 12
    const angle = Math.random() * Math.PI * 2
    const spread = (1 - Math.pow(Math.random(), 3)) * 1.2
    milkyPos[i3] = r * Math.cos(angle)
    milkyPos[i3 + 1] = (Math.random() - 0.5) * spread + r * 0.08 * Math.sin(angle * 3)
    milkyPos[i3 + 2] = r * Math.sin(angle) * 0.6 + (Math.random() - 0.5) * spread * 0.5
    const bright = 0.5 + Math.random() * 0.5
    const warmth = 0.8 + Math.random() * 0.2
    milkyCol[i3] = warmth * bright
    milkyCol[i3 + 1] = (0.7 + Math.random() * 0.3) * bright
    milkyCol[i3 + 2] = (0.5 + Math.random() * 0.5) * bright
  }
  milkyGeo.setAttribute('position', new THREE.BufferAttribute(milkyPos, 3))
  milkyGeo.setAttribute('color', new THREE.BufferAttribute(milkyCol, 3))
  const milkyMat = new THREE.PointsMaterial({
    size: 0.12,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    map: starTex,
    alphaTest: 0.001,
  })
  rootGroup.add(new THREE.Points(milkyGeo, milkyMat))

  const fgCount = 3000
  const fgGeo = new THREE.BufferGeometry()
  const fgPos = new Float32Array(fgCount * 3)
  const fgSizes = new Float32Array(fgCount)
  const fgCol = new Float32Array(fgCount * 3)
  for (let i = 0; i < fgCount; i++) {
    const i3 = i * 3
    const r = 2 + Math.random() * 10
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    fgPos[i3] = r * Math.sin(phi) * Math.cos(theta)
    fgPos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    fgPos[i3 + 2] = r * Math.cos(phi)
    fgSizes[i] = 0.08 + Math.random() * 0.25
    const t = Math.random()
    let c
    if (t < 0.5) c = [1, 1, 1]
    else if (t < 0.7) c = [1, 0.92, 0.78]
    else if (t < 0.85) c = [0.78, 0.85, 1]
    else c = [1, 0.75, 0.65]
    const bright = 0.7 + Math.random() * 0.3
    fgCol[i3] = c[0] * bright
    fgCol[i3 + 1] = c[1] * bright
    fgCol[i3 + 2] = c[2] * bright
  }
  fgGeo.setAttribute('position', new THREE.BufferAttribute(fgPos, 3))
  fgGeo.setAttribute('size', new THREE.BufferAttribute(fgSizes, 1))
  fgGeo.setAttribute('color', new THREE.BufferAttribute(fgCol, 3))
  const fgMat = new THREE.PointsMaterial({
    size: 0.15,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    map: starTex,
    alphaTest: 0.001,
  })
  const fgStars = new THREE.Points(fgGeo, fgMat)
  fgStars.material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      'gl_PointSize = size *',
      'gl_PointSize = size * (0.5 + 1.5 * (1.0 + sin(position.x * 100.0 + position.y * 73.0 + position.z * 41.0)) * 0.3) *'
    )
  }
  rootGroup.add(fgStars)

  let rotationY = 0
  let lastFrameT = performance.now()
  let frames = 0
  let fpsLastT = performance.now()
  let currentFps = 0

  const resizeObserver = new ResizeObserver(() => {
    const width = container.clientWidth
    const height = container.clientHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  })
  resizeObserver.observe(container)

  function tick() {
    const now = performance.now()
    const dt = (now - lastFrameT) / 1000
    lastFrameT = now
    rotationY += dt * 0.3 * rotationSpeed
    rootGroup.rotation.y = rotationY
    renderer.render(scene, camera)
    frames++
    if (now - fpsLastT >= 500) {
      currentFps = (frames * 1000) / (now - fpsLastT)
      frames = 0
      fpsLastT = now
    }
  }

  return {
    setRotationSpeed(speed: number) {
      rotationSpeed = speed
    },
    setParticleCount(_count: number) {},
    setZoom(zoom: number) {
      camera.zoom = Math.max(0.4, Math.min(zoom, 3))
      camera.updateProjectionMatrix()
    },
    getFps() {
      return currentFps
    },
    destroy() {
      renderer.setAnimationLoop(null)
      resizeObserver.disconnect()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })
      starTex.dispose()
      starTexSoft.dispose()
    },
  }
}
