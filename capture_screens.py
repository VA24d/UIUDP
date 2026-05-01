import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        await context.grant_permissions(['microphone'])
        page = await context.new_page()

        print("Loading page...")
        await page.goto("http://localhost:8081")
        await page.wait_for_timeout(2000)

        if not os.path.exists('screenshots'):
            os.makedirs('screenshots')

        # ── Step 1: Profile ──
        print("Step 1: Profile...")
        await page.screenshot(path="screenshots/step1.png")

        # ── Step 2: Comfort ──
        print("Step 2: Comfort...")
        await page.evaluate("loadStep(2)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="screenshots/step2.png")

        # ── Step 3: Location ──
        print("Step 3: Location...")
        await page.evaluate("loadStep(3)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="screenshots/step3.png")

        # ── Step 4: Education — all 4 slides ──
        print("Step 4: Education slide 1 (CAN/CAN'T)...")
        await page.evaluate("loadStep(4)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="screenshots/step4_slide1.png")

        print("Step 4: Education slide 2 (Safety Shield)...")
        await page.evaluate("goSlide(2)")
        await page.wait_for_timeout(800)
        await page.screenshot(path="screenshots/step4_slide2.png")

        print("Step 4: Education slide 3 (Charging)...")
        await page.evaluate("goSlide(3)")
        await page.wait_for_timeout(800)
        await page.screenshot(path="screenshots/step4_slide3.png")

        print("Step 4: Education slide 4 (Take-Over)...")
        await page.evaluate("goSlide(4)")
        await page.wait_for_timeout(800)
        await page.screenshot(path="screenshots/step4_slide4.png")

        # Keep step4.png as the default (slide 1)
        await page.evaluate("goSlide(1)")
        await page.wait_for_timeout(500)
        await page.screenshot(path="screenshots/step4.png")

        # ── Step 5: Simulation — stages ──
        print("Step 5: Simulation stage 1 (Cruising)...")
        await page.evaluate("loadStep(5)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path="screenshots/step5_stage1.png")

        # Wait for warning stage (3 seconds after init)
        print("Step 5: Simulation stage 2 (Warning)...")
        await page.wait_for_timeout(2500)
        await page.screenshot(path="screenshots/step5_stage2.png")

        # Wait a few seconds for countdown to progress
        print("Step 5: Simulation countdown at ~5s...")
        await page.wait_for_timeout(4000)
        await page.screenshot(path="screenshots/step5_countdown.png")

        # Keep step5.png as the default (stage 1 start)
        await page.screenshot(path="screenshots/step5.png")

        # ── Step 6: Tuning ──
        print("Step 6: Tuning...")
        await page.evaluate("loadStep(6)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="screenshots/step6.png")

        # ── Step 7: Success ──
        print("Step 7: Success...")
        await page.evaluate("loadStep(7)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="screenshots/step7.png")

        await browser.close()
        print("All screenshots captured successfully.")

if __name__ == "__main__":
    asyncio.run(main())
