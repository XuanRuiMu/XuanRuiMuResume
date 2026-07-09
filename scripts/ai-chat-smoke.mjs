import { chromium } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    console.log(`[1/6] 打开页面 ${BASE_URL}`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'scripts/ai-chat-smoke-01-hero.png' });

    console.log('[2/6] 点击 AI 助手悬浮按钮');
    const aiButton = page.getByRole('button', { name: 'AI 助手' }).first();
    await aiButton.waitFor({ state: 'visible', timeout: 10000 });
    await aiButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'scripts/ai-chat-smoke-02-opened.png' });

    // 检查是否显示“当前使用本地规则引擎回答”或 LLM 模式
    const localModeBadge = page.locator('text=当前使用本地规则引擎回答').first();
    const hasLocalBadge = await localModeBadge.isVisible().catch(() => false);
    if (hasLocalBadge) {
      console.warn('⚠️ 未检测到 API Key，正在使用本地规则引擎。请检查 .env.local 是否被 Vite 加载。');
    } else {
      console.log('✅ 已检测到 API Key，将调用 DeepSeek LLM');
    }

    console.log('[3/6] 输入问题并发送');
    const input = page.getByPlaceholder('输入问题，例如：你是谁 / 你的技术栈 / 介绍一下暮澜纪元').first();
    await input.fill('你是谁？请简单介绍一下你的技术栈。');
    await input.press('Enter');

    console.log('[4/6] 等待 AI 回复完成（最多 120s）');
    const loadingLocator = page.locator('[role="dialog"] .self-start', { hasText: 'AI 思考中' }).first();
    await loadingLocator.waitFor({ state: 'visible', timeout: 10000 });
    await loadingLocator.waitFor({ state: 'hidden', timeout: 120000 });

    console.log('[5/6] 读取最终回复');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'scripts/ai-chat-smoke-03-response.png' });

    const responseLocator = page.locator('[role="dialog"] .self-start').last();
    const responseText = await responseLocator.textContent();
    console.log('AI 回复内容预览：');
    console.log(responseText.slice(0, 500));

    if (responseText.includes('发送失败') || responseText.includes('AI 思考中') || responseText.length < 10) {
      throw new Error(`AI 回复异常：${responseText.slice(0, 100)}`);
    }

    console.log('\n✅ AI 助手实机测试通过');
  } catch (err) {
    await page.screenshot({ path: 'scripts/ai-chat-smoke-error.png' });
    console.error('\n❌ AI 助手实机测试失败:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
