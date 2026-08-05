import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 晾衣架物理引擎, 晾衣架配置 } from './clotheslinePhysics'

const 测试视口 = { 宽: 1000, 高: 480 }

describe('晾衣架物理引擎 - 世界结构', () => {
  let 引擎: 晾衣架物理引擎

  beforeEach(() => {
    引擎 = new 晾衣架物理引擎(测试视口)
  })

  afterEach(() => {
    引擎.销毁()
  })

  it('主绳、吊绳、便签存在于同一物理世界', () => {
    const 检视 = 引擎.获取刚体检视()
    const 总数 = 检视.主绳节点.length + 检视.吊绳节点.length + 检视.便签.length
    expect(检视.世界刚体总数).toBe(总数)
    expect(检视.世界刚体总数).toBeGreaterThan(0)
  })

  it('主绳由多个轻节点组成且两端锚定', () => {
    const 检视 = 引擎.获取刚体检视()
    expect(检视.主绳节点.length).toBe(晾衣架配置.主绳.节点数)
    expect(检视.主绳节点[0].isStatic).toBe(true)
    expect(检视.主绳节点[检视.主绳节点.length - 1].isStatic).toBe(true)
    for (let i = 1; i < 检视.主绳节点.length - 1; i++) {
      expect(检视.主绳节点[i].isStatic).toBe(false)
    }
  })

  it('四条吊绳各挂一张便签', () => {
    const 检视 = 引擎.获取刚体检视()
    expect(检视.便签.length).toBe(4)
    expect(检视.吊绳节点.length).toBe(4 * 晾衣架配置.吊绳.节数)
  })

  it('主绳自然悬垂：中点低于两端', () => {
    const 快照 = 引擎.获取快照()
    const 首 = 快照.主绳[0]
    const 尾 = 快照.主绳[快照.主绳.length - 1]
    const 中点 = 快照.主绳[Math.floor(快照.主绳.length / 2)]
    expect(中点.y).toBeGreaterThan(首.y)
    expect(中点.y).toBeGreaterThan(尾.y)
  })

  it('便签悬挂在对应吊点下方', () => {
    const 快照 = 引擎.获取快照()
    for (let i = 0; i < 快照.便签.length; i++) {
      const 吊绳 = 快照.吊绳[i]
      const 吊点 = 吊绳[0]
      const 便签 = 快照.便签[i]
      expect(便签.y).toBeGreaterThan(吊点.y)
      const 吊绳末端 = 吊绳[吊绳.length - 1]
      // 碰撞体小于视觉便签（取羊皮卷内收纸面），吊绳末端没入便签顶部卷边后方
      expect(吊绳末端.y).toBeGreaterThan(便签.y - 便签.高 / 2)
      expect(吊绳末端.y).toBeLessThan(便签.y)
    }
  })
})

describe('晾衣架物理引擎 - 碰撞过滤', () => {
  let 引擎: 晾衣架物理引擎

  beforeEach(() => {
    引擎 = new 晾衣架物理引擎(测试视口)
  })

  afterEach(() => {
    引擎.销毁()
  })

  it('便签之间碰撞开启（category/mask 互相包含）', () => {
    const 检视 = 引擎.获取刚体检视()
    for (const 便签 of 检视.便签) {
      expect(便签.category & 晾衣架配置.碰撞类.便签).toBe(晾衣架配置.碰撞类.便签)
      expect(便签.mask & 晾衣架配置.碰撞类.便签).toBe(晾衣架配置.碰撞类.便签)
    }
  })

  it('绳体不自碰且不与便签互碰', () => {
    const 检视 = 引擎.获取刚体检视()
    const 全部绳 = [...检视.主绳节点, ...检视.吊绳节点]
    for (const 节点 of 全部绳) {
      expect(节点.category & 晾衣架配置.碰撞类.绳体).toBe(晾衣架配置.碰撞类.绳体)
      expect(节点.mask).toBe(0)
    }
    for (const 便签 of 检视.便签) {
      expect(便签.mask & 晾衣架配置.碰撞类.绳体).toBe(0)
    }
  })

  it('两张便签被推重叠后会被碰撞分开', () => {
    const 快照前 = 引擎.获取快照()
    const 便签宽 = 快照前.便签[0].宽
    引擎.调试位移便签(1, 快照前.便签[0].x + 便签宽 * 0.3, 快照前.便签[0].y)
    for (let i = 0; i < 90; i++) {
      引擎.步进()
    }
    const 快照后 = 引擎.获取快照()
    const 间距 = Math.abs(快照后.便签[1].x - 快照后.便签[0].x)
    expect(间距).toBeGreaterThan(便签宽 * 0.3)
  })
})

