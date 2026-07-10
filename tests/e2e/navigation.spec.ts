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

  test('主题切换按钮可打开菜单并切换主题', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const toggle = page.getByRole('button', { name: '选择主题' })
    await expect(toggle).toBeVisible()

    await toggle.click()
    const menu = page.getByRole('listbox', { name: '选择主题' })
    await expect(menu).toBeVisible()
    await expect(page.getByRole('option', { name: '深色模式' })).toBeVisible()

    await page.getByRole('option', { name: '深色模式' }).click()
    await page.waitForTimeout(500)
    const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    expect(hasDarkClass).toBe(true)
  })
})
