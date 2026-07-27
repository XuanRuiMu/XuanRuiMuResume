import * as THREE from 'three'

export interface A25StarrySceneOptions {
  particleCount?: number
  dpr?: number
  rotationSpeed?: number
  breathEnabled?: boolean
}

export interface A25StarrySceneApi {
  setRotationSpeed: (speed: number) => void
  setBreathEnabled: (enabled: boolean) => void
  setParticleCount: (count: number) => void
  setZoom: (zoom: number) => void
  getFps: () => number
  destroy: () => void
}

const DEFAULT_PARTICLE_COUNT = 20000
const DEFAULT_DPR = 1.5
const DEFAULT_ROTATION_SPEED = 0.1

function makeStarTexture(): THREE.CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 2D context')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.85)')
  gradient.addColorStop(0.55, 'rgba(180,200,255,0.35)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

interface GalaxyParams {
  count: number
  size: number
  radius: number
  branches: number
  spin: number
  randomness: number
  randomnessPower: number
  insideColor: THREE.Color
  outsideColor: THREE.Color
}

export function createA25StarryScene(container: HTMLElement, options: A25StarrySceneOptions = {}): A25StarrySceneApi {
  const particleCount = options.particleCount ?? DEFAULT_PARTICLE_COUNT
  const dpr = Math.min(options.dpr ?? DEFAULT_DPR, 2)
  let rotationSpeed = options.rotationSpeed ?? DEFAULT_ROTATION_SPEED
  let breathEnabled = options.breathEnabled ?? true

  const scene = new THREE.Scene()
  // 极低雾密度：只给远景一点纵深 cues，绝不让背景星被雾衰减到看不见。
  scene.fog = new THREE.FogExp2(0x05060f, 0.0035)

  // 相机对准星系中心并显式 lookAt——否则相机默认朝 -Z 看，会把星系甩到画面左下。
  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 300)
  camera.position.set(0, 5.5, 13.5)
  camera.lookAt(0, 0, 0)

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

  const starTex = makeStarTexture()

  const galaxyParams: GalaxyParams = {
    count: particleCount,
    size: 0.085,
    radius: 10,
    branches: 5,
    spin: 1,
    randomness: 0.5,
    randomnessPower: 3,
    insideColor: new THREE.Color('#ff9a52'),
    outsideColor: new THREE.Color('#4a7bff'),
  }

  function buildGalaxy(count: number): THREE.Points {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const radius = Math.random() * galaxyParams.radius
      const spinAngle = radius * galaxyParams.spin
      const branchAngle = ((i % galaxyParams.branches) / galaxyParams.branches) * Math.PI * 2
      const signX = Math.random() < 0.5 ? 1 : -1
      const signY = Math.random() < 0.5 ? 1 : -1
      const signZ = Math.random() < 0.5 ? 1 : -1
      const rndX = Math.pow(Math.random(), galaxyParams.randomnessPower) * signX * galaxyParams.randomness * radius
      const rndY =
        Math.pow(Math.random(), galaxyParams.randomnessPower) * signY * galaxyParams.randomness * radius * 0.45
      const rndZ = Math.pow(Math.random(), galaxyParams.randomnessPower) * signZ * galaxyParams.randomness * radius
      positions[i3] = Math.cos(branchAngle + spinAngle) * radius + rndX
      positions[i3 + 1] = rndY
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + rndZ
      const mixed = galaxyParams.insideColor
        .clone()
        .lerp(galaxyParams.outsideColor, Math.min(radius / galaxyParams.radius, 1))
      colors[i3] = mixed.r
      colors[i3 + 1] = mixed.g
      colors[i3 + 2] = mixed.b
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const material = new THREE.PointsMaterial({
      size: galaxyParams.size,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      map: starTex,
      alphaTest: 0.001,
    })
    return new THREE.Points(geometry, material)
  }

  function buildBackgroundStars(count: number): THREE.Points {
    const n = count
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(n * 3)
    const col = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const i3 = i * 3
      // 全球面均匀分布，半径拉大到包住相机，让星点铺满整个视野。
      const r = 45 + Math.random() * 80
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i3 + 2] = r * Math.cos(phi)
      // 星点颜色：白 / 暖白 / 淡蓝 随机，营造真实星空色差。
      const t = Math.random()
      const c = t < 0.6 ? [1, 1, 1] : t < 0.85 ? [1, 0.9, 0.78] : [0.72, 0.82, 1]
      const bright = 0.6 + Math.random() * 0.4
      col[i3] = c[0] * bright
      col[i3 + 1] = c[1] * bright
      col[i3 + 2] = c[2] * bright
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const mat = new THREE.PointsMaterial({
      size: 0.55,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: starTex,
    })
    return new THREE.Points(geo, mat)
  }

  const breatheGroup = new THREE.Group()
  scene.add(breatheGroup)

  let galaxy = buildGalaxy(particleCount)
  let bgStars = buildBackgroundStars(Math.round(4500 * (particleCount / DEFAULT_PARTICLE_COUNT)))
  breatheGroup.add(galaxy)
  breatheGroup.add(bgStars)

  const uTime = { value: 0 }
  const breatheGLSL = `float breathe(float t) { return 0.5 + 0.5 * sin(t * 6.28318530718 * 0.15); }`

  const sphereGeo = new THREE.SphereGeometry(0.85, 48, 48)
  const sphereMat = new THREE.ShaderMaterial({
    uniforms: { uTime },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      const vec3 colorPeak   = vec3(0.42, 0.13, 0.74);
      const vec3 colorValley = vec3(0.03, 0.0, 0.05);
      ${breatheGLSL}
      void main() {
        float intensity = breathe(uTime);
        vec3 color = mix(colorValley, colorPeak, intensity);
        float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
        fresnel = pow(fresnel, 1.5);
        color += colorPeak * fresnel * (0.5 + intensity * 0.9);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  })
  breatheGroup.add(new THREE.Mesh(sphereGeo, sphereMat))

  const haloGeo = new THREE.SphereGeometry(1.3, 48, 48)
  const haloMat = new THREE.ShaderMaterial({
    uniforms: { uTime },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      const vec3 colorPeak = vec3(0.42, 0.13, 0.74);
      ${breatheGLSL}
      void main() {
        float intensity = breathe(uTime);
        float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
        fresnel = pow(fresnel, 2.0);
        gl_FragColor = vec4(colorPeak, fresnel * intensity * 0.5);
      }
    `,
  })
  breatheGroup.add(new THREE.Mesh(haloGeo, haloMat))

  const clock = new THREE.Clock()
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
    breatheGroup.rotation.y = rotationY
    if (breathEnabled) {
      uTime.value = clock.getElapsedTime()
    }
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
    setBreathEnabled(enabled: boolean) {
      breathEnabled = enabled
    },
    setParticleCount(count: number) {
      const safeCount = Math.max(1000, Math.min(count, 50000))
      breatheGroup.remove(galaxy)
      breatheGroup.remove(bgStars)
      galaxy.geometry.dispose()
      bgStars.geometry.dispose()
      galaxy = buildGalaxy(safeCount)
      bgStars = buildBackgroundStars(Math.round(4500 * (safeCount / DEFAULT_PARTICLE_COUNT)))
      breatheGroup.add(galaxy)
      breatheGroup.add(bgStars)
    },
    setZoom(zoom: number) {
      // 用相机焦距实现缩放（滚轮已用于页面滚动，故缩放走控制台）。限定范围防止拉飞。
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
    },
  }
}
