import Matter from 'matter-js'

const { Engine, World, Bodies, Body, Composite, Constraint } = Matter

// 晾衣架全部物理参数集中于此。坐标系 = 晾衣架容器左上角原点的像素坐标。
export const 晾衣架配置 = {
  主绳: {
    节点数: 28, // 悬垂链节点数（两端为静态锚点）
    顶部Y: 28, // 锚点距容器顶部的距离 px
    边距比例: 0.045, // 锚点边距 = 钳制(容器宽 × 边距比例)
    边距最小: 16,
    边距最大: 48,
    悬垂深度: 36, // 初始抛物线悬垂深度 px（负载下的额外下垂由求解器自然产生）
    节点半径: 20, // 不可见，仅用于质量/惯量；节点间不自碰，重叠无影响
    密度: 0.002, // 低密度 → 轻绳，同样风力下加速快、响应灵敏
    空气摩擦: 0.05, // 高阻尼 → 轻绳随风即动、风停即稳
    跳节点跨度: 2, // 除相邻约束外再加 i→i+2 软支撑，抑制长链拉伸累积
    跳节点刚度: 1,
  },
  吊绳: {
    节数: 3, // 每条吊绳的摆动节数（不含主绳吊点）
    段长: 28, // 每节长度 px，吊绳总长 = 节数 × 段长
  },
  便签: {
    宽占比: 0.19, // 便签视觉宽 = 钳制(容器宽 × 宽占比)
    最小宽: 72,
    最大宽: 200,
    高宽比: 638 / 547, // 与卷轴底图标准.png (547×638) 一致
    碰撞体缩放: 0.72, // 碰撞体 = 羊皮卷内收纸面区域（底图边缘为波浪形留白）
    密度: 0.003, // 高密度 → 重签，同样风力下启动迟缓
    空气摩擦: 0.012, // 低阻尼 → 重签摆动悠长、有惯性
    静止角列表Deg: [-2.5, 1.8, -1.2, 2.2], // 四张便签各自的静止倾角
  },
  碰撞类: {
    便签: 0x0001, // 便签↔便签碰撞开启（防穿模）
    绳体: 0x0002, // 绳体 mask=0：不自碰、不与便签互碰（约束已保证相对位置）
  },
  吊点比例: [0.13, 0.375, 0.625, 0.87], // 四个吊点在主绳上的归一化位置
  风: {
    影响半径: 220, // 风源作用半径 px
    速度系数: 0.0011, // 鼠标速度方向分量的力系数
    径向系数: 0.0006, // 径向推斥分量的力系数
    有效期帧数: 8, // 一次 pointermove 产生的风持续作用的物理帧数
    最小速度: 0.05, // 低于此速度不产生风（px/ms）
    最大速度: 6, // 速度钳制上限，防甩动过猛
  },
  求解: {
    约束迭代: 16,
    位置迭代: 16,
    速度迭代: 8,
    固定步长Ms: 1000 / 60, // fixed-dt 累加器步长
    最大跳帧: 5, // 单帧最多补偿的物理步数
    预沉降步数: 120, // 构建后同步沉降的步数，首帧即为稳定悬垂姿态
  },
  重力Y: 1,
} as const

export interface 晾衣架视口 {
  宽: number
  高: number
}

export interface 便签位姿 {
  x: number
  y: number
  角度: number
  宽: number
  高: number
}

export interface 晾衣架快照 {
  主绳: Array<{ x: number; y: number }>
  吊绳: Array<Array<{ x: number; y: number }>>
  便签: 便签位姿[]
}

export interface 刚体检视项 {
  x: number
  y: number
  vx: number
  vy: number
  isStatic: boolean
  mass: number
  density: number
  frictionAir: number
  category: number
  mask: number
}

export interface 晾衣架检视 {
  世界刚体总数: number
  主绳节点: 刚体检视项[]
  吊绳节点: 刚体检视项[]
  便签: 刚体检视项[]
}

interface 风源 {
  x: number
  y: number
  速度x: number
  速度y: number
  强度: number
  剩余帧: number
}

interface 挂件 {
  吊点节点: Matter.Body
  吊绳节点: Matter.Body[]
  便签刚体: Matter.Body
  便签宽: number
  便签高: number
}

function 钳制(值: number, 最小: number, 最大: number): number {
  return Math.min(Math.max(值, 最小), 最大)
}

function 检视项(刚体: Matter.Body): 刚体检视项 {
  return {
    x: 刚体.position.x,
    y: 刚体.position.y,
    vx: 刚体.velocity.x,
    vy: 刚体.velocity.y,
    isStatic: 刚体.isStatic,
    mass: 刚体.mass,
    density: 刚体.density,
    frictionAir: 刚体.frictionAir,
    category: 刚体.collisionFilter.category ?? 0,
    mask: 刚体.collisionFilter.mask ?? 0,
  }
}

