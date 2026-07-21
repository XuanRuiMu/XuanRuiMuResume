import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 便签物理引擎, 创建默认便签配置, type 便签配置 } from './stickyPhysics'

function 创建测试配置(覆盖?: Partial<便签配置>): 便签配置 {
  return {
    便签ID: 'test-1',
    锚点X: 100,
    锚点Y: 0,
    绳长: 64,
    绳节点数: 6,
    便签宽: 200,
    便签高: 210,
    静止角Deg: -2.5,
    最大偏移Deg: 8,
    索引: 0,
    ...覆盖,
  }
}

describe('便签物理引擎', () => {
  let 引擎: 便签物理引擎

  beforeEach(() => {
    引擎 = new 便签物理引擎()
  })

  afterEach(() => {
    引擎.销毁()
  })

  it('添加便签后能获取初始姿态', () => {
    const 配置 = 创建测试配置()
    引擎.添加便签(配置)
    const 姿态 = 引擎.获取姿态('test-1')
    expect(姿态).not.toBeNull()
    expect(姿态?.便签ID).toBe('test-1')
    expect(姿态?.便签宽).toBe(200)
    expect(姿态?.便签高).toBe(210)
    expect(姿态?.绳子节点.length).toBe(7)
    expect(姿态?.角度).toBeCloseTo((-2.5 * Math.PI) / 180, 5)
  })

  it('未添加便签时获取姿态返回 null', () => {
    const 姿态 = 引擎.获取姿态('nonexistent')
    expect(姿态).toBeNull()
  })

  it('获取所有姿态返回所有便签', () => {
    引擎.添加便签(创建测试配置({ 便签ID: 'a', 索引: 0 }))
    引擎.添加便签(创建测试配置({ 便签ID: 'b', 索引: 1 }))
    const 所有姿态 = 引擎.获取所有姿态()
    expect(所有姿态.length).toBe(2)
    expect(所有姿态.some((p) => p.便签ID === 'a')).toBe(true)
    expect(所有姿态.some((p) => p.便签ID === 'b')).toBe(true)
  })

  it('重复添加同一便签ID被忽略', () => {
    const 配置 = 创建测试配置({ 便签ID: 'dup' })
    引擎.添加便签(配置)
    引擎.添加便签(配置)
    const 所有姿态 = 引擎.获取所有姿态()
    expect(所有姿态.length).toBe(1)
  })

  it('移除便签后无法获取姿态', () => {
    引擎.添加便签(创建测试配置({ 便签ID: 'removable' }))
    expect(引擎.获取姿态('removable')).not.toBeNull()
    引擎.移除便签('removable')
    expect(引擎.获取姿态('removable')).toBeNull()
  })

  it('步进后姿态回调被调用', () => {
    const 配置 = 创建测试配置()
    引擎.添加便签(配置)
    const 回调 = vi.fn()
    引擎.设置姿态回调(回调)
    引擎.步进(16)
    expect(回调).toHaveBeenCalledTimes(1)
    expect(回调.mock.calls[0][0].length).toBe(1)
    expect(回调.mock.calls[0][0][0].便签ID).toBe('test-1')
  })

  it('重力作用下便签Y坐标会下移', () => {
    const 配置 = 创建测试配置()
    引擎.添加便签(配置)
    const 初始姿态 = 引擎.获取姿态('test-1')
    expect(初始姿态).not.toBeNull()
    const 初始Y = 初始姿态!.便签Y

    for (let i = 0; i < 30; i++) {
      引擎.步进(16)
    }
    const 后姿态 = 引擎.获取姿态('test-1')
    expect(后姿态).not.toBeNull()
    expect(后姿态!.便签Y).toBeGreaterThan(初始Y)
  })

  it('角度限制在静止角±最大偏移内', () => {
    const 配置 = 创建测试配置({ 静止角Deg: 0, 最大偏移Deg: 5 })
    引擎.添加便签(配置)
    const 最大角度Rad = (5 * Math.PI) / 180
    const 最小角度Rad = -最大角度Rad

    for (let i = 0; i < 60; i++) {
      引擎.步进(16)
    }
    const 姿态 = 引擎.获取姿态('test-1')
    expect(姿态).not.toBeNull()
    expect(姿态!.角度).toBeGreaterThanOrEqual(最小角度Rad - 0.0001)
    expect(姿态!.角度).toBeLessThanOrEqual(最大角度Rad + 0.0001)
  })

  it('施加鼠标力后便签会产生水平位移', () => {
    const 配置 = 创建测试配置({ 静止角Deg: 0 })
    引擎.添加便签(配置)
    const 初始姿态 = 引擎.获取姿态('test-1')
    const 初始X = 初始姿态!.便签X

    引擎.施加鼠标力('test-1', 0, 0)
    for (let i = 0; i < 5; i++) {
      引擎.施加鼠标力('test-1', 100 + i * 50, 0)
      引擎.步进(16)
    }

    const 后姿态 = 引擎.获取姿态('test-1')
    expect(Math.abs(后姿态!.便签X - 初始X)).toBeGreaterThan(0)
  })

  it('重置鼠标状态后再次施加力不立即产生力（需两次采样）', () => {
    const 配置 = 创建测试配置()
    引擎.添加便签(配置)
    引擎.施加鼠标力('test-1', 0, 0)
    引擎.重置鼠标状态('test-1')
    const 姿态A = 引擎.获取姿态('test-1')
    引擎.施加鼠标力('test-1', 200, 0)
    引擎.步进(16)
    const 姿态B = 引擎.获取姿态('test-1')
    expect(姿态B).not.toBeNull()
    expect(姿态A).not.toBeNull()
    expect(姿态B!.便签X).toBeCloseTo(姿态A!.便签X, 1)
  })

  it('暂停状态下步进不更新物理', () => {
    const 配置 = 创建测试配置()
    引擎.添加便签(配置)
    const 回调 = vi.fn()
    引擎.设置姿态回调(回调)
    引擎.设置暂停(true)
    引擎.步进(16)
    expect(回调).not.toHaveBeenCalled()
  })

  it('不可见状态下步进不更新物理', () => {
    const 配置 = 创建测试配置()
    引擎.添加便签(配置)
    const 回调 = vi.fn()
    引擎.设置姿态回调(回调)
    引擎.设置可见(false)
    引擎.步进(16)
    expect(回调).not.toHaveBeenCalled()
  })

  it('销毁后状态被清理', () => {
    const 配置 = 创建测试配置()
    引擎.添加便签(配置)
    const 回调 = vi.fn()
    引擎.设置姿态回调(回调)
    引擎.销毁()
    expect(引擎.获取所有姿态().length).toBe(0)
  })

  it('绳子节点初始位置沿锚点垂直分布', () => {
    const 配置 = 创建测试配置({ 锚点X: 50, 锚点Y: 10, 绳长: 60, 绳节点数: 6 })
    引擎.添加便签(配置)
    const 姿态 = 引擎.获取姿态('test-1')
    expect(姿态).not.toBeNull()
    const 节点 = 姿态!.绳子节点
    expect(节点[0].x).toBeCloseTo(50, 1)
    expect(节点[0].y).toBeCloseTo(10, 1)
    for (let i = 1; i < 节点.length; i++) {
      expect(节点[i].y).toBeGreaterThan(节点[i - 1].y)
    }
  })

  it('便签顶部连接到绳子末端节点附近', () => {
    const 配置 = 创建测试配置({ 绳长: 64, 便签高: 200 })
    引擎.添加便签(配置)
    const 姿态 = 引擎.获取姿态('test-1')
    expect(姿态).not.toBeNull()
    const 末端节点 = 姿态!.绳子节点[姿态!.绳子节点.length - 1]
    const 便签顶部Y = 姿态!.便签Y - 姿态!.便签高 / 2
    expect(Math.abs(便签顶部Y - 末端节点.y)).toBeLessThan(20)
  })

  it('创建默认便签配置生成正确尺寸', () => {
    const 配置 = 创建默认便签配置({
      便签ID: 'default',
      容器宽: 208,
      绳长: 64,
      静止角Deg: -2.5,
      索引: 0,
    })
    expect(配置.便签宽).toBe(208)
    expect(配置.便签高).toBeCloseTo(208 * (841 / 800), 1)
    expect(配置.绳节点数).toBe(6)
    expect(配置.最大偏移Deg).toBe(8)
  })
})

