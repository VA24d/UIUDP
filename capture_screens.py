import asyncio
from playwright.async_api import async_playwright
import time
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Create a 1920x1080 viewport for nice high-res screenshots
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        
        # Grant microphone permissions so the page doesn't block on the prompt
        await context.grant_permissions(['microphone'])
        
        page = await context.new_page()
        
        print("Loading page...")
        await page.goto("http://localhost:8081")
        
        # Wait for initial load
        await page.wait_for_timeout(2000)
        
        # Ensure we have an output directory
        if not os.path.exists('screenshots'):
            os.makedirs('screenshots')
            
        print("Capturing Step 1: Profile...")
        await page.screenshot(path="screenshots/step1.png")
        
        print("Capturing Step 2: Comfort...")
        await page.evaluate("loadStep(2)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="screenshots/step2.png")
        
        print("Capturing Step 3: Location...")
        await page.evaluate("loadStep(3)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="screenshots/step3.png")
        
        print("Capturing Step 4: Learn...")
        await page.evaluate("loadStep(4)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="screenshots/step4.png")
        
        print("Capturing Step 5: Take-Over...")
        await page.evaluate("loadStep(5)")
        await page.wait_for_timeout(2000) # Wait for stage 1
        await page.screenshot(path="screenshots/step5.png")
        
        print("Capturing Step 6: Tuning...")
        await page.evaluate("loadStep(6)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="screenshots/step6.png")
        
        print("Capturing Step 7: Success...")
        await page.evaluate("loadStep(7)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="screenshots/step7.png")
        
        await browser.close()
        print("All screenshots captured successfully.")

if __name__ == "__main__":
    asyncio.run(main())
