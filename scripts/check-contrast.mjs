import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });

  // Force light mode
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';
  });
  await page.waitForTimeout(500);

  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const label = page.locator('#contact').locator('text=邮箱').first();
  const color = await label.evaluate((el) => window.getComputedStyle(el).color);
  const bg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
  const inputBorder = await page.evaluate(() => {
    const input = document.querySelector('#contact input');
    return input ? window.getComputedStyle(input).borderColor : 'none';
  });
  const placeholder = await page.evaluate(() => {
    const input = document.querySelector('#contact input');
    if (!input) return 'none';
    const styles = window.getComputedStyle(input, '::placeholder');
    return styles.color;
  });

  console.log('body bg:', bg);
  console.log('label color:', color);
  console.log('input border:', inputBorder);
  console.log('placeholder color:', placeholder);

  await browser.close();
}

main();
