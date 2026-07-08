import { test, expect } from '@playwright/test'

test.describe('AI 助手', () => {
  test('打开 AI 助手、提问并显示本地规则引擎答案', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const openButton = page.getByRole('button', { name: 'AI 助手' })
    await expect(openButton).toBeVisible()
    await openButton.click()

    const dialog = page.getByRole('dialog', { name: 'AI 助手' })
    await expect(dialog).toBeVisible()

    const input = page.getByPlaceholder(/输入问题/)
    await expect(input).toBeVisible()
    await input.fill('你是谁')

    await page.getByRole('button', { name: '发送', exact: true }).click()
    await expect(page.getByText('根据简历信息')).toBeVisible({ timeout: 10000 })
  })
})
