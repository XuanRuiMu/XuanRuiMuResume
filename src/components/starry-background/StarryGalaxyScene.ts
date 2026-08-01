import * as THREE from 'three'
import GUI from 'three/addons/libs/lil-gui.module.min.js'
import { t as translate } from '../../i18n/translations'
import type { TranslationKey } from '../../i18n/translations'
import { useStarryUiStore } from '../../store/useStarryUiStore'

export interface StarryGalaxySceneOptions {
  dpr?: number
  t?: (key: TranslationKey) => string
}

export interface StarryGalaxySceneApi {
  getFps: () => number
  destroy: () => void
}

export const DEFAULT_EFFECT_PARAMS = {
  supernova: { frequency: 0.5 },
  nebula: { count: 6, opacity: 0.5 },
  twinkle: { intensity: 0.6, speed: 1.85 },
  stardust: { opacity: 1 },
} as const

interface GalaxyUniforms extends Record<string, THREE.IUniform> {
  uSize: THREE.IUniform<number>
  uBranches: THREE.IUniform<number>
  uRadius: THREE.IUniform<number>
  uSpin: THREE.IUniform<number>
  uRandomness: THREE.IUniform<number>
  uCycleSpeed: THREE.IUniform<number>
  uTime: THREE.IUniform<number>
  uTwinkle: THREE.IUniform<number>
  uTwinkleSpeed: THREE.IUniform<number>
  uColorInn: THREE.IUniform<THREE.Color>
  uColorOut: THREE.IUniform<THREE.Color>
  uAlphaMap: THREE.IUniform<THREE.Texture>
}

interface UniverseUniforms extends Record<string, THREE.IUniform> {
  uTime: THREE.IUniform<number>
  uSize: THREE.IUniform<number>
  uRadius: THREE.IUniform<number>
  uAlphaMap: THREE.IUniform<THREE.Texture>
}

interface EffectState {
  colorBreath: { enabled: boolean }
  supernova: { enabled: boolean; frequency: number }
  nebula: { enabled: boolean; count: number; opacity: number }
  twinkle: { enabled: boolean; intensity: number; speed: number }
  stardust: { enabled: boolean; opacity: number }
}

interface SupernovaItem {
  obj: THREE.Sprite
  mat: THREE.SpriteMaterial
  t0: number
  dur: number
}

const GALAXY_COUNT = 128 ** 2
const UNIVERSE_COUNT = GALAXY_COUNT / 2
const STARDUST_COUNT = 500
const BACKGROUND_COLOR = 0x05060f

const NEBULA_COLORS = [
  { r: 180, g: 60, b: 220, a: 0.6 },
  { r: 60, g: 120, b: 255, a: 0.5 },
  { r: 255, g: 80, b: 120, a: 0.4 },
  { r: 80, g: 220, b: 200, a: 0.5 },
  { r: 220, g: 160, b: 60, a: 0.4 },
  { r: 140, g: 60, b: 255, a: 0.5 },
] as const

const shaderUtils = `
  float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  vec3 scatter (vec3 seed) {
    float u = random(seed.xy);
    float v = random(seed.yz);
    float theta = u * 6.28318530718;
    float phi = acos(2.0 * v - 1.0);
    return vec3(sin(phi)*cos(theta), sin(phi)*sin(theta), cos(phi));
  }
`

