import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../.verification/qa-round')

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

const shots = [
  { name: '01-landing', scroll: 0, clickEnter: false, wait: 1500 },
  { name: '02-theater-main', scroll: 0, clickEnter: true, wait: 3500 },
  { name: '03-it', scroll: 1, clickEnter: true, wait: 3000 },
  { name: '04-edu', scroll: 2, clickEnter: true, wait: 3000 },
  { name: '05-design', scroll: 3, clickEnter: true, wait: 3000 },
  { name: '06-music', scroll: 4, clickEnter: true, wait: 3000 },
  { name: '07-media', scroll: 5, clickEnter: true, wait: 3000 },
]

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

  await page.goto('http://127.0.0.1:5180/', { waitUntil: 'networkidle', timeout: 60000 })

  for (const shot of shots) {
    if (shot.clickEnter) {
      const visible = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('进入剧场'))
        if (btn) {
          btn.click()
          return true
        }
        return false
      })
      if (visible) {
        await page.waitForTimeout(2500)
      }
    }

    if (shot.scroll > 0) {
      await page.evaluate((y) => window.scrollTo(0, y), 1080 * shot.scroll)
      await page.waitForTimeout(2000)
    }

    await page.waitForTimeout(shot.wait)
    const filePath = path.join(outDir, `${shot.name}.png`)
    await page.screenshot({ path: filePath, fullPage: false, timeout: 120000 })
    console.log(`Saved ${filePath}`)
  }

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
