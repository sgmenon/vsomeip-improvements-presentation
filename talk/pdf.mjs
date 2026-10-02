// Exports the deck to talk/out/deck.pdf, one page per slide, using reveal's print-pdf mode.
// Usage: node talk/pdf.mjs [url]   (without a url, serves the repo with vite on a free port)
import puppeteer from 'puppeteer';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const outDir = new URL('./out/', import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

let server;
let url = process.argv[2];
if (!url) {
	server = await createServer({ root, logLevel: 'error', server: { port: 0 } });
	await server.listen();
	url = server.resolvedUrls.local[0];
}

const browser = await puppeteer.launch({
	headless: true,
	executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});
try {
	const page = await browser.newPage();
	await page.goto(url.replace(/\/?(\?.*)?$/, '/?print-pdf'), { waitUntil: 'networkidle0' });
	await page.waitForFunction(() => window.Reveal && window.Reveal.isReady());
	await new Promise((r) => setTimeout(r, 1500));
	await page.pdf({ path: outDir + 'deck.pdf', preferCSSPageSize: true, printBackground: true });
	console.log(`wrote ${outDir}deck.pdf`);
} finally {
	await browser.close();
	await server?.close();
}