const galaxyVertexShader = `
  precision highp float;
  in vec3 position; in float size; in vec3 seed;
  uniform mat4 projectionMatrix; uniform mat4 modelViewMatrix;
  uniform float uTime; uniform float uSize; uniform float uBranches;
  uniform float uRadius; uniform float uSpin; uniform float uRandomness;
  out float vDistance;
  #define PI 3.14159265359
  #define PI2 6.28318530718
  #include <random, scatter>
  void main() {
    vec3 p = position;
    float st = sqrt(p.x); float qt = p.x * p.x; float mt = mix(st, qt, p.x);
    float angle = qt * uSpin * (2.0 - sqrt(1.0 - qt));
    float branchOffset = (PI2 / uBranches) * floor(seed.x * uBranches);
    p.x = position.x * cos(angle + branchOffset) * uRadius;
    p.z = position.x * sin(angle + branchOffset) * uRadius;
    p += scatter(seed) * random(seed.zx) * uRandomness * mt;
    p.y *= 0.5 + qt * 0.5;
    vec3 temp = p;
    float ac = cos(-uTime * (2.0 - st) * 0.5);
    float as = sin(-uTime * (2.0 - st) * 0.5);
    p.x = temp.x * ac - temp.z * as; p.z = temp.x * as + temp.z * ac;
    vDistance = mt;
    vec4 mvp = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvp;
    gl_PointSize = (10.0 * size * uSize) / -mvp.z;
  }
`

const galaxyFragmentShader = `
  precision highp float;
  #define PI 3.14159265359
  uniform vec3 uColorInn; uniform vec3 uColorOut; uniform sampler2D uAlphaMap;
  in float vDistance;
  out vec4 fragColor;
  void main() {
    vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
    float a = texture(uAlphaMap, uv).g; if (a < 0.1) discard;
    vec3 color = mix(uColorInn, uColorOut, vDistance);
    float c = step(0.99, (sin(gl_PointCoord.x * PI) + sin(gl_PointCoord.y * PI)) * 0.5);
    color = max(color, vec3(c));
    fragColor = vec4(color, a);
  }
`

const universeVertexShader = `
  precision highp float;
  in vec3 seed; in float size;
  uniform mat4 projectionMatrix; uniform mat4 modelViewMatrix;
  uniform float uTime; uniform float uSize; uniform float uRadius;
  #define PI 3.14159265359
  #define PI2 6.28318530718
  #include <random, scatter>
  const float r = 3.0; const vec3 s = vec3(2.1, 1.3, 2.1);
  void main() {
    vec3 p = scatter(seed) * r * s;
    float q = random(seed.zx);
    for (int i = 0; i < 3; i++) q *= q;
    p *= q;
    float l = length(p) / (s.x * r);
    p = l < 0.001 ? (p / l) : p;
    vec3 temp = p; float ql = 1.0 - l;
    for (int i = 0; i < 3; i++) ql *= ql;
    float ac = cos(-uTime * ql); float as = sin(-uTime * ql);
    p.x = temp.x * ac - temp.z * as; p.z = temp.x * as + temp.z * ac;
    vec4 mvp = modelViewMatrix * vec4(p * uRadius, 1.0);
    gl_Position = projectionMatrix * mvp;
    l = (2.0 - l) * (2.0 - l);
    gl_PointSize = (r * size * uSize * l) / -mvp.z;
  }
`

const universeFragmentShader = `
  precision highp float;
  uniform sampler2D uAlphaMap;
  out vec4 fragColor;
  void main() {
    vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
    float a = texture(uAlphaMap, uv).g; if (a < 0.1) discard;
    fragColor = vec4(vec3(1.0), a);
  }
`

const stardustVertexShader = `
  precision highp float;
  in vec3 position; in float size;
  uniform mat4 projectionMatrix; uniform mat4 modelViewMatrix;
  void main() {
    vec3 p = position;
    vec4 mvp = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvp;
    gl_PointSize = (6.0 * size) / -mvp.z;
  }
`

const stardustFragmentShader = `
  precision highp float;
  uniform sampler2D uAlphaMap;
  uniform float uOpacity;
  out vec4 fragColor;
  void main() {
    vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
    float a = texture(uAlphaMap, uv).g;
    if (a < 0.05) discard;
    fragColor = vec4(0.7, 0.8, 1.0, a * uOpacity);
  }
`