describe('晾衣架物理引擎 - 质量差异', () => {
  let 引擎: 晾衣架物理引擎

  beforeEach(() => {
    引擎 = new 晾衣架物理引擎(测试视口)
  })

  afterEach(() => {
    引擎.销毁()
  })

  it('便签密度低于绳节点密度但绝对质量仍远大于单绳节点（轻签不压垮绳系）', () => {
    const 检视 = 引擎.获取刚体检视()
    const 绳节点 = 检视.主绳节点[5]
    const 便签 = 检视.便签[0]
    expect(便签.density).toBeLessThan(绳节点.density)
    expect(便签.mass).toBeGreaterThan(绳节点.mass * 10)
  })

  it('绳节点阻尼大于便签（轻绳风停即稳、轻签摆动悠长）', () => {
    const 检视 = 引擎.获取刚体检视()
    const 绳节点 = 检视.主绳节点[5]
    const 便签 = 检视.便签[0]
    expect(绳节点.frictionAir).toBeGreaterThan(便签.frictionAir)
  })

  it('轻绳对单次风脉冲有即时响应', () => {
    const 快照 = 引擎.获取快照()
    const 中点 = 快照.主绳[Math.floor(快照.主绳.length / 2)]
    引擎.登记风源(中点.x, 中点.y, 3, 0, 1)
    引擎.步进()
    const 检视 = 引擎.获取刚体检视()
    expect(Math.abs(检视.主绳节点[14].vx)).toBeGreaterThan(0)
  })

  it('风停后轻便签仍因低阻尼保持明显摆动（衰减慢于高阻尼体）', () => {
    const 快照 = 引擎.获取快照()
    const 吊点 = 快照.吊绳[0][0]
    for (let i = 0; i < 10; i++) {
      引擎.登记风源(吊点.x, 吊点.y, 3, 0, 1)
      引擎.步进()
    }
    const 停风时 = 引擎.获取刚体检视()
    const 停风签速 = Math.hypot(停风时.便签[0].vx, 停风时.便签[0].vy)
    expect(停风签速).toBeGreaterThan(0.05)
    for (let i = 0; i < 15; i++) {
      引擎.步进()
    }
    const 衰减后 = 引擎.获取刚体检视()
    const 衰减签速 = Math.hypot(衰减后.便签[0].vx, 衰减后.便签[0].vy)
    // 轻签惯性弱于重签，但低阻尼（0.012）仍使其 15 帧（约 0.25s）后保留明显摆速；高阻尼刚体此时应已近静止
    expect(衰减签速).toBeGreaterThan(停风签速 * 0.2)
  })
})

