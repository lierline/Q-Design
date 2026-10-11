import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, '../Q-Works/package.json'));
const { chromium } = require('@playwright/test');
const temp = resolve(root, '../tmp/maison-pages-audit');
const evidence = join(root, 'reviews/maison-pages');
mkdirSync(temp, { recursive: true });
mkdirSync(evidence, { recursive: true });
process.env.TEMP = temp;
process.env.TMP = temp;
const browser = await chromium.launch({ channel: 'msedge', headless: true, env: { ...process.env, TEMP: temp, TMP: temp } });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto('http://127.0.0.1:3601/login', { waitUntil: 'networkidle', timeout: 120000 });
  await page.locator('#email').fill('dev@q-maison.local');
  await page.locator('#password').fill('qworks-local-dev');
  await page.locator('button[type=submit]').click();
  await page.waitForURL('**/dashboard', { timeout: 120000 });
  await page.locator('main').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await context.storageState({ path: join(temp, 'admin-session.json') });
  await page.screenshot({ path: join(evidence, 'first-dashboard-1440.png') });
  const result = await page.evaluate(() => ({ url: location.pathname, title: document.title, heading: document.querySelector('h1')?.textContent, mainText: document.querySelector('main')?.textContent?.slice(0, 400), links: [...document.querySelectorAll('a[href]')].map(link => link.getAttribute('href')) }));
  writeFileSync(join(evidence, 'first-login.json'), JSON.stringify({ ...result, errors }, null, 2) + '\n');
  console.log(JSON.stringify({ ...result, links: result.links.length, errors }, null, 2));
} finally { await context.close(); await browser.close(); }
