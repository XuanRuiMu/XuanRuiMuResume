import { test, expect, type Page, type Locator } from '@playwright/test'

const 风力存储键 = 'projects-wind-settings'

async function 打开项目区域(page: Page): Promise<Locator> {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const 区域 = page.locator('#projects')
  await 区域.scrollIntoViewIfNeeded()
  await expect(区域).toBeInViewport()
  return 区域
}

async function 等待便签就位(区域: Locator) {
  const 便签 = 区域.locator('.clothesline-note')
  await expect(便签).toHaveCount(4)
  for (let i = 0; i < 4; i++) {
    await expect(便签.nth(i)).toHaveCSS('opacity', '1')
  }
}

test.describe('项目晾衣架便签系统', () => {
  const 控制台错误: string[] = []
  const 页面异常: string[] = []

  test.beforeEach(async ({ page }) => {
    控制台错误.length = 0
    页面异常.length = 0
    page.on('console', (message) => {
      if (message.type() === 'error') 控制台错误.push(message.text())
    })
    page.on('pageerror', (error) => {
      页面异常.push(error.message)
    })
  })

  test.afterEach(() => {
    expect(页面异常, `未处理异常：${页面异常.join('; ')}`).toHaveLength(0)
    expect(控制台错误, `控制台红色错误：${控制台错误.join('; ')}`).toHaveLength(0)
  })

  test('四张便签可见且各含标题、正文与真实 GitHub 链接', async ({ page }) => {
    const 区域 = await 打开项目区域(page)
    await 等待便签就位(区域)

    const 便签 = 区域.locator('.clothesline-note')
    for (let i = 0; i < 4; i++) {
      const 当前 = 便签.nth(i)
      await expect(当前.locator('.clothesline-note-title')).not.toBeEmpty()
      await expect(当前.locator('.clothesline-note-desc')).not.toBeEmpty()
      const 链接 = 当前.locator('a.clothesline-note-link')
      await expect(链接).toBeVisible()
      const href = await 链接.getAttribute('href')
      expect(href, `第 ${i + 1} 张便签链接应为真实 http(s) 地址`).toMatch(/^https?:\/\//)
    }
  })

  test('主绳 canvas 存在且非空白（像素抽样）', async ({ page }) => {
    const 区域 = await 打开项目区域(page)
    await 等待便签就位(区域)

    const 画布 = 区域.locator('canvas.clothesline-canvas')
    await expect(画布).toBeVisible()

    const 非透明像素数 = await 画布.evaluate((canvas) => {
      const ctx = (canvas as HTMLCanvasElement).getContext('2d')
      if (!ctx) return 0
      const { width, height } = canvas as HTMLCanvasElement
      const 数据 = ctx.getImageData(0, 0, width, height).data
      let 计数 = 0
      for (let i = 3; i < 数据.length; i += 4 * 16) {
        if (数据[i] > 0) 计数 += 1
      }
      return 计数
    })
    expect(非透明像素数, 'canvas 抽样应存在非透明像素（主绳与吊绳已绘制）').toBeGreaterThan(50)
  })

  test('风力控制面板在主页内可见且滑杆可调', async ({ page }) => {
    const 区域 = await 打开项目区域(page)
    const 滑杆 = 区域.getByRole('slider', { name: '风力大小' })
    await expect(滑杆).toBeVisible()

    await 滑杆.focus()
    await 滑杆.press('End')
    await expect(区域.getByText('×2.00')).toBeVisible()

    await 滑杆.press('Home')
    await expect(区域.getByText('×0.00')).toBeVisible()
  })

  test('调节滑杆后刷新页面 localStorage 设置保持', async ({ page }) => {
    const 区域 = await 打开项目区域(page)
    const 滑杆 = 区域.getByRole('slider', { name: '风力大小' })
    await 滑杆.focus()
    await 滑杆.press('End')
    await expect(区域.getByText('×2.00')).toBeVisible()

    await page.waitForFunction(
      (键) => {
        const 原始 = localStorage.getItem(键)
        if (!原始) return false
        try {
          return (JSON.parse(原始) as { state?: { 风力强度?: number } }).state?.风力强度 === 2
        } catch {
          return false
        }
      },
      风力存储键
    )

    await page.reload()
    await page.waitForLoadState('networkidle')
    const 新区域 = page.locator('#projects')
    await 新区域.scrollIntoViewIfNeeded()
    await expect(新区域.getByText('×2.00')).toBeVisible()
    const 持久值 = await page.evaluate(
      (键) => (JSON.parse(localStorage.getItem(键) ?? '{}') as { state?: { 风力强度?: number } }).state?.风力强度,
      风力存储键
    )
    expect(持久值).toBe(2)
  })

  test('鼠标在区域内横扫后至少一张便签 transform 发生变化', async ({ page }) => {
    const 区域 = await 打开项目区域(page)
    await 等待便签就位(区域)
    await page.waitForTimeout(300)

    const 便签 = 区域.locator('.clothesline-note')
    const 变化前: string[] = []
    for (let i = 0; i < 4; i++) {
      变化前.push((await 便签.nth(i).evaluate((el) => (el as HTMLElement).style.transform)) ?? '')
    }

    const 盒 = await 区域.locator('.clothesline-region').boundingBox()
    expect(盒).not.toBeNull()
    const { x, y, width, height } = 盒!
    for (let 往返 = 0; 往返 < 6; 往返++) {
      const 起点X = 往返 % 2 === 0 ? x + 20 : x + width - 20
      const 终点X = 往返 % 2 === 0 ? x + width - 20 : x + 20
      await page.mouse.move(起点X, y + height / 2)
      await page.mouse.move(终点X, y + height / 2, { steps: 24 })
    }
    await page.waitForTimeout(200)

    let 有变化 = false
    for (let i = 0; i < 4; i++) {
      const 当前 = (await 便签.nth(i).evaluate((el) => (el as HTMLElement).style.transform)) ?? ''
      if (当前 !== 变化前[i]) 有变化 = true
    }
    expect(有变化, '鼠标横扫后至少一张便签 transform 应发生变化（风力生效）').toBe(true)
  })

  test('便签文字 user-select 为 text 可选中', async ({ page }) => {
    const 区域 = await 打开项目区域(page)
    await 等待便签就位(区域)

    const 标题选择 = await 区域.locator('.clothesline-note-title').first().evaluate(
      (el) => getComputedStyle(el).userSelect
    )
    const 正文选择 = await 区域.locator('.clothesline-note-desc').first().evaluate(
      (el) => getComputedStyle(el).userSelect
    )
    expect(标题选择).toBe('text')
    expect(正文选择).toBe('text')
  })
})
