import { test, expect } from '@playwright/test'

test.describe('AI 助手', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://api.deepseek.com/v1/chat/completions', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{ message: { content: '{"text":"我是玄锐暮的简历 AI 助手，有什么可以帮你的？"}' } }],
        }),
      })
    })
  })

  test('打开 AI 助手、提问并显示回答', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const openButton = page.getByRole('button', { name: 'AI 问答' })
    await expect(openButton).toBeVisible()
    await openButton.click()

    const dialog = page.getByRole('dialog', { name: 'AI 助手' })
    await expect(dialog).toBeVisible()

    const input = page.getByPlaceholder(/输入问题/)
    await expect(input).toBeVisible()
    await input.fill('你是谁')

    // 使用 Enter 发送，避免悬浮按钮/空状态覆盖导致的点击拦截
    await input.press('Enter')

    // 等待 loading 出现再消失（兼容本地规则引擎与 LLM 两种模式）
    const loading = dialog.locator('.self-start', { hasText: 'AI 思考中' })
    await expect(loading).toBeVisible({ timeout: 10000 })
    await expect(loading).toBeHidden({ timeout: 120000 })

    // 最终回复应出现在消息列表中，且内容有意义
    const lastAssistantMessage = dialog.locator('.self-start').last()
    await expect(lastAssistantMessage).toBeVisible()
    const text = await lastAssistantMessage.textContent()
    expect(text).not.toContain('AI 思考中')
    expect(text).not.toContain('发送失败')
    expect(text?.length).toBeGreaterThan(10)
  })
})
