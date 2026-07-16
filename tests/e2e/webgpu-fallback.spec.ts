import { test, expect } from '@playwright/test'

test.describe('WebGPU 不支持降级路径', () => {
  test('删除 navigator.gpu 后页面仍正常渲染并降级到 WebGL2/CSS fallback', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'gpu', {
        value: undefined,
        configurable: true,
      })
    })

    const pageErrors: Error[] = []
    page.on('pageerror', (error) => {
      pageErrors.push(error)
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: '玄锐暮', level: 1 })).toBeVisible()

    const canvas = page.locator('canvas')
    const fallback = page.getByTestId('skill-galaxy-fallback')

    await expect(async () => {
      const canvasCount = await canvas.count()
      const fallbackCount = await fallback.count()
      expect(canvasCount + fallbackCount).toBeGreaterThan(0)
    }).toPass({ timeout: 10000 })

    expect(pageErrors, `未处理异常：${pageErrors.map((error) => error.message).join('; ')}`).toHaveLength(0)
  })
})

test.describe('星系鼠标风拂交互', () => {
  test('鼠标划过星空背景不触发未处理异常', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (error) => {
      pageErrors.push(error)
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: '玄锐暮', level: 1 })).toBeVisible()

    const canvas = page.locator('canvas')
    const fallback = page.getByTestId('skill-galaxy-fallback')

    await expect(async () => {
      const canvasCount = await canvas.count()
      const fallbackCount = await fallback.count()
      expect(canvasCount + fallbackCount).toBeGreaterThan(0)
    }).toPass({ timeout: 10000 })

    const target = (await canvas.count()) > 0 ? canvas.first() : fallback.first()
    const box = await target.boundingBox()
    expect(box).not.toBeNull()

    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.75, { steps: 10 })
      await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.25, { steps: 10 })
    }

    expect(pageErrors, `未处理异常：${pageErrors.map((error) => error.message).join('; ')}`).toHaveLength(0)
  })
})
