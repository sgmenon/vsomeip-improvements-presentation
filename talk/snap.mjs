// Renders every slide (with all fragments shown) to talk/out/slide-NN.png.
// Usage: npx vite --port 5179 & node talk/snap.mjs [url]
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
await page.setViewport({ width: 1280, height: 720 });
await page.goto(url, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.Reveal && window.Reveal.isReady());

await page.evaluate(() => Reveal.configure({ transition: 'none', backgroundTransition: 'none' }));
const positions = await page.evaluate(() => Reveal.getSlides().map((s) => Reveal.getIndices(s)));
const total = positions.length;
for (let i = 0; i < total; i++) {
	await page.evaluate(({ h, v }) => {
		Reveal.slide(h, v ?? 0, Number.MAX_SAFE_INTEGER);
	}, positions[i]);
	await new Promise((r) => setTimeout(r, 350));
	const name = `slide-${String(i + 1).padStart(2, '0')}.png`;
	await page.screenshot({ path: outDir + name });
}
console.log(`wrote ${total} slides to ${outDir}`);
await browser.close();
