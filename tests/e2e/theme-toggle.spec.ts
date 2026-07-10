import { test, expect } from '@playwright/test'

test.describe('主题切换', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(300)
  })

  test('默认主题为 system', async ({ page }) => {
    const isSystemDefault = await page.evaluate(() => {
      const storeKey = Object.keys(localStorage).find((key) => key.includes('xrm'))
      const root = document.documentElement
      const hasThemeClass = root.classList.contains('dark') || root.classList.contains('light')
      const colorScheme = root.style.colorScheme
      return { storeKey, hasThemeClass, colorScheme }
    })
    expect(isSystemDefault.hasThemeClass).toBe(true)
    expect(['dark', 'light']).toContain(isSystemDefault.colorScheme)
  })

  test('打开主题选择菜单并截图', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '选择主题' })
    await expect(trigger).toBeVisible()
    await trigger.click()

    const listbox = page.getByRole('listbox', { name: '选择主题' })
    await expect(listbox).toBeVisible()
    await expect(page.getByRole('option', { name: '深色模式' })).toBeVisible()
    await expect(page.getByRole('option', { name: '浅色模式' })).toBeVisible()
    await expect(page.getByRole('option', { name: '跟随系统' })).toBeVisible()

    await expect(listbox).toHaveScreenshot('theme-menu-open.png', {
      maxDiffPixels: 50,
      threshold: 0.1,
      animations: 'disabled',
      caret: 'hide',
    })
  })

  test('切换为深色模式并验证主题变化', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '选择主题' })
    await trigger.click()

    await page.getByRole('option', { name: '深色模式' }).click()
    await page.waitForTimeout(800)

    const storedTheme = await page.evaluate(() => localStorage.getItem('xrm-theme'))
    expect(storedTheme).toBe('dark')

    const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    expect(hasDarkClass).toBe(true)
  })

  test('键盘操作可切换主题', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '选择主题' })
    await trigger.focus()
    await page.keyboard.press('Enter')

    const listbox = page.getByRole('listbox', { name: '选择主题' })
    await expect(listbox).toBeVisible()

    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(800)

    const storedTheme = await page.evaluate(() => localStorage.getItem('xrm-theme'))
    expect(storedTheme).toBe('dark')
  })

  test('Escape 关闭主题菜单', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '选择主题' })
    await trigger.click()

    const listbox = page.getByRole('listbox', { name: '选择主题' })
    await expect(listbox).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(listbox).not.toBeVisible()
  })
})