function makeAlphaMap(): THREE.CanvasTexture {
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) throw new Error('无法创建 2D context')
  ctx.canvas.width = 32
  ctx.canvas.height = 32
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, 32, 32)
  let grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  grd.addColorStop(0.0, '#fff')
  grd.addColorStop(1.0, '#000')
  ctx.fillStyle = grd
  ctx.beginPath()
  ctx.rect(15, 0, 2, 32)
  ctx.fill()
  ctx.beginPath()
  ctx.rect(0, 15, 32, 2)
  ctx.fill()
  grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  grd.addColorStop(0.1, '#ffff')
  grd.addColorStop(0.6, '#0000')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, 32, 32)
  return new THREE.CanvasTexture(ctx.canvas)
}

function makeSupernovaTexture(): THREE.CanvasTexture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 2D context')
  const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.2, 'rgba(255,200,100,0.8)')
  grd.addColorStop(0.5, 'rgba(255,100,50,0.4)')
  grd.addColorStop(1, 'rgba(255,0,0,0)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

function makeNebulaTexture(r: number, g: number, b: number, a: number): THREE.CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 2D context')
  const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grd.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')')
  grd.addColorStop(0.4, 'rgba(' + r + ',' + g + ',' + b + ',' + a * 0.5 + ')')
  grd.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

