import { test, expect } from '@playwright/test'

test.describe('主题切换', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(300)
  })

  test('默认主题为 dark', async ({ page }) => {
    const defaultState = await page.evaluate(() => {
      const storedTheme = localStorage.getItem('xrm-theme')
      const root = document.documentElement
      const hasDarkClass = root.classList.contains('dark')
      const colorScheme = root.style.colorScheme
      return { storedTheme, hasDarkClass, colorScheme }
    })
    expect(defaultState.storedTheme).toBeNull()
    expect(defaultState.hasDarkClass).toBe(true)
    expect(defaultState.colorScheme).toBe('dark')
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

    // 星空背景为 WebGL 实时渲染，每次加载画面不同，截图前隐藏以保证稳定
    await page.locator('canvas').first().evaluate((canvas) => {
      ;(canvas as HTMLCanvasElement).style.visibility = 'hidden'
    })

    await expect(listbox).toHaveScreenshot('theme-menu-open.png', {
      maxDiffPixels: 50,
      threshold: 0.1,
      animations: 'disabled',
      caret: 'hide',
    })
  })

  test('切换为浅色模式并验证主题变化', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '选择主题' })
    await trigger.click()

    // 站点默认深色，先切浅色验证写入，再切回深色验证往返
    await page.getByRole('option', { name: '浅色模式' }).click()
    await page.waitForTimeout(800)

    const storedLight = await page.evaluate(() => localStorage.getItem('xrm-theme'))
    expect(storedLight).toBe('light')
    const hasLightClass = await page.evaluate(() => document.documentElement.classList.contains('light'))
    expect(hasLightClass).toBe(true)

    await trigger.click()
    await page.getByRole('option', { name: '深色模式' }).click()
    await page.waitForTimeout(800)

    const storedDark = await page.evaluate(() => localStorage.getItem('xrm-theme'))
    expect(storedDark).toBe('dark')
    const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    expect(hasDarkClass).toBe(true)
  })

  test('键盘操作可切换主题', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '选择主题' })
    await trigger.focus()
    await page.keyboard.press('Enter')

    const listbox = page.getByRole('listbox', { name: '选择主题' })
    await expect(listbox).toBeVisible()

    // 默认主题为 dark（列表第 1 项），ArrowDown 移到第 2 项「浅色模式」
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(800)

    const storedTheme = await page.evaluate(() => localStorage.getItem('xrm-theme'))
    expect(storedTheme).toBe('light')
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
