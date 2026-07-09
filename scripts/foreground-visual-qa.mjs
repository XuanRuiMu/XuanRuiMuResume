import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../visual-qa-screenshots')
const baseUrl = process.env.VISUAL_QA_BASE_URL || 'http://127.0.0.1:4173'

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

const viewports = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 812 },
}

const themes = ['dark', 'light']

const results = []
let screenshotCount = 0
let passCount = 0
let failCount = 0

function log(result) {
  results.push(result)
  if (result.status === 'PASS') passCount++
  else failCount++
  console.log(`[${result.status}] ${result.point}: ${result.message}`)
}

async function screenshot(page, name) {
  const filePath = path.join(outDir, `${name}.png`)
  await page.screenshot({ path: filePath, fullPage: false, timeout: 30000 })
  screenshotCount++
  console.log(`  📸 ${filePath}`)
  return filePath
}

async function applyTheme(page, theme) {
  await page.evaluate((t) => {
    window.localStorage.setItem('xrm-theme', t)
  }, theme)
  await page.reload({ waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForFunction(
    (t) => document.documentElement.classList.contains(t),
    theme,
    { timeout: 10000 }
  )
  await page.waitForTimeout(800)
}

async function waitForSections(page) {
  for (const id of ['hero', 'about', 'projects', 'skills', 'experience', 'education', 'design', 'music', 'media', 'contact']) {
    await page.waitForSelector(`#${id}`, { state: 'attached', timeout: 10000 })
  }
}

async function collectPaintMetrics(page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0]
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]
    return {
      fcp: fcp ? Math.round(fcp.startTime) : null,
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      load: nav ? Math.round(nav.loadEventEnd) : null,
    }
  })
}

async function collectLcp(page) {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        const entries = performance.getEntriesByType('largest-contentful-paint')
        let lcp = entries.length > 0 ? entries[entries.length - 1] : null
        const observer = new PerformanceObserver((list) => {
          const newEntries = list.getEntries()
          lcp = newEntries[newEntries.length - 1]
        })
        observer.observe({ entryTypes: ['largest-contentful-paint'] })
        setTimeout(() => {
          observer.disconnect()
          resolve(lcp ? { value: Math.round(lcp.startTime), element: lcp.element?.tagName ?? null } : null)
        }, 3000)
      })
  )
}

async function collectCls(page) {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        let cls = 0
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) cls += entry.value
          }
        })
        observer.observe({ entryTypes: ['layout-shift'] })
        setTimeout(() => {
          observer.disconnect()
          resolve(cls)
        }, 3000)
      })
  )
}

async function scrollToSection(page, id) {
  await page.evaluate((sectionId) => {
    const el = document.getElementById(sectionId)
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
  }, id)
  await page.waitForTimeout(600)
}

async function runTestPoint(page, point, testFn) {
  try {
    await testFn()
    log({ status: 'PASS', point, message: '通过' })
  } catch (error) {
    log({ status: 'FAIL', point, message: error.message })
  }
}

