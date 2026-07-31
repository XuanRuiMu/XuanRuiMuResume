import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const results = {}
  for (const name of ['S2a', 'S2b', 'S2c', 'S2d']) {
    const page = await browser.newPage()
    const errors = []
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
    page.on('pageerror', err => errors.push(err.message))
    await page.goto('http://localhost:5180/test-starry/' + name + '.html', { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(8000)
    results[name] = errors
    console.log(name + ' errors:', errors.length)
    if (errors.length > 0) errors.forEach(e => console.log('  ERR:', e))
    await page.close()
  }
  await browser.close()

  let allPass = true
  for (const [name, errors] of Object.entries(results)) {
    if (errors.length > 0) {
      console.error(`FAIL: ${name} has ${errors.length} errors`)
      allPass = false
    }
  }
  if (allPass) {
    console.log('\nAll variants passed: 0 errors each')
  }
  process.exit(allPass ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })
