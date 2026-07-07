import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { NodeMaterial } from 'three/webgpu'
import {
  vec3,
  float,
  uniform,
  mix,
  smoothstep,
  clamp,
  sin,
  pow,
  step,
  positionWorld,
  normalize,
  atan,
  mx_fractal_noise_float,
  hash,
} from 'three/tsl'

const 配置 = {
  球体半径: 150,
  旋转速度: 0.0008,
  噪声流速: 0.03,
  噪声尺度1: 1.2,
  噪声尺度2: 2.5,
  噪声尺度3: 5.0,
  尘埃带强度: 0.22,
  星点密度: 0.992,
  星点亮度: 0.85,
  核心色: [0.95, 0.75, 0.55],
  中层色: [0.45, 0.38, 0.62],
  外层色: [0.04, 0.06, 0.11],
  尘埃色: [0.78, 0.62, 0.42],
}

const 顶点着色器 = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const 片段着色器 = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorldPos;

  float hash31(vec3 p) {
    p = vec3(
      dot(p, vec3(127.1, 311.7, 74.7)),
      dot(p, vec3(269.5, 183.3, 246.1)),
      dot(p, vec3(113.5, 271.9, 124.6))
    );
    return fract(sin(p.x) * 43758.5453);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x),
        f.y
      ),
      mix(
        mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x),
        f.y
      ),
      f.z
    );
  }

  float fbm3(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise3(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vWorldPos);
    float theta = atan(dir.z, dir.x);

    float n1 = fbm3(dir * 1.2 + vec3(0.0, 0.0, uTime * 0.03));
    float n2 = fbm3(dir * 2.5 + vec3(uTime * 0.03, 0.0, 0.0));
    float n3 = fbm3(dir * 5.0 + vec3(0.0, uTime * 0.03, 0.0));

    float vGrad = clamp(dir.y * 0.6 + 0.5, 0.0, 1.0);
    vec3 color = mix(vec3(0.04, 0.06, 0.11), vec3(0.45, 0.38, 0.62), vGrad);

    float nebula = smoothstep(0.3, 0.7, n1) * 0.55
                 + smoothstep(0.3, 0.7, n2) * 0.35
                 + smoothstep(0.3, 0.7, n3) * 0.15;
    color = mix(color, vec3(0.95, 0.75, 0.55), nebula * 0.45);

    float dust = pow(smoothstep(0.35, 0.65, sin(theta * 6.0 + n1 * 2.0) * 0.5 + 0.5), 2.0) * 0.22;
    color = mix(color, vec3(0.78, 0.62, 0.42), dust);

    float starSeed = fract(sin(dot(dir * vec3(120.0, 80.0, 120.0), vec3(127.1, 311.7, 74.7))) * 43758.5453);
    float star = step(0.992, starSeed);
    float twinkle = sin(uTime * 3.0 + starSeed * 20.0) * 0.5 + 0.5;
    color += vec3(0.92, 0.95, 1.0) * star * twinkle * 0.85;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`

function 创建WebGPU材质() {
  const 时间 = uniform(0)
  const 方向 = normalize(positionWorld)
  const theta = atan(方向.z, 方向.x)

  const 噪声1 = mx_fractal_noise_float(
    方向.mul(配置.噪声尺度1).add(vec3(0, 0, 时间.mul(配置.噪声流速))),
    3,
    2,
    0.5,
    1
  )
  const 噪声2 = mx_fractal_noise_float(
    方向.mul(配置.噪声尺度2).add(vec3(时间.mul(配置.噪声流速), 0, 0)),
    3,
    2,
    0.5,
    1
  )
  const 噪声3 = mx_fractal_noise_float(
    方向.mul(配置.噪声尺度3).add(vec3(0, 时间.mul(配置.噪声流速), 0)),
    2,
    2,
    0.5,
    1
  )

  const 噪声1归一 = 噪声1.mul(0.5).add(0.5)
  const 噪声2归一 = 噪声2.mul(0.5).add(0.5)
  const 噪声3归一 = 噪声3.mul(0.5).add(0.5)

  const 垂直渐变 = clamp(方向.y.mul(0.6).add(0.5), 0, 1)
  const 基础色 = mix(vec3(...配置.外层色), vec3(...配置.中层色), 垂直渐变)

  const 星云 = smoothstep(0.3, 0.7, 噪声1归一).mul(0.55)
    .add(smoothstep(0.3, 0.7, 噪声2归一).mul(0.35))
    .add(smoothstep(0.3, 0.7, 噪声3归一).mul(0.15))
  const 星云色 = mix(基础色, vec3(...配置.核心色), 星云.mul(0.45))

  const 尘埃 = pow(
    smoothstep(
      0.35,
      0.65,
      sin(theta.mul(6).add(噪声1归一.mul(2))).mul(0.5).add(0.5)
    ),
    2
  ).mul(配置.尘埃带强度)
  const 尘埃色 = mix(星云色, vec3(...配置.尘埃色), 尘埃)

  const 星点种子 = hash(
    方向.x.mul(120).add(方向.y.mul(80)).add(方向.z.mul(120)).add(时间.mul(0.05))
  )
  const 星点 = step(float(配置.星点密度), 星点种子)
  const 闪烁 = sin(时间.mul(3).add(星点种子.mul(20))).mul(0.5).add(0.5)
  const 星光 = vec3(0.92, 0.95, 1).mul(星点).mul(闪烁).mul(配置.星点亮度)

  const 最终色 = clamp(尘埃色.add(星光), 0, 1)

  const 材质 = new NodeMaterial()
  材质.fog = false
  材质.lights = false
  材质.depthWrite = false
  材质.depthTest = false
  材质.side = THREE.BackSide
  材质.colorNode = 最终色

  return [时间, 材质]
}

function 创建WebGL材质() {
  const 材质 = new THREE.ShaderMaterial({
    vertexShader: 顶点着色器,
    fragmentShader: 片段着色器,
    uniforms: { uTime: { value: 0 } },
    side: THREE.BackSide,
    fog: false,
    lights: false,
    depthWrite: false,
    depthTest: false,
  })
  return [材质.uniforms.uTime, 材质]
}

export function GalaxyBackground() {
  const { gl } = useThree()
  const 网格引用 = useRef()
  const 是否WebGPU = gl.isWebGPURenderer === true
  const [时间, 材质] = useMemo(
    () => (是否WebGPU ? 创建WebGPU材质() : 创建WebGL材质()),
    [是否WebGPU]
  )

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime
    if (网格引用.current) {
      网格引用.current.rotation.y = elapsed * 配置.旋转速度
    }
    时间.value = elapsed
  })

  useEffect(() => {
    return () => {
      材质.dispose()
    }
  }, [材质])

  return (
    <mesh ref={网格引用} material={材质}>
      <sphereGeometry args={[配置.球体半径, 64, 64]} />
    </mesh>
  )
}