export class 晾衣架物理引擎 {
  private readonly engine: Matter.Engine
  private readonly 主绳节点: Matter.Body[] = []
  private readonly 挂件列表: 挂件[] = []
  private 风源队列: 风源[] = []

  constructor(视口: 晾衣架视口) {
    const 配置 = 晾衣架配置
    this.engine = Engine.create()
    this.engine.gravity.y = 配置.重力Y
    this.engine.constraintIterations = 配置.求解.约束迭代
    this.engine.positionIterations = 配置.求解.位置迭代
    this.engine.velocityIterations = 配置.求解.速度迭代

    const 绳碰 = { group: 0, category: 配置.碰撞类.绳体, mask: 0 }
    const 签碰 = { group: 0, category: 配置.碰撞类.便签, mask: 配置.碰撞类.便签 }
    const 绳参数 = {
      density: 配置.主绳.密度,
      frictionAir: 配置.主绳.空气摩擦,
      collisionFilter: 绳碰,
    }

    // 主绳：初始为抛物线悬垂形态，约束长度取初始节点间距，静置即平衡
    const 节点数 = 配置.主绳.节点数
    const 边距X = 钳制(视口.宽 * 配置.主绳.边距比例, 配置.主绳.边距最小, 配置.主绳.边距最大)
    const 可用宽 = Math.max(视口.宽 - 2 * 边距X, 1)
    for (let i = 0; i < 节点数; i++) {
      const t = i / (节点数 - 1)
      const x = 边距X + t * 可用宽
      const y = 配置.主绳.顶部Y + 4 * 配置.主绳.悬垂深度 * t * (1 - t)
      this.主绳节点.push(
        Bodies.circle(x, y, 配置.主绳.节点半径, {
          ...绳参数,
          isStatic: i === 0 || i === 节点数 - 1,
        })
      )
    }

    const 约束列表: Matter.Constraint[] = []
    const 间距 = (a: Matter.Body, b: Matter.Body) =>
      Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y)
    for (let i = 0; i < 节点数 - 1; i++) {
      约束列表.push(
        Constraint.create({
          bodyA: this.主绳节点[i],
          bodyB: this.主绳节点[i + 1],
          length: 间距(this.主绳节点[i], this.主绳节点[i + 1]),
          stiffness: 1,
        })
      )
    }
    for (let i = 0; i + 配置.主绳.跳节点跨度 < 节点数; i++) {
      约束列表.push(
        Constraint.create({
          bodyA: this.主绳节点[i],
          bodyB: this.主绳节点[i + 配置.主绳.跳节点跨度],
          length: 间距(this.主绳节点[i], this.主绳节点[i + 配置.主绳.跳节点跨度]),
          stiffness: 配置.主绳.跳节点刚度,
        })
      )
    }

    // 四组吊绳 + 便签
    const 便签宽 = 钳制(视口.宽 * 配置.便签.宽占比, 配置.便签.最小宽, 配置.便签.最大宽)
    const 便签高 = 便签宽 * 配置.便签.高宽比
    const 碰宽 = 便签宽 * 配置.便签.碰撞体缩放
    const 碰高 = 便签高 * 配置.便签.碰撞体缩放
    const 吊绳总长 = 配置.吊绳.节数 * 配置.吊绳.段长

    配置.吊点比例.forEach((比例, 索引) => {
      const 吊点 = this.主绳节点[Math.round(比例 * (节点数 - 1))]
      const 链: Matter.Body[] = []
      for (let j = 0; j < 配置.吊绳.节数; j++) {
        链.push(Bodies.circle(吊点.position.x, 吊点.position.y + (j + 1) * 配置.吊绳.段长, 配置.主绳.节点半径, 绳参数))
      }
      const 静止角 = (配置.便签.静止角列表Deg[索引 % 配置.便签.静止角列表Deg.length] * Math.PI) / 180
      const 便签刚体 = Bodies.rectangle(吊点.position.x, 吊点.position.y + 吊绳总长 + 碰高 / 2, 碰宽, 碰高, {
        density: 配置.便签.密度,
        frictionAir: 配置.便签.空气摩擦,
        angle: 静止角,
        collisionFilter: 签碰,
      })
      约束列表.push(Constraint.create({ bodyA: 吊点, bodyB: 链[0], length: 配置.吊绳.段长, stiffness: 1 }))
      for (let j = 0; j < 链.length - 1; j++) {
        约束列表.push(Constraint.create({ bodyA: 链[j], bodyB: 链[j + 1], length: 配置.吊绳.段长, stiffness: 1 }))
      }
      约束列表.push(
        Constraint.create({
          bodyA: 链[链.length - 1],
          bodyB: 便签刚体,
          pointB: { x: 0, y: -碰高 / 2 },
          length: 0,
          stiffness: 1,
          damping: 0.1,
        })
      )
      Composite.add(this.engine.world, [...链, 便签刚体])
      this.挂件列表.push({ 吊点节点: 吊点, 吊绳节点: 链, 便签刚体, 便签宽, 便签高 })
    })

