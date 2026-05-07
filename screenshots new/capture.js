import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const baseUrl = 'http://localhost:8000';
    console.log(`Navigating to ${baseUrl}...`);
    
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    let visitedHashes = new Set();
    
    while (true) {
        const url = page.url();
        const hash = new URL(url).hash; 
        
        if (visitedHashes.has(hash)) {
            console.log(`Already visited this page (${hash}). Stopping.`);
            break;
        }
        visitedHashes.add(hash);

        let stage = "general";
        let step = "home";
        
        if (hash.startsWith('#/')) {
            const parts = hash.slice(2).split('/');
            if (parts.length >= 1 && parts[0]) stage = parts[0];
            if (parts.length >= 2 && parts[1]) step = parts[1];
            else if (parts.length === 1) step = parts[0];
        }

        const outputDir = path.join(process.cwd(), stage);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const screenshotPath = path.join(outputDir, `${step}.png`);
        console.log(`Taking screenshot: ${hash} -> ${screenshotPath}`);
        
        await page.screenshot({ path: screenshotPath, fullPage: true });

        // Check if we are at the end
        const isEnd = await page.evaluate(() => {
            return !!document.querySelector('[data-nav="end"]');
        });

        if (isEnd) {
            console.log('End indicator found. We reached the end.');
            break;
        }

        const previousHash = hash;

        // Press ArrowRight to advance
        await page.keyboard.press('ArrowRight');

        // Wait for hash to change
        let changed = false;
        for(let i=0; i<20; i++) {
            await new Promise(r => setTimeout(r, 250)); // check every 250ms
            const curUrl = page.url();
            const curHash = new URL(curUrl).hash;
            if (curHash !== previousHash) {
                changed = true;
                break;
            }
        }
        
        if (!changed) {
            console.log('Pressed ArrowRight but hash did not change after 5 seconds. Stopping.');
            break;
        }
        
        // Wait extra time for animations and rendering to settle
        await new Promise(r => setTimeout(r, 1000));
    }

    await browser.close();
    console.log('Done.');
})();
