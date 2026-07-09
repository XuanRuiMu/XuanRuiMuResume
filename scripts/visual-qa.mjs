import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const OUT_DIR = process.env.OUT_DIR || path.join(process.cwd(), 'visual-qa-screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const SECTIONS = [
  { id: 'hero', label: '01-hero' },
  { id: 'about', label: '02-about' },
  { id: 'projects', label: '03-projects' },
  { id: 'skills', label: '04-skills' },
  { id: 'experience', label: '05-experience' },
  { id: 'education', label: '06-education' },
  { id: 'design', label: '07-design' },
  { id: 'music', label: '08-music' },
  { id: 'media', label: '09-media' },
  { id: 'contact', label: '10-contact' },
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture(page, name, fullPage = false) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage });
  console.log(`  📸 ${file}`);
  return file;
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(t);
    document.documentElement.style.colorScheme = t;
  }, theme);
  await sleep(500);
}

async function runDesktop(theme) {
  console.log(`\n[Desktop 1920x1080 - ${theme}]`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('Open page');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await setTheme(page, theme);
  await sleep(1000);

  console.log('Full page');
  await capture(page, `${theme}-desktop-00-fullpage`, true);

  for (const section of SECTIONS) {
    console.log(`Scroll to #${section.id}`);
    const el = page.locator(`#${section.id}`).first();
    try {
      await el.scrollIntoViewIfNeeded({ timeout: 5000 });
      await sleep(800);
      await capture(page, `${theme}-desktop-${section.label}`);
    } catch (err) {
      console.warn(`  ⚠️ #${section.id} not found: ${err.message}`);
    }
  }

  // Command palette
  console.log('Open Cmd+K');
  await page.keyboard.press('Control+k');
  await sleep(800);
  await capture(page, `${theme}-desktop-cmdk-open`);
  await page.keyboard.press('Escape');
  await sleep(500);

  // AI Chat
  console.log('Open AI Chat');
  await page.getByRole('button', { name: 'AI 助手' }).first().click();
  await sleep(500);
  await capture(page, `${theme}-desktop-ai-open`);

  console.log('Ask AI');
  const input = page.getByPlaceholder(/输入问题/).first();
  await input.fill('你是谁？');
  await input.press('Enter');
  const loading = page.locator('[role="dialog"] .self-start', { hasText: 'AI 思考中' }).first();
  await loading.waitFor({ state: 'visible', timeout: 10000 });
  await loading.waitFor({ state: 'hidden', timeout: 120000 });
  await sleep(1000);
  await capture(page, `${theme}-desktop-ai-response`);

  await browser.close();
}

async function runMobile(theme) {
  console.log(`\n[Mobile 375x812 - ${theme}]`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();

  console.log('Open page');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await setTheme(page, theme);
  await sleep(1000);
  await capture(page, `${theme}-mobile-00-hero`);

  for (const section of ['about', 'projects', 'skills', 'contact']) {
    console.log(`Scroll to #${section}`);
    const el = page.locator(`#${section}`).first();
    try {
      await el.scrollIntoViewIfNeeded({ timeout: 5000 });
      await sleep(800);
      await capture(page, `${theme}-mobile-${section}`);
    } catch (err) {
      console.warn(`  ⚠️ #${section} not found: ${err.message}`);
    }
  }

  await browser.close();
}

async function main() {
  await runDesktop('dark');
  await runDesktop('light');
  await runMobile('dark');
  await runMobile('light');
  console.log(`\n✅ Screenshots saved to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
