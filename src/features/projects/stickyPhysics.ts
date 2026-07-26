import Matter from 'matter-js'

const { Engine, World, Bodies, Body, Composite, Constraint } = Matter

export interface 便签配置 {
  便签ID: string
  锚点X: number
  锚点Y: number
  绳长: number
  绳节点数: number
  便签宽: number
  便签高: number
  静止角Deg: number
  最大偏移Deg: number
  索引: number
}

export interface 便签姿态 {
  便签ID: string
  便签X: number
  便签Y: number
  便签宽: number
  便签高: number
  角度: number
  绳子节点: Array<{ x: number; y: number }>
}

export type 姿态回调 = (姿态列表: 便签姿态[]) => void

const 重力Y = 1
const 节点半径 = 2
// 绳节点质量必须与便签质量在同一量级，否则重便签会把轻绳节点整条拉伸下坠。
// 便签质量 ≈ 便签密度 × 面积(≈4.5万) ≈ 40；绳节点质量 = 节点密度 × πr²。
// 取 节点密度 0.9 使单个节点质量 ≈ 11，与便签同量级，约束不再被拉爆。
const 节点密度 = 0.9
const 节点阻尼 = 0.28
const 便签密度 = 0.0009
const 便签阻尼 = 0.08
// 刚性约束：绳段与"绳-便签"连接均取满刚度，配合高迭代求解器保证悬挂位置精确。
const 绳约束刚度 = 1
const 绳便签约束刚度 = 1
const 绳便签约束阻尼 = 0.1
// 求解器迭代次数——刚性长链 + 重物需要更高迭代才能收敛到正确悬挂位置。
const 约束迭代次数 = 12
const 位置迭代次数 = 12
const 速度迭代次数 = 8
const 环境风强度 = 0.0000045
const 环境风频率 = 0.0009
const 鼠标力系数 = 0.00012
const 鼠标最小速度 = 0.03
const 默认最大帧间隔 = 16.666
// 所有便签共享同一物理世界，但它们生成于各自容器坐标系中的相同相对位置
// （锚点X=容器宽/2）。若允许碰撞，多个刚体会在世界中互相弹开、四散下坠。
// 本模拟为纯悬挂效果，不需要刚体间碰撞，故用同一负碰撞组令所有刚体永不相撞。
const 非碰撞组 = -1
const 非碰撞过滤 = { group: 非碰撞组 } as const

interface 便签内部数据 {
  配置: 便签配置
  便签刚体: Matter.Body
  绳节点: Matter.Body[]
  锚点: Matter.Body
  上次鼠标时间: number
  上次鼠标X: number
  上次鼠标Y: number
}

function 角度限制(角度: number, 静止角Rad: number, 最大偏移Rad: number): number {
  const 最小 = 静止角Rad - 最大偏移Rad
  const 最大 = 静止角Rad + 最大偏移Rad
  if (角度 < 最小) return 最小
  if (角度 > 最大) return 最大
  return 角度
}

export class 便签物理引擎 {
  private readonly engine: Matter.Engine
  private readonly 便签集合: Map<string, 便签内部数据> = new Map()
  private rafId: number | null = null
  private 上次帧时间: number = 0
  private 暂停: boolean = false
  private 可见: boolean = true
  private 姿态回调: 姿态回调 | null = null

  constructor() {
    this.engine = Engine.create()
    this.engine.gravity.y = 重力Y
    this.engine.constraintIterations = 约束迭代次数
    this.engine.positionIterations = 位置迭代次数
    this.engine.velocityIterations = 速度迭代次数
  }

