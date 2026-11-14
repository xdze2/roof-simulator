// Regenerates docs/screenshots/*.png. Run: npm run screenshots
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const outDir = fileURLToPath(new URL('../docs/screenshots/', import.meta.url));
mkdirSync(outDir, { recursive: true });

const server = await createServer({ server: { port: 5199, strictPort: false, host: '127.0.0.1' }, logLevel: 'error' });
await server.listen();
const base = server.resolvedUrls.local[0]; // includes the configured base path

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.warn('page error:', e.message));
  const open = async (query = '') => {
    await page.goto(base + query, { waitUntil: 'load' });
    await page.waitForSelector('canvas');
    await page.waitForTimeout(1500); // let three.js render a few frames
  };
  const shot = async (name) => {
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${outDir}${name}.png` });
    console.log('saved', `docs/screenshots/${name}.png`);
  };

  await open('?preset=U');
  await shot('main');

  await open('?preset=L');
  await page.check('#iso');
  await shot('isolines');

} finally {
  await browser.close();
  await server.close();
}
