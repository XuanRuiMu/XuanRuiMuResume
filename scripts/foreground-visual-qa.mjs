import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const ROOT_DIR = process.cwd();
const OUT_DIR = process.env.OUT_DIR || path.join(ROOT_DIR, 'screenshots-qa');

const SECTIONS = [
  { id: 'hero', label: '01-hero', tp: 'TP-01' },
  { id: 'about', label: '02-about', tp: 'TP-02' },
  { id: 'projects', label: '03-projects', tp: 'TP-03' },
  { id: 'skills', label: '04-skills', tp: 'TP-04' },
  { id: 'experience', label: '05-experience', tp: 'TP-05' },
  { id: 'education', label: '06-education', tp: 'TP-06' },
  { id: 'design', label: '07-design', tp: 'TP-07' },
  { id: 'music', label: '08-music', tp: 'TP-08' },
  { id: 'media', label: '09-media', tp: 'TP-09' },
  { id: 'contact', label: '10-contact', tp: 'TP-10' },
];

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 812 },
};

const THEMES = ['dark', 'light'];

function dir(...parts) {
  const full = path.join(OUT_DIR, ...parts);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
  return full;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture(page, subPath, name, fullPage = false) {
  const folder = dir(subPath);
  const file = path.join(folder, `${name}.png`);
  await page.screenshot({ path: file, fullPage });
  console.log(`  [截图] ${file}`);
  return file;
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(t);
    document.documentElement.style.colorScheme = t;
    window.dispatchEvent(new Event('theme-visual-qa'));
  }, theme);
  await sleep(600);
}

async function scrollToSection(page, sectionId) {
  const el = page.locator(`#${sectionId}`).first();
  await el.scrollIntoViewIfNeeded({ timeout: 10000 });
  // 将区块滚动到视口中部，确保 scroll-reveal 动画已完成
  await page.evaluate((id) => {
    const element = document.getElementById(id);
    if (element) {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;
      const offset = viewportCenter - elementCenter;
      window.scrollBy({ top: offset, behavior: 'instant' });
    }
  }, sectionId);
  await sleep(800);
}

async function runViewportScenario(viewport, theme) {
  const isDesktop = viewport === 'desktop';
  const vp = VIEWPORTS[viewport];
  const scenarioPath = `${viewport}/${theme}`;

  console.log(`\n[${isDesktop ? '桌面' : '移动'} ${vp.width}x${vp.height} - ${theme === 'dark' ? '深色' : '浅色'}模式]`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: vp, reducedMotion: 'reduce' });
  const page = await context.newPage();

  console.log('加载页面');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await setTheme(page, theme);
  await sleep(1200);

  // TP-01 ~ TP-10: 各主要区块截图
  console.log('全页截图');
  await capture(page, scenarioPath, '00-fullpage', true);

  for (const section of SECTIONS) {
    console.log(`滚动到 #${section.id} (${section.tp})`);
    try {
      await scrollToSection(page, section.id);
      await capture(page, scenarioPath, section.label);
    } catch (err) {
      console.warn(`  ⚠️ #${section.id} 未找到: ${err.message}`);
    }
  }

  // TP-11: 导航 / Cmd+K / 主题切换
  if (isDesktop) {
    console.log('点击导航：项目');
    await page.getByRole('button', { name: '项目', exact: true }).first().click();
    await sleep(600);
    await capture(page, scenarioPath, '11-nav-projects');

    console.log('点击导航：联系');
    await page.getByRole('button', { name: '联系', exact: true }).first().click();
    await sleep(600);
    await capture(page, scenarioPath, '11-nav-contact');

    console.log('打开 Cmd+K 命令面板');
    await page.locator('main').click();
    await page.keyboard.press('Control+k');
    await sleep(800);
    await capture(page, scenarioPath, '11-cmdk-open');

    console.log('Cmd+K 选择经历');
    await page.getByRole('option', { name: '经历' }).first().click();
    await sleep(800);
    await capture(page, scenarioPath, '11-cmdk-experience');

    console.log('主题切换');
    const toggle = page.getByRole('button', { name: /^深色模式|浅色模式|跟随系统$/ });
    await toggle.click();
    await sleep(600);
    await toggle.click();
    await sleep(600);
    await capture(page, scenarioPath, '11-theme-toggle');
  }

  // TP-12: AI 助手
  console.log('打开 AI 助手');
  const aiButton = page.getByRole('button', { name: 'AI 助手' }).first();
  await aiButton.waitFor({ state: 'visible', timeout: 10000 });
  await aiButton.click();
  await sleep(600);
  await capture(page, scenarioPath, '12-ai-open');

  console.log('AI 助手提问');
  const input = page.getByPlaceholder(/输入问题/).first();
  await input.fill('请简单介绍一下你的技术栈');
  await input.press('Enter');

  const loading = page.locator('[role="dialog"] .self-start', { hasText: 'AI 思考中' }).first();
  try {
    await loading.waitFor({ state: 'visible', timeout: 10000 });
    await loading.waitFor({ state: 'hidden', timeout: 120000 });
  } catch (err) {
    console.warn(`  ⚠️ AI 加载状态等待异常: ${err.message}`);
  }
  await sleep(1200);
  await capture(page, scenarioPath, '12-ai-response');

  // 移动端：测试关闭 AI 助手后界面
  if (!isDesktop) {
    const closeButton = page.getByRole('button', { name: '关闭' }).first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
      await sleep(400);
      await capture(page, scenarioPath, '12-ai-closed');
    }
  }

  await browser.close();
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // 验证预览服务器可达
  console.log(`验证预览服务器: ${BASE_URL}`);
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    console.log('  服务器已就绪');
  } catch (err) {
    console.error(`❌ 无法连接到预览服务器: ${err.message}`);
    console.error('请先在项目目录执行 npm run preview');
    process.exit(1);
  }

  for (const viewport of Object.keys(VIEWPORTS)) {
    for (const theme of THEMES) {
      await runViewportScenario(viewport, theme);
    }
  }

  console.log(`\n✅ 前台视觉 QA 完成，截图保存至: ${OUT_DIR}`);
  console.log(`   桌面深色: ${path.join(OUT_DIR, 'desktop', 'dark')}`);
  console.log(`   桌面浅色: ${path.join(OUT_DIR, 'desktop', 'light')}`);
  console.log(`   移动深色: ${path.join(OUT_DIR, 'mobile', 'dark')}`);
  console.log(`   移动浅色: ${path.join(OUT_DIR, 'mobile', 'light')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