  添加便签(配置: 便签配置): void {
    if (this.便签集合.has(配置.便签ID)) return

    const { 锚点X, 锚点Y, 绳长, 绳节点数, 便签宽, 便签高, 静止角Deg } = 配置
    const 静止角Rad = (静止角Deg * Math.PI) / 180
    const 分段长 = 绳长 / 绳节点数

    const 锚点 = Bodies.circle(锚点X, 锚点Y, 节点半径, {
      isStatic: true,
      frictionAir: 0,
      collisionFilter: 非碰撞过滤,
    })

    const 绳节点: Matter.Body[] = []
    for (let i = 0; i < 绳节点数; i++) {
      const 节点Y = 锚点Y + (i + 1) * 分段长
      const node = Bodies.circle(锚点X, 节点Y, 节点半径, {
        density: 节点密度,
        frictionAir: 节点阻尼,
        collisionFilter: 非碰撞过滤,
      })
      绳节点.push(node)
    }

    const 便签X = 锚点X
    const 便签Y = 锚点Y + 绳长 + 便签高 / 2
    const 便签刚体 = Bodies.rectangle(便签X, 便签Y, 便签宽, 便签高, {
      density: 便签密度,
      frictionAir: 便签阻尼,
      angle: 静止角Rad,
      collisionFilter: 非碰撞过滤,
    })

    const 约束列表: Matter.Constraint[] = []
    约束列表.push(
      Constraint.create({
        bodyA: 锚点,
        bodyB: 绳节点[0],
        length: 分段长,
        stiffness: 绳约束刚度,
      })
    )
    for (let i = 0; i < 绳节点.length - 1; i++) {
      约束列表.push(
        Constraint.create({
          bodyA: 绳节点[i],
          bodyB: 绳节点[i + 1],
          length: 分段长,
          stiffness: 绳约束刚度,
        })
      )
    }
    const 末端节点 = 绳节点[绳节点.length - 1]
    约束列表.push(
      Constraint.create({
        bodyA: 末端节点,
        bodyB: 便签刚体,
        pointA: { x: 0, y: 0 },
        pointB: { x: 0, y: -便签高 / 2 },
        length: 0,
        stiffness: 绳便签约束刚度,
        damping: 绳便签约束阻尼,
      })
    )

    Composite.add(this.engine.world, [锚点, ...绳节点, 便签刚体, ...约束列表])

    this.便签集合.set(配置.便签ID, {
      配置,
      便签刚体,
      绳节点,
      锚点,
      上次鼠标时间: 0,
      上次鼠标X: 0,
      上次鼠标Y: 0,
    })
  }

  移除便签(便签ID: string): void {
    const 数据 = this.便签集合.get(便签ID)
    if (!数据) return
    Composite.remove(this.engine.world, 数据.便签刚体)
    for (const node of 数据.绳节点) {
      Composite.remove(this.engine.world, node)
    }
    Composite.remove(this.engine.world, 数据.锚点)
    this.便签集合.delete(便签ID)
  }

  施加鼠标力(便签ID: string, 鼠标X: number, 鼠标Y: number): void {
    const 数据 = this.便签集合.get(便签ID)
    if (!数据) return
    const 现在 = performance.now()
    if (数据.上次鼠标时间 > 0) {
      const dt = Math.max(现在 - 数据.上次鼠标时间, 1)
      const vx = (鼠标X - 数据.上次鼠标X) / dt
      const vy = (鼠标Y - 数据.上次鼠标Y) / dt
      const 速度 = Math.sqrt(vx * vx + vy * vy)
      if (速度 > 鼠标最小速度) {
        const 力X = vx * 鼠标力系数
        const 力Y = vy * 鼠标力系数 * 0.5
        Body.applyForce(数据.便签刚体, 数据.便签刚体.position, { x: 力X, y: 力Y })
      }
    }
    数据.上次鼠标X = 鼠标X
    数据.上次鼠标Y = 鼠标Y
    数据.上次鼠标时间 = 现在
  }

  重置鼠标状态(便签ID: string): void {
    const 数据 = this.便签集合.get(便签ID)
    if (!数据) return
    数据.上次鼠标时间 = 0
  }

