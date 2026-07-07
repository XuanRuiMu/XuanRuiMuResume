import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  ChromaticAberration,
  Vignette,
  Noise,
  ToneMapping,
} from '@react-three/postprocessing'

import { useTheaterStore } from '../store/useTheaterStore'

const 章节顺序 = ['it', 'edu', 'design', 'music', 'media']
const 实体半径 = 5.6

const 后期配置 = {
  bloom: {
    基础强度: 0.55,
    悬停强度: 0.75,
    激活强度: 0.9,
    亮度阈值: 0.55,
    亮度平滑: 0.5,
    模糊半径: 0.85,
    mip层级: 8,
  },
  depthOfField: {
    焦点范围: 3.2,
    焦外尺度: 2.2,
    分辨率缩放: 0.5,
  },
  chromaticAberration: {
    基础偏移: [0.0012, 0.0008],
    悬停偏移: [0.0025, 0.0015],
    激活偏移: [0.0035, 0.002],
  },
  vignette: {
    偏移: 0.05,
    暗度: 0.65,
  },
  noise: {
    不透明度: 0.035,
  },
  toneMapping: {
    模式: 7,
    白点: 4.0,
    中灰: 0.6,
  },
}

function 计算章节目标位置(章节) {
  if (!章节) return new THREE.Vector3(0, 0, 0)
  const 索引 = 章节顺序.indexOf(章节)
  if (索引 < 0) return new THREE.Vector3(0, 0, 0)
  const 角度 = (索引 * 72 - 90) * (Math.PI / 180)
  return new THREE.Vector3(Math.cos(角度) * 实体半径, 0, Math.sin(角度) * 实体半径)
}

export function PostProcessingStack() {
  const { gl } = useThree()
  const activeSection = useTheaterStore((s) => s.activeSection)
  const hoveredSection = useTheaterStore((s) => s.hoveredSection)

  const 目标章节 = activeSection || hoveredSection
  const 目标位置 = useMemo(() => 计算章节目标位置(目标章节), [目标章节])
  const 插值目标 = useRef(目标位置.clone())

  useFrame(() => {
    插值目标.current.lerp(目标位置, 0.08)
  })

  const 是否WebGPU = gl.isWebGPURenderer === true
  if (是否WebGPU) return null

  const bloom强度 = activeSection
    ? 后期配置.bloom.激活强度
    : hoveredSection
      ? 后期配置.bloom.悬停强度
      : 后期配置.bloom.基础强度

  const 色散偏移 = activeSection
    ? 后期配置.chromaticAberration.激活偏移
    : hoveredSection
      ? 后期配置.chromaticAberration.悬停偏移
      : 后期配置.chromaticAberration.基础偏移

  return (
    <EffectComposer depthBuffer>
      <Bloom
        intensity={bloom强度}
        luminanceThreshold={后期配置.bloom.亮度阈值}
        luminanceSmoothing={后期配置.bloom.亮度平滑}
        mipmapBlur
        radius={后期配置.bloom.模糊半径}
        levels={后期配置.bloom.mip层级}
      />
      <DepthOfField
        target={插值目标.current}
        focusRange={后期配置.depthOfField.焦点范围}
        bokehScale={后期配置.depthOfField.焦外尺度}
        resolutionScale={后期配置.depthOfField.分辨率缩放}
      />
      <ChromaticAberration offset={色散偏移} radialModulation />
      <Vignette eskil={false} offset={后期配置.vignette.偏移} darkness={后期配置.vignette.暗度} />
      <Noise opacity={后期配置.noise.不透明度} />
      <ToneMapping
        mode={后期配置.toneMapping.模式}
        whitePoint={后期配置.toneMapping.白点}
        middleGrey={后期配置.toneMapping.中灰}
      />
    </EffectComposer>
  )
}
