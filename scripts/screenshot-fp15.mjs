import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../screenshots')

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

const shots = [
  { name: 'hero', nav: '首页', selector: 'section#hero', wait: 2000 },
  { name: 'about', nav: '关于', selector: 'section#about', wait: 1500 },
  { name: 'projects', nav: '项目', selector: 'section#projects', wait: 1500 },
  { name: 'experience', nav: '经历', selector: 'section#experience', wait: 1500 },
  { name: 'design', nav: '设计', selector: 'section#design', wait: 1500 },
  { name: 'media', nav: '媒体', selector: 'section#media', wait: 1500 },
]

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(2000)

  for (const shot of shots) {
    const navButton = page.getByRole('button', { name: shot.nav, exact: true })
    if (await navButton.count() > 0) {
      await navButton.click()
      await page.waitForTimeout(shot.wait)
    }

    const elem = page.locator(shot.selector)
    await elem.scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)

    const filePath = path.join(outDir, `${shot.name}.png`)
    await elem.screenshot({ path: filePath, timeout: 120000 })
    console.log(`Saved ${filePath}`)
  }

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