async function runForViewportTheme(browser, viewportName, viewport, theme) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: viewportName === 'mobile' ? 2 : 1,
  })
  const page = await context.newPage()

  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 })
  await applyTheme(page, theme)
  await waitForSections(page)

  const prefix = `${viewportName}-${theme}`

  // 1. Hero 3D 星系背景渲染
  await runTestPoint(page, 'Hero 3D 星系背景渲染', async () => {
    const canvas = page.locator('#hero canvas')
    await expectLocatorVisible(canvas)
    const box = await canvas.boundingBox()
    if (!box || box.width < 100 || box.height < 100) {
      throw new Error(`canvas 尺寸过小: ${JSON.stringify(box)}`)
    }
  })
  await screenshot(page, `${prefix}-01-hero-galaxy`)

  // 2. 导航 Dock 显示
  await runTestPoint(page, '导航 Dock 显示', async () => {
    const nav = page.locator('nav[aria-label="主导航"]')
    await expectLocatorVisible(nav)
    for (const label of ['首页', '项目', '技能', '经历', '联系']) {
      const btn = page.getByRole('button', { name: label, exact: true })
      await expectLocatorVisible(btn)
    }
  })
  await screenshot(page, `${prefix}-02-nav-dock`)

  // 3. 主题切换按钮存在且可切换
  await runTestPoint(page, '主题切换按钮存在', async () => {
    const toggle = page.getByRole('button', { name: /深色模式|浅色模式|跟随系统/ })
    await expectLocatorVisible(toggle)
  })

  // 4. 项目卡片布局（Container Queries）
  await scrollToSection(page, 'projects')
  await runTestPoint(page, '项目卡片布局', async () => {
    const section = page.locator('#projects')
    await expectLocatorVisible(section)
    const cards = page.locator('#projects h3')
    const count = await cards.count()
    if (count < 2) throw new Error(`项目卡片不足: ${count}`)
  })
  await screenshot(page, `${prefix}-03-projects`)

  // 5. 技能区域滚动驱动动画
  await scrollToSection(page, 'skills')
  await page.waitForTimeout(800)
  await runTestPoint(page, '技能区域滚动驱动动画', async () => {
    const section = page.locator('#skills')
    await expectLocatorVisible(section)
    const radar = page.locator('#skills svg, #skills [data-testid="radar-point-0"]')
    await radar.first().waitFor({ state: 'visible', timeout: 15000 })
  })
  await screenshot(page, `${prefix}-04-skills`)

  // 6. Section 标题滚动渐入
  await runTestPoint(page, 'Section 标题滚动渐入', async () => {
    const titles = page.locator('h2')
    const count = await titles.count()
    if (count < 5) throw new Error(`标题数量不足: ${count}`)
    for (let i = 0; i < Math.min(count, 5); i++) {
      const box = await titles.nth(i).boundingBox()
      if (!box || box.width <= 0 || box.height <= 0) {
        throw new Error(`标题 ${i} 未渲染`)
      }
    }
  })

  // 7. 经历时间线
  await scrollToSection(page, 'experience')
  await runTestPoint(page, '经历时间线渲染', async () => {
    const section = page.locator('#experience')
    await expectLocatorVisible(section)
  })
  await screenshot(page, `${prefix}-05-experience`)

  // 8. 联系表单可读性
  await scrollToSection(page, 'contact')
  await runTestPoint(page, '联系表单可读性', async () => {
    const section = page.locator('#contact')
    await expectLocatorVisible(section)
    const inputs = page.locator('#contact input, #contact textarea')
    const count = await inputs.count()
    if (count < 2) throw new Error(`表单输入项不足: ${count}`)
  })
  await screenshot(page, `${prefix}-06-contact`)

  // 9. Command Palette 可打开/搜索/关闭
  await scrollToSection(page, 'hero')
  await runTestPoint(page, 'Command Palette 打开搜索关闭', async () => {
    await page.keyboard.press('Control+k')
    const dialog = page.getByRole('dialog', { name: '命令面板' })
    await expectLocatorVisible(dialog)
    const input = dialog.locator('input')
    await expectLocatorVisible(input)
    const item = dialog.getByRole('option', { name: '项目' })
    await expectLocatorVisible(item)
    await input.fill('项目')
    await page.waitForTimeout(400)
    const visibleItems = dialog.locator('[cmdk-item]')
    const count = await visibleItems.count()
    if (count === 0) throw new Error('搜索后无匹配项')
    await page.keyboard.press('Escape')
    await expectLocatorHidden(dialog)
  })
  await screenshot(page, `${prefix}-07-command-palette`)

  // 10. AI 聊天窗口可打开、可输入、本地模式返回结构化组件
  await runTestPoint(page, 'AI 聊天 ProjectCard 组件', async () => {
    await resetAndOpenChat(page)
    await sendChatMessage(page, '介绍一下你的项目')
    await verifyComponentRendered(page, 'ProjectCard')
  })
  await screenshot(page, `${prefix}-08-ai-projectcard`)

  await runTestPoint(page, 'AI 聊天 SkillRadar 组件', async () => {
    await resetAndOpenChat(page)
    await sendChatMessage(page, '你的技术栈')
    await verifyComponentRendered(page, 'SkillRadar')
  })
  await screenshot(page, `${prefix}-09-ai-skillradar`)

  await runTestPoint(page, 'AI 聊天 Timeline 组件', async () => {
    await resetAndOpenChat(page)
    await sendChatMessage(page, '你的工作经历')
    await verifyComponentRendered(page, 'Timeline')
  })
  await screenshot(page, `${prefix}-10-ai-timeline`)

  await runTestPoint(page, 'AI 聊天 ContactForm 组件', async () => {
    await resetAndOpenChat(page)
    await sendChatMessage(page, '联系方式')
    await verifyComponentRendered(page, 'ContactForm')
  })
  await screenshot(page, `${prefix}-11-ai-contactform`)

  // 11. 页面滚动无卡顿
  await runTestPoint(page, '页面滚动无卡顿', async () => {
    const longTasks = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const tasks = []
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              tasks.push({ duration: entry.duration, startTime: entry.startTime })
            }
          })
          observer.observe({ entryTypes: ['longtask'] })
          window.scrollTo({ top: 0, behavior: 'instant' })
          const start = performance.now()
          const scrollStep = () => {
            const elapsed = performance.now() - start
            const progress = Math.min(elapsed / 1500, 1)
            window.scrollTo(0, progress * (document.body.scrollHeight - window.innerHeight))
            if (progress < 1) {
              requestAnimationFrame(scrollStep)
            } else {
              setTimeout(() => {
                observer.disconnect()
                resolve(tasks)
              }, 500)
            }
          }
          requestAnimationFrame(scrollStep)
        })
    )
    const blocking = longTasks.filter((task) => task.duration > 100)
    console.log(`      长任务数量: ${longTasks.length}, >100ms: ${blocking.length}`)
    if (blocking.length > 2) {
      throw new Error(`滚动过程中阻塞任务过多: ${blocking.length}`)
    }
  })

  // 12. 性能指标
  await runTestPoint(page, '性能指标 FCP/LCP/CLS', async () => {
    const paint = await collectPaintMetrics(page)
    const lcp = await collectLcp(page)
    const cls = await collectCls(page)
    const metrics = { paint, lcp, cls }
    console.log(`      性能数据: ${JSON.stringify(metrics)}`)
    if (paint.fcp && paint.fcp > 2500) throw new Error(`FCP 过高: ${paint.fcp}ms`)
    if (lcp?.value && lcp.value > 4000) throw new Error(`LCP 过高: ${lcp.value}ms`)
    if (cls > 0.15) throw new Error(`CLS 过高: ${cls}`)
  })

  // 13. 移动端菜单/布局无错位
  if (viewportName === 'mobile') {
    await runTestPoint(page, '移动端布局无错位', async () => {
      const header = page.locator('header')
      await expectLocatorVisible(header)
      const headerBox = await header.boundingBox()
      if (!headerBox || headerBox.width > viewport.width + 1) {
        throw new Error(`header 宽度超出视口: ${headerBox?.width} > ${viewport.width}`)
      }
      const main = page.locator('main')
      const mainBox = await main.boundingBox()
      if (!mainBox || mainBox.width > viewport.width + 1) {
        throw new Error(`main 宽度超出视口: ${mainBox?.width} > ${viewport.width}`)
      }
    })
    await screenshot(page, `${prefix}-12-mobile-layout`)
  }

  await context.close()
}

