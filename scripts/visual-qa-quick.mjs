import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.join(process.cwd(), 'visual-qa-screenshots');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });

  // Light mode
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';
  });
  await sleep(500);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await sleep(300);
  await page.screenshot({ path: path.join(OUT_DIR, 'light-contact-check.png') });

  // Mobile light contact
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://127.0.0.1:4173#contact', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';
  });
  await sleep(800);
  await page.screenshot({ path: path.join(OUT_DIR, 'light-mobile-contact-check.png') });

  console.log('Screenshots saved');
  await browser.close();
}

main();