    Composite.add(this.engine.world, [...this.主绳节点, ...约束列表])

    // 预沉降：让负载下垂在首帧前完成，避免入场时便签集体下坠
    for (let i = 0; i < 配置.求解.预沉降步数; i++) {
      Engine.update(this.engine, 配置.求解.固定步长Ms)
    }
    // 沉降残余摆动清零：保留沉降后的位置，从静止开始进入首帧
    for (const 刚体 of Composite.allBodies(this.engine.world)) {
      Body.setVelocity(刚体, { x: 0, y: 0 })
      Body.setAngularVelocity(刚体, 0)
    }
  }

  get 便签数量(): number {
    return this.挂件列表.length
  }

  登记风源(x: number, y: number, 速度x: number, 速度y: number, 强度: number): void {
    const 风 = 晾衣架配置.风
    const 速率 = Math.hypot(速度x, 速度y)
    if (速率 < 风.最小速度) return
    const 缩放 = 速率 > 风.最大速度 ? 风.最大速度 / 速率 : 1
    this.风源队列.push({
      x,
      y,
      速度x: 速度x * 缩放,
      速度y: 速度y * 缩放,
      强度,
      剩余帧: 风.有效期帧数,
    })
  }

  private 施加风力(刚体: Matter.Body): void {
    const 风 = 晾衣架配置.风
    for (const 源 of this.风源队列) {
      const dx = 刚体.position.x - 源.x
      const dy = 刚体.position.y - 源.y
      const 距离 = Math.hypot(dx, dy)
      if (距离 >= 风.影响半径 || 源.强度 <= 0) continue
      const 衰减 = (1 - 距离 / 风.影响半径) ** 2
      const 径向X = 距离 > 0.001 ? dx / 距离 : 0
      const 径向Y = 距离 > 0.001 ? dy / 距离 : 0
      const 速率 = Math.hypot(源.速度x, 源.速度y)
      Body.applyForce(刚体, 刚体.position, {
        x: 源.强度 * 衰减 * (源.速度x * 风.速度系数 + 径向X * 速率 * 风.径向系数),
        y: 源.强度 * 衰减 * (源.速度y * 风.速度系数 + 径向Y * 速率 * 风.径向系数),
      })
    }
  }

  步进(): void {
    if (this.风源队列.length > 0) {
      for (const 节点 of this.主绳节点) {
        if (!节点.isStatic) this.施加风力(节点)
      }
      for (const 挂件 of this.挂件列表) {
        for (const 节点 of 挂件.吊绳节点) {
          this.施加风力(节点)
        }
        this.施加风力(挂件.便签刚体)
      }
      for (const 源 of this.风源队列) {
        源.剩余帧 -= 1
      }
      this.风源队列 = this.风源队列.filter((源) => 源.剩余帧 > 0)
    }
    Engine.update(this.engine, 晾衣架配置.求解.固定步长Ms)
  }

  获取快照(): 晾衣架快照 {
    return {
      主绳: this.主绳节点.map((n) => ({ x: n.position.x, y: n.position.y })),
      吊绳: this.挂件列表.map((挂件) => [
        { x: 挂件.吊点节点.position.x, y: 挂件.吊点节点.position.y },
        ...挂件.吊绳节点.map((n) => ({ x: n.position.x, y: n.position.y })),
      ]),
      便签: this.挂件列表.map((挂件) => ({
        x: 挂件.便签刚体.position.x,
        y: 挂件.便签刚体.position.y,
        角度: 挂件.便签刚体.angle,
        宽: 挂件.便签宽,
        高: 挂件.便签高,
      })),
    }
  }

  获取刚体检视(): 晾衣架检视 {
    return {
      世界刚体总数: Composite.allBodies(this.engine.world).length,
      主绳节点: this.主绳节点.map(检视项),
      吊绳节点: this.挂件列表.flatMap((挂件) => 挂件.吊绳节点.map(检视项)),
      便签: this.挂件列表.map((挂件) => 检视项(挂件.便签刚体)),
    }
  }

  // 仅供单元测试驱碰撞行为使用
  调试位移便签(索引: number, x: number, y: number): void {
    const 挂件 = this.挂件列表[索引]
    if (!挂件) return
    Body.setPosition(挂件.便签刚体, { x, y })
  }

  销毁(): void {
    World.clear(this.engine.world, false)
    Engine.clear(this.engine)
    this.主绳节点.length = 0
    this.挂件列表.length = 0
    this.风源队列 = []
  }
}
