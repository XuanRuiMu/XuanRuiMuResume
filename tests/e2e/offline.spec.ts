import { test, expect } from '@playwright/test'

test.describe('PWA 离线能力', () => {
  test('离线后刷新页面仍能显示主要内容与离线提示', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', '离线 Service Worker 测试仅在 Chromium 执行')

    await page.goto('/')
    await page.waitForFunction(() => navigator.serviceWorker?.controller != null, {
      timeout: 10000,
    })

    await context.setOffline(true)
    await page.reload()

    await expect(page.getByRole('heading', { name: '玄锐暮', level: 1 })).toBeVisible()
    await expect(page.getByText('当前处于离线模式')).toBeVisible()

    await context.setOffline(false)
  })
})
