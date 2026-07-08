import { test, expect } from '@playwright/test'

test.describe('首屏 Hero', () => {
  test('展示姓名、目标岗位与主要 CTA', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: '玄锐暮', level: 1 })).toBeVisible()
    await expect(
      page.getByText('Java 后端开发 / AI 应用开发 / 全栈开发 / 软件工程师')
    ).toBeVisible()
    await expect(page.getByRole('button', { name: '复制邮箱' })).toBeVisible()
    await expect(page.getByRole('button', { name: '查看项目' })).toBeVisible()
    await expect(page.getByRole('button', { name: '下载简历' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'AI 问答' })).toBeVisible()
  })
})
