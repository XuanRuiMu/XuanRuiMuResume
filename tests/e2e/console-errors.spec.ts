import { test, expect } from '@playwright/test'

interface ConsoleEvent {
  type: string
  text: string
  location?: {
    url?: string
    lineNumber?: number
    columnNumber?: number
  }
}

function isKnownBenignMessage(event: ConsoleEvent): boolean {
  const text = event.text
  if (text.includes('React Compiler')) return true
  if (text.includes('[vite]')) return true
  if (text.includes('Download the React DevTools')) return true
  if (text.includes('Three.js r')) return true
  if (text.includes('THREE.Clock')) return true
  if (text.includes('No available adapters')) return true
  if (text.includes('powerPreference')) return true
  if (text.includes('WebGL')) return true
  if (text.includes('webgpu')) return true
  if (text.includes('Lighthouse')) return true
  if (text.includes('ShaderMaterial')) return true
  if (text.includes('RenderPassEncoder')) return true
  if (text.includes('THREE.NodeBuilder')) return true
  return false
}

test.describe('控制台错误监控', () => {
  const consoleEvents: ConsoleEvent[] = []
  const pageErrors: Error[] = []

  test.beforeEach(({ page }) => {
    consoleEvents.length = 0
    pageErrors.length = 0

    page.on('console', (message) => {
      consoleEvents.push({
        type: message.type(),
        text: message.text(),
        location: message.location(),
      })
    })

    page.on('pageerror', (error) => {
      pageErrors.push(error)
    })
  })

  test('首页加载与交互不产生 error/warning 或未处理异常', async ({ page }) => {
    await page.route('https://api.deepseek.com/v1/chat/completions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{ message: { content: '{"text":"你好，有什么可以帮你的？"}' } }],
        }),
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: '玄锐暮', level: 1 })).toBeVisible()

    await page.getByRole('button', { name: 'AI 问答' }).click()
    const dialog = page.getByRole('dialog', { name: 'AI 助手' })
    await expect(dialog).toBeVisible()

    const input = page.getByPlaceholder(/输入问题/)
    await input.fill('你好')
    await input.press('Enter')

    await page.getByRole('button', { name: '关闭' }).first().click()
    await expect(dialog).not.toBeVisible()

    await page.getByRole('button', { name: '项目', exact: true }).click()
    await expect(page.locator('#projects')).toBeInViewport()

    const errors = consoleEvents.filter(
      (event) => (event.type === 'error' || event.type === 'warning') && !isKnownBenignMessage(event)
    )

    expect(pageErrors, `未处理异常：${pageErrors.map((error) => error.message).join('; ')}`).toHaveLength(0)
    expect(errors, `控制台错误/警告：${errors.map((event) => event.text).join('; ')}`).toHaveLength(0)
  })
})
