import { skillGroups } from '../../data/skills'
import { SECTION_META } from '../../domain/constants'
import type { Vector3Tuple } from 'three'

export interface 技能节点 {
  编号: number
  名称键: string
  分类: string
  位置: Vector3Tuple
  颜色: string
  大小: number
}

export interface 星系数据 {
  技能节点: 技能节点[]
  背景粒子位置: Float32Array
  背景粒子颜色: Float32Array
  连线位置: Float32Array
  连线颜色: Float32Array
}

interface 分类聚类 {
  角度: number
  半径: number
}

const 分类聚类表: Record<string, 分类聚类> = {
  it: { 角度: 0, 半径: 2.2 },
  edu: { 角度: 1.25, 半径: 2.8 },
  design: { 角度: 2.5, 半径: 2.4 },
  music: { 角度: 3.75, 半径: 2.6 },
  media: { 角度: 5.0, 半径: 2.5 },
}

function 字符串哈希(输入: string): number {
  let 哈希 = 0
  for (let 索引 = 0; 索引 < 输入.length; 索引 += 1) {
    const 字符 = 输入.charCodeAt(索引)
    哈希 = (哈希 << 5) - 哈希 + 字符
    哈希 |= 0
  }
  return 哈希
}

function 伪随机(种子: number): number {
  const 值 = Math.sin(种子 * 12.9898) * 43758.5453
  return 值 - Math.floor(值)
}

function 技能位置(分类: string, 名称键: string, 索引: number): Vector3Tuple {
  const 聚类 = 分类聚类表[分类] ?? { 角度: 0, 半径: 2.5 }
  const 哈希 = 字符串哈希(名称键)
  const 基数角度 = 聚类.角度 + 索引 * 0.35 + 伪随机(哈希) * 0.6
  const 基数半径 = 聚类.半径 + 伪随机(哈希 + 1) * 1.2
  const 高度 = (伪随机(哈希 + 2) - 0.5) * 2.5
  const 扩散 = 0.3

  const x = Math.cos(基数角度) * 基数半径 + (伪随机(哈希 + 3) - 0.5) * 扩散
  const y = 高度 + (伪随机(哈希 + 4) - 0.5) * 扩散
  const z = Math.sin(基数角度) * 基数半径 + (伪随机(哈希 + 5) - 0.5) * 扩散

  return [x, y, z]
}

function 解析颜色(十六进制: string): [number, number, number] {
  const 规范化 = 十六进制.replace('#', '')
  const r = parseInt(规范化.slice(0, 2), 16) / 255
  const g = parseInt(规范化.slice(2, 4), 16) / 255
  const b = parseInt(规范化.slice(4, 6), 16) / 255
  return [r, g, b]
}

export function 生成星系数据(粒子数量: number): 星系数据 {
  const 技能节点: 技能节点[] = []
  let 编号 = 0

  for (const 组 of skillGroups) {
    const 元信息 = SECTION_META[组.category as keyof typeof SECTION_META]
    const 颜色 = 元信息?.color ?? '#ffffff'

    for (let 索引 = 0; 索引 < 组.items.length; 索引 += 1) {
      const 名称键 = 组.items[索引]
      const 大小 = 0.06 + 伪随机(字符串哈希(名称键) + 10) * 0.06
      技能节点.push({
        编号,
        名称键,
        分类: 组.category,
        位置: 技能位置(组.category, 名称键, 索引),
        颜色,
        大小,
      })
      编号 += 1
    }
  }

  const 背景粒子位置 = new Float32Array(粒子数量 * 3)
  const 背景粒子颜色 = new Float32Array(粒子数量 * 3)

  for (let 索引 = 0; 索引 < 粒子数量; 索引 += 1) {
    const 半径 = 3 + 伪随机(索引) * 9
    const 角度 = 伪随机(索引 + 1000) * Math.PI * 2
    const 高度 = (伪随机(索引 + 2000) - 0.5) * 半径 * 0.6

    背景粒子位置[索引 * 3] = Math.cos(角度) * 半径
    背景粒子位置[索引 * 3 + 1] = 高度
    背景粒子位置[索引 * 3 + 2] = Math.sin(角度) * 半径

    const 冷暖 = 伪随机(索引 + 3000)
    const 亮度 = 0.5 + 伪随机(索引 + 4000) * 0.5
    if (冷暖 < 0.33) {
      背景粒子颜色[索引 * 3] = 0.6 * 亮度
      背景粒子颜色[索引 * 3 + 1] = 0.85 * 亮度
      背景粒子颜色[索引 * 3 + 2] = 1 * 亮度
    } else if (冷暖 < 0.66) {
      背景粒子颜色[索引 * 3] = 0.85 * 亮度
      背景粒子颜色[索引 * 3 + 1] = 0.5 * 亮度
      背景粒子颜色[索引 * 3 + 2] = 1 * 亮度
    } else {
      背景粒子颜色[索引 * 3] = 1 * 亮度
      背景粒子颜色[索引 * 3 + 1] = 0.7 * 亮度
      背景粒子颜色[索引 * 3 + 2] = 0.8 * 亮度
    }
  }

  const 连线位置: number[] = []
  const 连线颜色: number[] = []
  const 最大距离 = 1.6

  for (let i = 0; i < 技能节点.length; i += 1) {
    const 节点A = 技能节点[i]
    const [ax, ay, az] = 节点A.位置
    const [ar, ag, ab] = 解析颜色(节点A.颜色)

    for (let j = i + 1; j < 技能节点.length; j += 1) {
      const 节点B = 技能节点[j]
      const [bx, by, bz] = 节点B.位置
      const dx = ax - bx
      const dy = ay - by
      const dz = az - bz
      const 距离 = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (距离 <= 最大距离) {
        const [br, bg, bb] = 解析颜色(节点B.颜色)
        const 强度 = 1 - 距离 / 最大距离
        const r = (ar + br) * 0.5
        const g = (ag + bg) * 0.5
        const b = (ab + bb) * 0.5

        连线位置.push(ax, ay, az, bx, by, bz)
        连线颜色.push(r * 强度, g * 强度, b * 强度, r * 强度, g * 强度, b * 强度)
      }
    }
  }

  return {
    技能节点,
    背景粒子位置,
    背景粒子颜色,
    连线位置: new Float32Array(连线位置),
    连线颜色: new Float32Array(连线颜色),
  }
}
