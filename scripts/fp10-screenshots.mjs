import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'screenshots')

const sections = ['hero', 'about', 'projects', 'experience', 'design', 'media']

async function takeScreenshots() {
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(3000)

  for (const section of sections) {
    const locator = page.locator(`section#${section}`)
    const count = await locator.count()
    if (count === 0) {
      console.warn(`Section #${section} not found`)
      continue
    }

    await locator.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)

    await page.evaluate((id) => {
      const el = document.querySelector(`section#${id}`)
      if (el) {
        const rect = el.getBoundingClientRect()
        const targetY = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2
        window.scrollTo({ top: targetY, behavior: 'instant' })
      }
    }, section)

    await page.waitForTimeout(1200)

    const screenshotPath = path.join(outDir, `${section}.png`)
    await locator.screenshot({ path: screenshotPath })
    console.log(`Saved ${screenshotPath}`)
  }

  await browser.close()
}

takeScreenshots().catch((err) => {
  console.error(err)
  process.exit(1)
})