describe('便签物理引擎 - 多便签集成', () => {
  it('四个便签同时运行并独立响应', () => {
    const 引擎 = new 便签物理引擎()
    const 静止角列表 = [-2.5, 1.8, -1.2, 2.2]
    for (let i = 0; i < 4; i++) {
      引擎.添加便签(
        创建测试配置({
          便签ID: `note-${i}`,
          索引: i,
          静止角Deg: 静止角列表[i],
        })
      )
    }

    const 所有姿态 = 引擎.获取所有姿态()
    expect(所有姿态.length).toBe(4)
    for (let i = 0; i < 4; i++) {
      const 姿态 = 引擎.获取姿态(`note-${i}`)
      expect(姿态).not.toBeNull()
      const 期望角度 = (静止角列表[i] * Math.PI) / 180
      expect(姿态!.角度).toBeCloseTo(期望角度, 5)
    }

    for (let i = 0; i < 30; i++) {
      引擎.步进(16)
    }

    const 后姿态 = 引擎.获取所有姿态()
    expect(后姿态.length).toBe(4)
    引擎.销毁()
  })

  it('启动后通过 requestAnimationFrame 调度循环', () => {
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(42)
    const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {})

    const 引擎 = new 便签物理引擎()
    引擎.添加便签(创建测试配置())
    引擎.设置姿态回调(() => {})
    引擎.启动()
    expect(rafSpy).toHaveBeenCalled()
    引擎.停止()
    expect(cancelSpy).toHaveBeenCalledWith(42)
    引擎.销毁()
    rafSpy.mockRestore()
    cancelSpy.mockRestore()
  })
})
