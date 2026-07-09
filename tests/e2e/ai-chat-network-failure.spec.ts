import { test, expect, type Page } from '@playwright/test'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

async function openChat(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const openButton = page.getByRole('button', { name: 'AI 问答' })
  await expect(openButton).toBeVisible()
  await openButton.click()

  const dialog = page.getByRole('dialog', { name: 'AI 助手' })
  await expect(dialog).toBeVisible()
  return dialog
}

test.describe('AI 聊天网络异常降级', () => {
  test('LLM 返回 5xx 时降级到本地规则引擎并渲染结构化组件', async ({ page }) => {
    await page.route(DEEPSEEK_API_URL, async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'text/plain',
        body: 'Service Unavailable',
      })
    })

    const dialog = await openChat(page)
    const input = page.getByPlaceholder(/输入问题/)
    await input.fill('介绍一下暮澜纪元')
    await input.press('Enter')

    const projectCard = dialog.getByTestId('ui-component-ProjectCard')
    await expect(projectCard).toBeVisible({ timeout: 15000 })
    await expect(projectCard.getByRole('heading', { name: '暮澜纪元 MMORPG 服务端' })).toBeVisible()
  })

  test('LLM 返回 4xx 时降级到本地规则引擎并渲染结构化组件', async ({ page }) => {
    await page.route(DEEPSEEK_API_URL, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'text/plain',
        body: 'Unauthorized',
      })
    })

    const dialog = await openChat(page)
    const input = page.getByPlaceholder(/输入问题/)
    await input.fill('怎么联系你')
    await input.press('Enter')

    const contactForm = dialog.getByTestId('ui-component-ContactForm')
    await expect(contactForm).toBeVisible({ timeout: 15000 })
    await expect(contactForm.getByPlaceholder(/你的名字/)).toBeVisible()
  })

  test('LLM 请求超时时降级到本地规则引擎并渲染结构化组件', async ({ page }) => {
    await page.route(DEEPSEEK_API_URL, async (route) => {
      await route.abort('timedout')
    })

    const dialog = await openChat(page)
    const input = page.getByPlaceholder(/输入问题/)
    await input.fill('你的技术栈')
    await input.press('Enter')

    const skillRadar = dialog.getByTestId('ui-component-SkillRadar')
    await expect(skillRadar).toBeVisible({ timeout: 15000 })
  })
})
