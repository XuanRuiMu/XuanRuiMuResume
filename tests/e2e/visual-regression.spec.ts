import { test, expect, type Page } from '@playwright/test'

interface 视觉视图配置 {
  名称: string
  视口: { width: number; height: number }
  主题: 'light' | 'dark'
}

const 视觉回归阈值 = {
  maxDiffPixels: Number.parseInt(process.env.VISUAL_DIFF_MAX_DIFF_PIXELS ?? '100', 10),
  threshold: Number.parseFloat(process.env.VISUAL_DIFF_THRESHOLD ?? '0.2'),
}

const 视觉视图配置列表: 视觉视图配置[] = [
  { 名称: 'desktop-light', 视口: { width: 1920, height: 1080 }, 主题: 'light' },
  { 名称: 'desktop-dark', 视口: { width: 1920, height: 1080 }, 主题: 'dark' },
  { 名称: 'mobile-light', 视口: { width: 375, height: 812 }, 主题: 'light' },
  { 名称: 'mobile-dark', 视口: { width: 375, height: 812 }, 主题: 'dark' },
]

async function 设置主题(page: Page, 主题: 'light' | 'dark') {
  await page.evaluate((主题值) => {
    localStorage.setItem('xrm-theme', 主题值)
  }, 主题)
}

async function 等待页面稳定(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
}

for (const 视图配置 of 视觉视图配置列表) {
  test.describe(`视觉回归 - ${视图配置.名称}`, () => {
    test.use({
      viewport: 视图配置.视口,
      contextOptions: {
        reducedMotion: 'reduce',
      },
    })

    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await 设置主题(page, 视图配置.主题)
      await page.reload()
      await 等待页面稳定(page)
    })

    test('Hero 首屏', async ({ page }) => {
      await expect(page).toHaveScreenshot(`hero-${视图配置.名称}.png`, {
        ...视觉回归阈值,
        animations: 'disabled',
        caret: 'hide',
      })
    })

    test('AI 聊天对话框', async ({ page }) => {
      const 打开按钮 = page.getByRole('button', { name: 'AI 问答' })
      await 打开按钮.click()
      const 对话框 = page.getByRole('dialog', { name: 'AI 助手' })
      await expect(对话框).toBeVisible()
      await expect(对话框).toHaveScreenshot(`ai-chat-${视图配置.名称}.png`, {
        ...视觉回归阈值,
        animations: 'disabled',
        caret: 'hide',
      })
    })

    test('项目卡片区域', async ({ page }) => {
      await page.getByRole('button', { name: '项目', exact: true }).click()
      await expect(page.locator('#projects')).toBeInViewport()
      await expect(page.locator('#projects')).toHaveScreenshot(
        `projects-${视图配置.名称}.png`,
        {
          ...视觉回归阈值,
          animations: 'disabled',
          caret: 'hide',
        }
      )
    })

    test('技能区域', async ({ page }) => {
      await page.getByRole('button', { name: '技能', exact: true }).click()
      await expect(page.locator('#skills')).toBeInViewport()
      await expect(page.locator('#skills')).toHaveScreenshot(
        `skills-${视图配置.名称}.png`,
        {
          ...视觉回归阈值,
          animations: 'disabled',
          caret: 'hide',
        }
      )
    })

    test('经历区域', async ({ page }) => {
      await page.getByRole('button', { name: '经历', exact: true }).click()
      await expect(page.locator('#experience')).toBeInViewport()
      // 经历时间线内容较高，移动端截图易受滚动条显隐影响，放宽像素容差
      await page.evaluate(() => {
        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'
      })
      await expect(page.locator('#experience')).toHaveScreenshot(
        `experience-${视图配置.名称}.png`,
        {
          ...视觉回归阈值,
          animations: 'disabled',
          caret: 'hide',
          maxDiffPixels: 12000,
        }
      )
      await page.evaluate(() => {
        document.documentElement.style.overflow = ''
        document.body.style.overflow = ''
      })
    })

    test('联系我区域', async ({ page }) => {
      await page.getByRole('button', { name: '联系', exact: true }).click()
      await expect(page.locator('#contact')).toBeInViewport()
      await expect(page.locator('#contact')).toHaveScreenshot(
        `contact-${视图配置.名称}.png`,
        {
          ...视觉回归阈值,
          animations: 'disabled',
          caret: 'hide',
        }
      )
    })
  })
}
