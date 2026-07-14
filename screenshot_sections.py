from playwright.sync_api import sync_playwright
import time
import os

out_dir = r"D:\\XiTongWenJianJia\\ZhuoMian\\燃烧之陨我的世界服务端\\个人简历\\screenshots"
os.makedirs(out_dir, exist_ok=True)

sections = ["media", "contact", "design", "education", "music"]

def take_screenshots(theme: str):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto("http://localhost:5180/", wait_until="networkidle", timeout=60000)
        time.sleep(3)
        if theme == "light":
            page.evaluate("document.documentElement.classList.add('light')")
        else:
            page.evaluate("document.documentElement.classList.remove('light')")
        time.sleep(1)
        for section in sections:
            elem = page.locator(f"section#{section}")
            if elem.count() > 0:
                elem.scroll_into_view_if_needed()
                time.sleep(0.3)
                # 将 section 滚动到视口中央，确保 scroll-reveal 动画完成
                page.evaluate(f"""
                    const el = document.querySelector('section#{section}');
                    if (el) {{
                        const rect = el.getBoundingClientRect();
                        const targetY = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
                        window.scrollTo({{ top: targetY, behavior: 'instant' }});
                    }}
                """)
                time.sleep(1.2)
                path = os.path.join(out_dir, f"{section}_{theme}.png")
                elem.screenshot(path=path)
                print(f"Saved {path}")
        browser.close()

take_screenshots("dark")
take_screenshots("light")
