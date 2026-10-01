// Exports the deck to talk/out/deck.pdf, one page per slide, using reveal's print-pdf mode.
// Usage: npx vite --port 5179 & node talk/pdf.mjs [url]
import puppeteer from 'puppeteer';
import { mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:5179/';
const outDir = new URL('./out/', import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
	headless: true,
	executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});
const page = await browser.newPage();
await page.goto(url.replace(/\/?(\?.*)?$/, '/?print-pdf'), { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.Reveal && window.Reveal.isReady());
await new Promise((r) => setTimeout(r, 1500));
await page.pdf({ path: outDir + 'deck.pdf', preferCSSPageSize: true, printBackground: true });
console.log(`wrote ${outDir}deck.pdf`);
await browser.close();