describe('晾衣架物理引擎 - 风力', () => {
  let 引擎: 晾衣架物理引擎

  beforeEach(() => {
    引擎 = new 晾衣架物理引擎(测试视口)
  })

  afterEach(() => {
    引擎.销毁()
  })

  it('风作用于影响半径内的主绳节点（绳子会晃）', () => {
    const 快照 = 引擎.获取快照()
    const 目标 = 快照.主绳[10]
    const 检视前 = 引擎.获取刚体检视()
    const 前速度 = Math.abs(检视前.主绳节点[10].vx) + Math.abs(检视前.主绳节点[10].vy)
    for (let i = 0; i < 5; i++) {
      引擎.登记风源(目标.x, 目标.y, 4, 1, 1)
      引擎.步进()
    }
    const 检视后 = 引擎.获取刚体检视()
    const 后速度 = Math.abs(检视后.主绳节点[10].vx) + Math.abs(检视后.主绳节点[10].vy)
    expect(后速度).toBeGreaterThan(前速度)
  })

  it('风力具有空间局部性：远处刚体响应远小于近处刚体', () => {
    // 晾衣架是连通结构，远端刚体仍会通过主绳传递轻微振动，故断言局部性比值而非绝对为零
    const 快照 = 引擎.获取快照()
    const 近端 = 快照.便签[0]
    const 远端便签索引 = 快照.便签.length - 1
    for (let i = 0; i < 5; i++) {
      引擎.登记风源(近端.x, 近端.y, 5, 0, 1)
      引擎.步进()
    }
    const 检视 = 引擎.获取刚体检视()
    const 近速 = Math.abs(检视.便签[0].vx)
    const 远速 = Math.abs(检视.便签[远端便签索引].vx)
    expect(近速).toBeGreaterThan(远速 * 3)
  })

  it('风力强度缩放生效：强度 0 时刚体不动', () => {
    const 快照 = 引擎.获取快照()
    const 中点 = 快照.主绳[14]
    for (let i = 0; i < 5; i++) {
      引擎.登记风源(中点.x, 中点.y, 5, 0, 0)
      引擎.步进()
    }
    const 检视 = 引擎.获取刚体检视()
    expect(Math.abs(检视.主绳节点[14].vx)).toBeLessThan(0.01)
  })

  it('风源超过有效期后自动失效', () => {
    const 快照 = 引擎.获取快照()
    const 中点 = 快照.主绳[14]
    引擎.登记风源(中点.x, 中点.y, 5, 0, 1)
    for (let i = 0; i < 30; i++) {
      引擎.步进()
    }
    const 检视 = 引擎.获取刚体检视()
    const 速度 = Math.abs(检视.主绳节点[14].vx) + Math.abs(检视.主绳节点[14].vy)
    expect(速度).toBeLessThan(0.5)
  })
})

describe('晾衣架物理引擎 - 快照与销毁', () => {
  it('快照包含主绳点列、四条吊绳点列与四张便签位姿', () => {
    const 引擎 = new 晾衣架物理引擎(测试视口)
    const 快照 = 引擎.获取快照()
    expect(快照.主绳.length).toBe(晾衣架配置.主绳.节点数)
    expect(快照.吊绳.length).toBe(4)
    for (const 吊绳 of 快照.吊绳) {
      expect(吊绳.length).toBe(晾衣架配置.吊绳.节数 + 1)
    }
    expect(快照.便签.length).toBe(4)
    for (const 便签 of 快照.便签) {
      expect(Number.isFinite(便签.x)).toBe(true)
      expect(Number.isFinite(便签.y)).toBe(true)
      expect(Number.isFinite(便签.角度)).toBe(true)
      expect(便签.宽).toBeGreaterThan(0)
      expect(便签.高).toBeGreaterThan(0)
    }
    引擎.销毁()
  })

  it('便签宽高比与卷轴底图一致', () => {
    const 引擎 = new 晾衣架物理引擎(测试视口)
    const 快照 = 引擎.获取快照()
    for (const 便签 of 快照.便签) {
      expect(便签.高 / 便签.宽).toBeCloseTo(638 / 547, 2)
    }
    引擎.销毁()
  })

  it('销毁后世界被清空', () => {
    const 引擎 = new 晾衣架物理引擎(测试视口)
    引擎.销毁()
    const 检视 = 引擎.获取刚体检视()
    expect(检视.世界刚体总数).toBe(0)
  })

  it('小宽度视口下便签尺寸随视口收缩', () => {
    const 窄引擎 = new 晾衣架物理引擎({ 宽: 400, 高: 480 })
    const 宽引擎 = new 晾衣架物理引擎({ 宽: 1200, 高: 480 })
    const 窄快照 = 窄引擎.获取快照()
    const 宽快照 = 宽引擎.获取快照()
    expect(窄快照.便签[0].宽).toBeLessThan(宽快照.便签[0].宽)
    窄引擎.销毁()
    宽引擎.销毁()
  })
})