export function createStarryGalaxyScene(
  container: HTMLElement,
  options: StarryGalaxySceneOptions = {}
): StarryGalaxySceneApi {
  const tf = options.t ?? translate
  const dpr = Math.min(options.dpr ?? window.devicePixelRatio, 2)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(BACKGROUND_COLOR)

  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100)
  camera.position.set(0, 2.2, 5.5)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(dpr)
  renderer.setClearColor(BACKGROUND_COLOR, 1)
  container.appendChild(renderer.domElement)

  const alphaMap = makeAlphaMap()

  const galaxyGeometry = new THREE.BufferGeometry()
  const galaxyPosition = new Float32Array(GALAXY_COUNT * 3)
  const galaxySeed = new Float32Array(GALAXY_COUNT * 3)
  const galaxySize = new Float32Array(GALAXY_COUNT)
  for (let i = 0; i < GALAXY_COUNT; i++) {
    galaxyPosition[i * 3] = i / GALAXY_COUNT
    galaxySeed[i * 3 + 0] = Math.random()
    galaxySeed[i * 3 + 1] = Math.random()
    galaxySeed[i * 3 + 2] = Math.random()
    galaxySize[i] = Math.random() * 2 + 0.5
  }
  galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(galaxyPosition, 3))
  galaxyGeometry.setAttribute('size', new THREE.BufferAttribute(galaxySize, 1))
  galaxyGeometry.setAttribute('seed', new THREE.BufferAttribute(galaxySeed, 3))

  const breathPurpleInn = new THREE.Color('#5900b3')
  const breathPurpleOut = new THREE.Color('#5ca3ff')
  const breathBlueInn = new THREE.Color('#2a4dff')
  const breathBlueOut = new THREE.Color('#66ccff')
  const currentInn = new THREE.Color()
  const currentOut = new THREE.Color()

  const galaxyUniforms: GalaxyUniforms = {
    uTime: { value: 0 },
    uSize: { value: 1.69 },
    uBranches: { value: 5 },
    uRadius: { value: 2.79 },
    uSpin: { value: 1.75 },
    uRandomness: { value: 1 },
    uAlphaMap: { value: alphaMap },
    uColorInn: { value: breathPurpleInn },
    uColorOut: { value: breathPurpleOut },
    uCycleSpeed: { value: 1.02 },
    uTwinkle: { value: 0 },
    uTwinkleSpeed: { value: 1 },
  }

  const galaxyMaterial = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: galaxyUniforms,
    vertexShader: galaxyVertexShader,
    fragmentShader: galaxyFragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const universeGeometry = new THREE.BufferGeometry()
  const universePosition = new Float32Array(UNIVERSE_COUNT * 3)
  const universeSeed = new Float32Array(UNIVERSE_COUNT * 3)
  const universeSize = new Float32Array(UNIVERSE_COUNT)
  for (let i = 0; i < UNIVERSE_COUNT; i++) {
    universeSeed[i * 3 + 0] = Math.random()
    universeSeed[i * 3 + 1] = Math.random()
    universeSeed[i * 3 + 2] = Math.random()
    universeSize[i] = Math.random() * 2 + 0.5
  }
  universeGeometry.setAttribute('position', new THREE.BufferAttribute(universePosition, 3))
  universeGeometry.setAttribute('seed', new THREE.BufferAttribute(universeSeed, 3))
  universeGeometry.setAttribute('size', new THREE.BufferAttribute(universeSize, 1))

  const universeUniforms: UniverseUniforms = {
    uTime: { value: 0 },
    uSize: galaxyUniforms.uSize,
    uRadius: galaxyUniforms.uRadius,
    uAlphaMap: galaxyUniforms.uAlphaMap,
  }

  const universeMaterial = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: universeUniforms,
    vertexShader: universeVertexShader,
    fragmentShader: universeFragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial)
  const universe = new THREE.Points(universeGeometry, universeMaterial)

  galaxy.material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <random, scatter>', shaderUtils)
    shader.vertexShader = shader.vertexShader.replace(
      'out float vDistance;',
      'out float vDistance; out float vTwinkleSeed;'
    )
    shader.vertexShader = shader.vertexShader.replace('vDistance = mt;', 'vDistance = mt; vTwinkleSeed = seed.x;')
    shader.fragmentShader = shader.fragmentShader.replace(
      'uniform vec3 uColorInn; uniform vec3 uColorOut; uniform sampler2D uAlphaMap;',
      'uniform vec3 uColorInn; uniform vec3 uColorOut; uniform sampler2D uAlphaMap; uniform float uTwinkle; uniform float uTwinkleSpeed; uniform float uTime;'
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      'in float vDistance;',
      'in float vDistance; in float vTwinkleSeed;'
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      'fragColor = vec4(color, a);',
      'float tf = 1.0 - uTwinkle * 0.5 * (1.0 + sin(uTwinkleSpeed * uTime * 3.0 + vTwinkleSeed * 6.2832)); fragColor = vec4(color, a * tf);'
    )
  }
  universe.material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <random, scatter>', shaderUtils)
  }

  scene.add(galaxy)
  scene.add(universe)

  const effState: EffectState = {
    colorBreath: { enabled: true },
    supernova: { enabled: true, frequency: DEFAULT_EFFECT_PARAMS.supernova.frequency },
    nebula: {
      enabled: true,
      count: DEFAULT_EFFECT_PARAMS.nebula.count,
      opacity: DEFAULT_EFFECT_PARAMS.nebula.opacity,
    },
    twinkle: {
      enabled: true,
      intensity: DEFAULT_EFFECT_PARAMS.twinkle.intensity,
      speed: DEFAULT_EFFECT_PARAMS.twinkle.speed,
    },
    stardust: { enabled: true, opacity: DEFAULT_EFFECT_PARAMS.stardust.opacity },
  }

  const supernovaTexture = makeSupernovaTexture()
  const supernovaList: SupernovaItem[] = []
  let supernovaNext = performance.now() + 3000

  function spawnSupernova() {
    const mat = new THREE.SpriteMaterial({
      map: supernovaTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    })
    const sprite = new THREE.Sprite(mat)
    sprite.position.set(0, 0, 0)
    sprite.scale.set(0.1, 0.1, 1)
    scene.add(sprite)
    supernovaList.push({ obj: sprite, mat, t0: performance.now(), dur: 3000 })
  }

  function updateSupernova(now: number) {
    if (!effState.supernova.enabled) return
    const freq = effState.supernova.frequency
    if (now >= supernovaNext) {
      spawnSupernova()
      supernovaNext = now + 2000 / freq + (Math.random() * 2000) / freq
    }
    for (let i = supernovaList.length - 1; i >= 0; i--) {
      const sn = supernovaList[i]
      const progress = (now - sn.t0) / sn.dur
      if (progress >= 1) {
        scene.remove(sn.obj)
        sn.mat.dispose()
        supernovaList.splice(i, 1)
        continue
      }
      const scale = 0.1 + progress * 8
      sn.obj.scale.set(scale, scale, 1)
      sn.mat.color.set(1, 1 - progress * 0.6, 1 - progress * 0.8)
      sn.mat.opacity = 1 - progress
    }
  }

  function clearSupernova() {
    for (let i = supernovaList.length - 1; i >= 0; i--) {
      scene.remove(supernovaList[i].obj)
      supernovaList[i].mat.dispose()
    }
    supernovaList.length = 0
  }

  const nebulaSprites: THREE.Sprite[] = []

  function createNebula(count: number) {
    removeNebula()
    for (let i = 0; i < count; i++) {
      const ci = i % NEBULA_COLORS.length
      const nc = NEBULA_COLORS[ci]
      const tex = makeNebulaTexture(nc.r, nc.g, nc.b, nc.a)
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        opacity: effState.nebula.opacity,
      })
      const sprite = new THREE.Sprite(mat)
      const angle = Math.random() * Math.PI * 2
      const radius = 5 + Math.random() * 5
      const height = (Math.random() - 0.5) * 4
      sprite.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius)
      const s = 2 + Math.random() * 3
      sprite.scale.set(s, s, 1)
      sprite.userData = {
        angle,
        radius,
        height,
        speed: 0.05 + Math.random() * 0.05,
        phase: Math.random() * 6.28,
      }
      scene.add(sprite)
      nebulaSprites.push(sprite)
    }
  }

  function removeNebula() {
    for (let i = nebulaSprites.length - 1; i >= 0; i--) {
      scene.remove(nebulaSprites[i])
      const mat = nebulaSprites[i].material
      mat.map?.dispose()
      mat.dispose()
    }
    nebulaSprites.length = 0
  }

  function updateNebula(time: number) {
    if (!effState.nebula.enabled) return
    for (let i = 0; i < nebulaSprites.length; i++) {
      const sp = nebulaSprites[i]
      const ud = sp.userData as {
        angle: number
        radius: number
        height: number
        speed: number
        phase: number
      }
      const t = time * ud.speed + ud.phase
      sp.position.x = Math.cos(t) * ud.radius
      sp.position.z = Math.sin(t * 0.7) * ud.radius
      sp.position.y = ud.height + Math.sin(t * 0.5) * 1.5
      sp.material.opacity = effState.nebula.opacity
    }
  }

  function updateTwinkle() {
    const e = effState.twinkle
    galaxyUniforms.uTwinkle.value = e.enabled ? e.intensity : 0
    galaxyUniforms.uTwinkleSpeed.value = e.speed
  }

  let stardustPoints: THREE.Points | null = null

  function createStardust() {
    removeStardust()
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(STARDUST_COUNT * 3)
    const sz = new Float32Array(STARDUST_COUNT)
    const seed = new Float32Array(STARDUST_COUNT * 3)
    for (let i = 0; i < STARDUST_COUNT; i++) {
      const theta = Math.random() * 6.2832
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 3 + Math.random() * 8
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      sz[i] = Math.random() * 3 + 1
      seed[i * 3] = Math.random()
      seed[i * 3 + 1] = Math.random()
      seed[i * 3 + 2] = Math.random()
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sz, 1))
    geo.setAttribute('seed', new THREE.BufferAttribute(seed, 3))

    const mat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        uAlphaMap: { value: alphaMap },
        uOpacity: { value: effState.stardust.opacity },
      },
      vertexShader: stardustVertexShader,
      fragmentShader: stardustFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    stardustPoints = new THREE.Points(geo, mat)
    scene.add(stardustPoints)
  }

  function removeStardust() {
    if (stardustPoints) {
      scene.remove(stardustPoints)
      stardustPoints.geometry.dispose()
      if (Array.isArray(stardustPoints.material)) {
        stardustPoints.material.forEach((m) => m.dispose())
      } else {
        stardustPoints.material.dispose()
      }
      stardustPoints = null
    }
  }

  function updateStardust(time: number) {
    if (!effState.stardust.enabled || !stardustPoints) return
    const pos = stardustPoints.geometry.attributes.position.array
    for (let i = 0; i < pos.length; i += 3) {
      const t = time * 0.1 + i * 0.01
      pos[i] += Math.sin(t + i * 0.03) * 0.0005
      pos[i + 1] += Math.sin(t * 0.7 + i * 0.05) * 0.0003
      pos[i + 2] += Math.cos(t * 0.8 + i * 0.04) * 0.0005
    }
    stardustPoints.geometry.attributes.position.needsUpdate = true
    ;(stardustPoints.material as THREE.RawShaderMaterial).uniforms.uOpacity.value = effState.stardust.opacity
  }

  const guiContainer = typeof document !== 'undefined' ? document.getElementById('starry-gui-slot') : null
  const starryGuiTrigger = typeof document !== 'undefined' ? document.getElementById('starry-gui-trigger') : null
  const gui = new GUI({
    title: tf('starryBg.title'),
    width: 300,
    container: guiContainer ?? undefined,
  })
  const guiStyle = gui.domElement.style
  guiStyle.position = 'relative'
  guiStyle.width = '100%'
  guiStyle.maxHeight = 'calc(100vh - 80px)'
  guiStyle.overflowY = 'auto'

  let starryPanelOpen = false
  const setStarryPanel = (open: boolean) => {
    starryPanelOpen = open
    if (guiContainer) guiContainer.classList.toggle('hidden', !open)
    starryGuiTrigger?.setAttribute('aria-expanded', String(open))
  }
  const onStarryDocClick = (e: MouseEvent) => {
    const target = e.target as Node
    if (starryGuiTrigger && starryGuiTrigger.contains(target)) {
      e.stopPropagation()
      setStarryPanel(!starryPanelOpen)
      return
    }
    if (guiContainer && guiContainer.contains(target)) return
    if (starryPanelOpen) setStarryPanel(false)
  }
  if (starryGuiTrigger && guiContainer) {
    document.addEventListener('click', onStarryDocClick)
  }

  const fGalaxy = gui.addFolder(tf('starryBg.galaxy'))
  fGalaxy.add(galaxyUniforms.uSize, 'value', 0, 4, 0.01).name(tf('starryBg.particleSize'))
  fGalaxy.add(galaxyUniforms.uBranches, 'value', 1, 5, 1).name(tf('starryBg.branches'))
  fGalaxy.add(galaxyUniforms.uRadius, 'value', 0, 5, 0.01).name(tf('starryBg.radius'))
  fGalaxy.add(galaxyUniforms.uSpin, 'value', -12.57, 12.57, 0.01).name(tf('starryBg.spin'))
  fGalaxy.add(galaxyUniforms.uRandomness, 'value', 0, 1, 0.01).name(tf('starryBg.randomness'))
  fGalaxy.open()

  const fBreath = gui.addFolder(tf('starryBg.colorBreath'))
  fBreath.add(effState.colorBreath, 'enabled').name(tf('starryBg.enabled'))
  fBreath.add(galaxyUniforms.uCycleSpeed, 'value', 0.1, 5, 0.01).name(tf('starryBg.cycleSpeed'))

  const fSupernova = gui.addFolder(tf('starryBg.supernova'))
  fSupernova
    .add(effState.supernova, 'enabled')
    .name(tf('starryBg.enabled'))
    .onChange((v) => {
      if (!v) clearSupernova()
    })
  fSupernova.add(effState.supernova, 'frequency', 0.1, 3, 0.1).name(tf('starryBg.frequency'))

  const fNebula = gui.addFolder(tf('starryBg.nebula'))
  fNebula
    .add(effState.nebula, 'enabled')
    .name(tf('starryBg.enabled'))
    .onChange((v) => {
      if (v) createNebula(effState.nebula.count)
      else removeNebula()
    })
  fNebula
    .add(effState.nebula, 'count', 1, 6, 1)
    .name(tf('starryBg.count'))
    .onChange((v) => {
      if (effState.nebula.enabled) createNebula(v)
    })
  fNebula.add(effState.nebula, 'opacity', 0, 1, 0.01).name(tf('starryBg.opacity'))

  const fTwinkle = gui.addFolder(tf('starryBg.twinkle'))
  fTwinkle.add(effState.twinkle, 'enabled').name(tf('starryBg.enabled'))
  fTwinkle.add(effState.twinkle, 'intensity', 0, 1, 0.01).name(tf('starryBg.intensity'))
  fTwinkle.add(effState.twinkle, 'speed', 0.1, 3, 0.01).name(tf('starryBg.speed'))

  const fStardust = gui.addFolder(tf('starryBg.stardust'))
  fStardust
    .add(effState.stardust, 'enabled')
    .name(tf('starryBg.enabled'))
    .onChange((v) => {
      if (v) createStardust()
      else removeStardust()
    })
  fStardust.add(effState.stardust, 'opacity', 0, 1, 0.01).name(tf('starryBg.opacity'))

  const fDisplay = gui.addFolder(tf('starryBg.display'))
  const inkProxy = { on: useStarryUiStore.getState().inkEnabled }
  fDisplay
    .add(inkProxy, 'on')
    .name(tf('starryBg.inkScreen'))
    .onChange((v) => {
      useStarryUiStore.getState().setInkEnabled(Boolean(v))
    })

  fDisplay.open()

  createNebula(effState.nebula.count)
  createStardust()
  updateTwinkle()

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

  const cycleStart = performance.now()

  renderer.setAnimationLoop(() => {
    const now = performance.now()
    const dt = Math.min((now - lastFrameT) / 1000, 0.1)
    lastFrameT = now
    const cycleTime = (now - cycleStart) / 1000

    galaxyUniforms.uTime.value += dt * 0.03
    universeUniforms.uTime.value += dt * 0.02

    const speed = galaxyUniforms.uCycleSpeed.value
    const factor = effState.colorBreath.enabled ? (Math.sin(cycleTime * speed) + 1) / 2 : 0
    currentInn.copy(breathPurpleInn).lerp(breathBlueInn, factor)
    currentOut.copy(breathPurpleOut).lerp(breathBlueOut, factor)
    galaxyUniforms.uColorInn.value.copy(currentInn)
    galaxyUniforms.uColorOut.value.copy(currentOut)

    updateSupernova(now)
    updateNebula(cycleTime)
    updateTwinkle()
    updateStardust(cycleTime)

    renderer.render(scene, camera)

    frames++
    if (now - fpsLastT >= 500) {
      currentFps = (frames * 1000) / (now - fpsLastT)
      frames = 0
      fpsLastT = now
    }
  })

  return {
    getFps() {
      return currentFps
    },
    destroy() {
      renderer.setAnimationLoop(null)
      resizeObserver.disconnect()
      document.removeEventListener('click', onStarryDocClick)
      gui.destroy()
      clearSupernova()
      removeNebula()
      removeStardust()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Points || obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else {
            obj.material.dispose()
          }
        } else if (obj instanceof THREE.Sprite) {
          obj.material.dispose()
        }
      })
      alphaMap.dispose()
      supernovaTexture.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    },
  }
}
