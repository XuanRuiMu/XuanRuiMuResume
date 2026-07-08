import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../.verification')

const shots = [
  { name: 'fp14-01-landing', scroll: 0, clickEnter: false },
  { name: 'fp14-02-theater-main', scroll: 0, clickEnter: true },
  { name: 'fp14-03-it', scroll: 1, clickEnter: true },
]

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

  await page.goto('http://127.0.0.1:5181/', { waitUntil: 'networkidle', timeout: 60000 })

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
        await page.waitForTimeout(3000)
      }
    }

    if (shot.scroll > 0) {
      await page.evaluate((y) => window.scrollTo(0, y), 1080 * shot.scroll)
      await page.waitForTimeout(2500)
    }

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