async function expectLocatorVisible(locator) {
  await locator.waitFor({ state: 'visible', timeout: 10000 })
}

async function expectLocatorHidden(locator) {
  await locator.waitFor({ state: 'hidden', timeout: 10000 })
}

async function resetAndOpenChat(page) {
  // 确保命令面板已关闭，避免遮罩拦截点击
  const commandDialog = page.getByRole('dialog', { name: '命令面板' })
  if (await commandDialog.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape')
    await commandDialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
  }
  // 关闭可能已打开的聊天窗口
  const closeBtn = page.locator('[aria-label="关闭"]').first()
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click()
    await page.waitForTimeout(200)
  }
  const openBtn = page.getByRole('button', { name: 'AI 助手' })
  await openBtn.click()
  const dialog = page.getByRole('dialog', { name: 'AI 助手' })
  await expectLocatorVisible(dialog)
}

async function sendChatMessage(page, text) {
  const input = page.getByPlaceholder(/输入问题/)
  await input.fill(text)
  await input.press('Enter')
  const loading = page.locator('text=AI 思考中').first()
  try {
    await loading.waitFor({ state: 'visible', timeout: 10000 })
    await loading.waitFor({ state: 'hidden', timeout: 15000 })
  } catch {
    // 本地模式可能非常快，loading 已消失
  }
  await page.waitForTimeout(500)
}

async function verifyComponentRendered(page, type) {
  const component = page.locator(`[data-testid="ui-component-${type}"]`)
  await expectLocatorVisible(component)
}

async function main() {
  console.log(`启动前台视觉验证: ${baseUrl}`)
  console.log(`截图保存目录: ${outDir}`)

  const browser = await chromium.launch({ headless: false })

  for (const [viewportName, viewport] of Object.entries(viewports)) {
    for (const theme of themes) {
      console.log(`\n=== ${viewportName} / ${theme} ===`)
      await runForViewportTheme(browser, viewportName, viewport, theme)
    }
  }

  await browser.close()

  console.log('\n=== 验证摘要 ===')
  console.log(`测试点通过: ${passCount}`)
  console.log(`测试点失败: ${failCount}`)
  console.log(`截图数量: ${screenshotCount}`)

  const summaryPath = path.join(outDir, 'summary.json')
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        baseUrl,
        screenshotCount,
        passCount,
        failCount,
        results,
      },
      null,
      2
    )
  )
  console.log(`摘要已保存: ${summaryPath}`)

  if (failCount > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
