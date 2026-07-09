import { test, expect } from '@playwright/test'

test.describe('导航与命令面板', () => {
  test('顶部导航可跳转至项目、技能与联系模块', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: '项目', exact: true }).click()
    await expect(page.locator('#projects')).toBeInViewport()

    await page.getByRole('button', { name: '技能', exact: true }).click()
    await expect(page.locator('#skills')).toBeInViewport()

    await page.getByRole('button', { name: '联系', exact: true }).click()
    await expect(page.locator('#contact')).toBeInViewport()
  })

  test('Cmd+K 打开命令面板并跳转至经历模块', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.locator('main').click()
    await page.keyboard.press('Control+k')
    const dialog = page.getByRole('dialog', { name: '命令面板' })
    await expect(dialog).toBeVisible()

    await page.getByRole('option', { name: '经历' }).click()
    await expect(dialog).not.toBeVisible()
    await expect(page.locator('#experience')).toBeInViewport()
  })

  test('主题切换按钮可循环切换主题', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const toggle = page.getByRole('button', { name: /^深色模式|浅色模式|跟随系统$/ })
    await expect(toggle).toBeVisible()

    const initialLabel = await toggle.getAttribute('aria-label')
    await toggle.click()
    const nextLabel = await toggle.getAttribute('aria-label')
    expect(nextLabel).not.toBe(initialLabel)
  })
})