  获取姿态(便签ID: string): 便签姿态 | null {
    const 数据 = this.便签集合.get(便签ID)
    if (!数据) return null
    const { 便签刚体, 绳节点, 锚点, 配置 } = 数据
    const 静止角Rad = (配置.静止角Deg * Math.PI) / 180
    const 最大偏移Rad = (配置.最大偏移Deg * Math.PI) / 180
    let 角度 = 便签刚体.angle
    const 限制后角度 = 角度限制(角度, 静止角Rad, 最大偏移Rad)
    if (限制后角度 !== 角度) {
      Body.setAngle(便签刚体, 限制后角度)
      Body.setAngularVelocity(便签刚体, 0)
      角度 = 限制后角度
    }
    return {
      便签ID,
      便签X: 便签刚体.position.x,
      便签Y: 便签刚体.position.y,
      便签宽: 配置.便签宽,
      便签高: 配置.便签高,
      角度,
      绳子节点: [
        { x: 锚点.position.x, y: 锚点.position.y },
        ...绳节点.map((n) => ({ x: n.position.x, y: n.position.y })),
      ],
    }
  }

  获取所有姿态(): 便签姿态[] {
    const 结果: 便签姿态[] = []
    for (const id of this.便签集合.keys()) {
      const 姿态 = this.获取姿态(id)
      if (姿态) 结果.push(姿态)
    }
    return 结果
  }

  设置姿态回调(回调: 姿态回调 | null): void {
    this.姿态回调 = 回调
  }

  private 应用环境风(时间戳: number): void {
    for (const 数据 of this.便签集合.values()) {
      const 风力 = Math.sin(时间戳 * 环境风频率 + 数据.配置.索引) * 环境风强度
      Body.applyForce(数据.便签刚体, 数据.便签刚体.position, { x: 风力, y: 0 })
    }
  }

  步进(dt: number): void {
    if (this.暂停 || !this.可见) return
    const delta = Math.min(dt, 默认最大帧间隔)
    Engine.update(this.engine, delta)
    this.应用环境风(performance.now())
    if (this.姿态回调) {
      this.姿态回调(this.获取所有姿态())
    }
  }

  启动(): void {
    if (this.rafId !== null) return
    if (this.便签集合.size === 0) return
    this.暂停 = false
    this.可见 = true
    this.上次帧时间 = performance.now()
    const tick = () => {
      const 现在 = performance.now()
      const dt = 现在 - this.上次帧时间
      this.上次帧时间 = 现在
      this.步进(dt)
      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  停止(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  设置可见(可见: boolean): void {
    this.可见 = 可见
    if (!可见) {
      this.停止()
    } else if (this.便签集合.size > 0 && this.姿态回调) {
      this.启动()
    }
  }

  设置暂停(暂停: boolean): void {
    this.暂停 = 暂停
  }

  销毁(): void {
    this.停止()
    World.clear(this.engine.world, false)
    Engine.clear(this.engine)
    this.便签集合.clear()
    this.姿态回调 = null
  }
}

export function 创建默认便签配置(参数: {
  便签ID: string
  容器宽: number
  绳长: number
  静止角Deg: number
  索引: number
}): 便签配置 {
  const { 便签ID, 容器宽, 绳长, 静止角Deg, 索引 } = 参数
  const 便签高 = 容器宽 * (841 / 800)
  return {
    便签ID,
    锚点X: 容器宽 / 2,
    锚点Y: 0,
    绳长,
    绳节点数: 6,
    便签宽: 容器宽,
    便签高,
    静止角Deg,
    最大偏移Deg: 8,
    索引,
  }
}

export const 物理常量 = {
  重力Y,
  节点半径,
  节点密度,
  节点阻尼,
  便签密度,
  便签阻尼,
  绳约束刚度,
  绳便签约束刚度,
  环境风强度,
  环境风频率,
  鼠标力系数,
  默认最大帧间隔,
} as const
